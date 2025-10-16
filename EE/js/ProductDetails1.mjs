import { getLocalStorage, setLocalStorage, updateCartBadge, bounceCartIcon, getParam } from './utils.mjs';

export default class eventDetails {
  constructor(eventOrId, dataSource) {
    this.dataSource = dataSource;
    
    if (typeof eventOrId === 'object') {
      // already have event data
      this.event = eventOrId;
      this.eventId = eventOrId.Id;
    } else {
      this.eventId = eventOrId;
      this.event = null;
    }
  }
    async init() {
        this.event = await this.dataSource.findeventById(this.eventId);
        this.rendereventDetails();
        document
            .getElementById('addToCart')
            .addEventListener('click', this.addeventToCart.bind(this));
        //ensure badge correct on load
        updateCartBadge();
    }
    async addeventToCart() {
        this.event = await this.dataSource.findeventById(this.eventId);
        const cart = getLocalStorage('so-cart') || [];
        const eventId = this.event.Id
        const existing = cart.find(item => item.Id === eventId);

        // compute per-unit pricing once here
        const { finalPrice, comparePrice, discountPct, saveAmount } = computeDiscount(this.event);

        if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;

          if (existing._discountPct == null) {
            existing._discountPct   = discountPct;
            existing._discountAmount = Number(saveAmount.toFixed(2));
            existing._finalPrice     = Number(finalPrice.toFixed(2));
            existing._comparePrice   = Number(comparePrice.toFixed(2));
          }
        } else {
          // push a shallow clone with the discount metadata
          const item = { ...this.event };
          item.quantity        = 1;
          item._discountPct    = discountPct;
          item._discountAmount = Number(saveAmount.toFixed(2));
          item._finalPrice     = Number(finalPrice.toFixed(2));
          item._comparePrice   = Number(comparePrice.toFixed(2));
          cart.push(item);
        }

          alert(`${this.event.Name} has been added to your cart.`);
          setLocalStorage('so-cart', cart);
          updateCartBadge();
          bounceCartIcon();
      }

    rendereventDetails() {
        eventDetailsTemplate(this.event);
    }
}

function firstNumber(...candidates) {
    for (const c of candidates) {
      const n = Number(c);
      if (!Number.isNaN(n) && n > 0) return n;
    }
    return null;
  }
  
  // Deterministic 10–40% based on event.Id (so it stays stable)
  function seededPercent(id, min = 10, max = 40) {
    const s = String(id ?? '');
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    }
    const span = max - min + 1;
    return min + (hash % span); // integer in [min, max]
  }
  
  function computeDiscount(event) {
    const finalPrice = Number(event.FinalPrice);
  
    // Try to find a real "compare at" price from common API fields
    const compareAt = firstNumber(
      event.SuggestedRetailPrice,
      event.ListPrice,
      event.MSRP,
      event.Price,
      event?.Colors?.[0]?.Price
    );
  
    let discountPct, comparePrice;
  
    if (compareAt && compareAt > finalPrice) {
      // Compute actual % then clamp to 10–40
      const rawPct = Math.round(((compareAt - finalPrice) / compareAt) * 100);
      discountPct = Math.min(40, Math.max(10, rawPct));
      comparePrice = finalPrice / (1 - discountPct / 100);
    } else {
      // No compare-at available → generate deterministic 10–40%
      discountPct = seededPercent(event.Id, 10, 40);
      comparePrice = finalPrice / (1 - discountPct / 100);
    }
  
    const saveAmount = comparePrice - finalPrice;
  
    return {
      finalPrice,
      comparePrice,
      discountPct,
      saveAmount,
    };
  }

function eventDetailsTemplate(event) {
    document.querySelector('h2').textContent = event.Brand.Name; 
    document.querySelector('h3').textContent = event.NameWithoutBrand; 
   
    const eventImage = document.getElementById('eventImage'); 
    eventImage.src = event.Images.PrimaryLarge; 
    eventImage.srcset = `
    ${event.Images.PrimaryLarge} 320w,
    ${event.Images.PrimaryExtraLarge} 600w`;
    eventImage.sizes = '(max-width: 600px) 100vw, 600px';
    eventImage.alt = event.NameWithoutBrand;

  function money(n) { return `$${Number(n).toFixed(2)}`; }

    // --- Discount logic & pricing UI ---
  const { finalPrice, comparePrice, discountPct, saveAmount } = computeDiscount(event);

  // Price row
  const priceEl = document.getElementById('eventPrice');
  if (priceEl) {
    priceEl.innerHTML = `
    <div class="price-compare" aria-label="Original price">${money(comparePrice)}</div>
    <div class="price-discount" aria-label="Discount amount">Discount ${discountPct}%: -${money(saveAmount)}</div>
    <div class="price-final" aria-label="New price">${money(finalPrice)}</div>
  `;
}

  const saveEl = document.getElementById('eventSave');
  if (saveEl) {
    saveEl.textContent = `You save $${saveAmount.toFixed(2)} (${discountPct}% off)`;
  }

  // --- Discount flag on image ONLY ---
  const img = document.getElementById('eventImage');
  if (img) {
    // Ensure a positioned wrapper around the image
    let wrapper = img.closest('.event-media');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = "event-media";
        // Insert wrapper before image and move image inside it
        img.parentElement.insertBefore(wrapper, img);
        wrapper.appendChild(img);
    }

    // update the flag inside the wrapper
    let flag = wrapper.querySelector('#discountFlag');
    if (!flag) {
        flag = document.createElement('div');
        flag.id = 'discountFlag';
        flag.className = 'discount-flag';
        wrapper.prepend(flag);
    }
    flag.textContent = `${discountPct}% OFF`;
    flag.setAttribute('aria-label', `Discount ${discountPct} percent off`);
    }

    // Description
    const descEl = document.getElementById('eventDesc');
    if (descEl) {
        descEl.innerHTML = event.DescriptionHtmlSimple ?? '';
    }

    // Color
    const colorEl = document.getElementById('eventColor');
    if (colorEl) {
        colorEl.textContent = event?.Colors?.[0]?.ColorName ?? '—';
    }

    // Ensure addToCart has id
    const addBtn = document.getElementById('addToCart');
    if (addBtn) addBtn.dataset.id = event.Id;

    // document.getElementById('eventPrice').textContent = event.FinalPrice; 
    //document.getElementById('eventColor').textContent = event.Colors[0].ColorName; 
    // document.getElementById('eventDesc').innerHTML = event.DescriptionHtmlSimple; 
    //document.getElementById('addToCart').dataset.id = event.Id; 
}

export function rendereventDetailsHTML(event) {
  const { finalPrice, comparePrice, discountPct, saveAmount } = computeDiscount(event);

  function money(n) { return `$${Number(n).toFixed(2)}`; }
  return `
    <a href="../event_pages/index.html?category=${getParam('category')}&id=${encodeURIComponent(event.Id)}">
      <div class="event-modal">
        <div id="discountFlag" class="discount-flag">${discountPct}% off</div>
        <img 
          src="${event.Images.PrimaryMedium}" 
          srcset="
            ${event.Images.PrimarySmall} 80w,
            ${event.Images.PrimaryMedium} 160w
          "
          sizes="(max-width: 600px) 50vw, 160px"
          alt="${event.NameWithoutBrand}"
        >
        <h2>${event.Brand?.Name ?? ''}</h2>
        <h3>${event.NameWithoutBrand ?? event.Name}</h3>
        <p class="price-final">Price: ${money(finalPrice)}</p>
        <p class="description">${event.DescriptionHtmlSimple ?? ''}</p>
      </a>
      <button id="addToCartModal" data-id="${event.Id}">Add to Cart</button>
    </div>
  `;
}