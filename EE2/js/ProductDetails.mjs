import { getLocalStorage, setLocalStorage, updateCartBadge, bounceCartIcon, getParam } from './utils.mjs';

export default class ProductDetails {
  constructor(productOrId, dataSource) {
    this.dataSource = dataSource;
    
    if (typeof productOrId === 'object') {
      // already have product data
      this.product = productOrId;
      this.productId = productOrId.Id;
    } else {
      this.productId = productOrId;
      this.product = null;
    }
  }
    async init() {
        this.product = await this.dataSource.findProductById(this.productId);
        this.renderProductDetails();
        document
            .getElementById('addToCart')
            .addEventListener('click', this.addProductToCart.bind(this));
        //ensure badge correct on load
        updateCartBadge();
    }
    async addProductToCart() {
        this.product = await this.dataSource.findProductById(this.productId);
        const cart = getLocalStorage('so-cart') || [];
        const productId = this.product.Id
        const existing = cart.find(item => item.Id === productId);

        // compute per-unit pricing once here
        const { finalPrice, comparePrice, discountPct, saveAmount } = computeDiscount(this.product);

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
          const item = { ...this.product };
          item.quantity        = 1;
          item._discountPct    = discountPct;
          item._discountAmount = Number(saveAmount.toFixed(2));
          item._finalPrice     = Number(finalPrice.toFixed(2));
          item._comparePrice   = Number(comparePrice.toFixed(2));
          cart.push(item);
        }

          alert(`${this.product.Name} has been added to your cart.`);
          setLocalStorage('so-cart', cart);
          updateCartBadge();
          bounceCartIcon();
      }

    renderProductDetails() {
        productDetailsTemplate(this.product);
    }
}

function firstNumber(...candidates) {
    for (const c of candidates) {
      const n = Number(c);
      if (!Number.isNaN(n) && n > 0) return n;
    }
    return null;
  }
  
  // Deterministic 10–40% based on product.Id (so it stays stable)
  function seededPercent(id, min = 10, max = 40) {
    const s = String(id ?? '');
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    }
    const span = max - min + 1;
    return min + (hash % span); // integer in [min, max]
  }
  
  function computeDiscount(product) {
    const finalPrice = Number(product.FinalPrice);
  
    // Try to find a real "compare at" price from common API fields
    const compareAt = firstNumber(
      product.SuggestedRetailPrice,
      product.ListPrice,
      product.MSRP,
      product.Price,
      product?.Colors?.[0]?.Price
    );
  
    let discountPct, comparePrice;
  
    if (compareAt && compareAt > finalPrice) {
      // Compute actual % then clamp to 10–40
      const rawPct = Math.round(((compareAt - finalPrice) / compareAt) * 100);
      discountPct = Math.min(40, Math.max(10, rawPct));
      comparePrice = finalPrice / (1 - discountPct / 100);
    } else {
      // No compare-at available → generate deterministic 10–40%
      discountPct = seededPercent(product.Id, 10, 40);
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

function productDetailsTemplate(product) {
    document.querySelector('h2').textContent = product.Brand.Name; 
    document.querySelector('h3').textContent = product.NameWithoutBrand; 
   
    const productImage = document.getElementById('productImage'); 
    productImage.src = product.Images.PrimaryLarge; 
    productImage.srcset = `
    ${product.Images.PrimaryLarge} 320w,
    ${product.Images.PrimaryExtraLarge} 600w`;
    productImage.sizes = '(max-width: 600px) 100vw, 600px';
    productImage.alt = product.NameWithoutBrand;

  function money(n) { return `$${Number(n).toFixed(2)}`; }

    // --- Discount logic & pricing UI ---
  const { finalPrice, comparePrice, discountPct, saveAmount } = computeDiscount(product);

  // Price row
  const priceEl = document.getElementById('productPrice');
  if (priceEl) {
    priceEl.innerHTML = `
    <div class="price-compare" aria-label="Original price">${money(comparePrice)}</div>
    <div class="price-discount" aria-label="Discount amount">Discount ${discountPct}%: -${money(saveAmount)}</div>
    <div class="price-final" aria-label="New price">${money(finalPrice)}</div>
  `;
}

  const saveEl = document.getElementById('productSave');
  if (saveEl) {
    saveEl.textContent = `You save $${saveAmount.toFixed(2)} (${discountPct}% off)`;
  }

  // --- Discount flag on image ONLY ---
  const img = document.getElementById('productImage');
  if (img) {
    // Ensure a positioned wrapper around the image
    let wrapper = img.closest('.product-media');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = "product-media";
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
    const descEl = document.getElementById('productDesc');
    if (descEl) {
        descEl.innerHTML = product.DescriptionHtmlSimple ?? '';
    }

    // Color
    const colorEl = document.getElementById('productColor');
    if (colorEl) {
        colorEl.textContent = product?.Colors?.[0]?.ColorName ?? '—';
    }

    // Ensure addToCart has id
    const addBtn = document.getElementById('addToCart');
    if (addBtn) addBtn.dataset.id = product.Id;

    // document.getElementById('productPrice').textContent = product.FinalPrice; 
    //document.getElementById('productColor').textContent = product.Colors[0].ColorName; 
    // document.getElementById('productDesc').innerHTML = product.DescriptionHtmlSimple; 
    //document.getElementById('addToCart').dataset.id = product.Id; 
}

export function renderProductDetailsHTML(product) {
  const { finalPrice, comparePrice, discountPct, saveAmount } = computeDiscount(product);

  function money(n) { return `$${Number(n).toFixed(2)}`; }
  return `
    <a href="../product_pages/index.html?category=${getParam('category')}&id=${encodeURIComponent(product.Id)}">
      <div class="product-modal">
        <div id="discountFlag" class="discount-flag">${discountPct}% off</div>
        <img 
          src="${product.Images.PrimaryMedium}" 
          srcset="
            ${product.Images.PrimarySmall} 80w,
            ${product.Images.PrimaryMedium} 160w
          "
          sizes="(max-width: 600px) 50vw, 160px"
          alt="${product.NameWithoutBrand}"
        >
        <h2>${product.Brand?.Name ?? ''}</h2>
        <h3>${product.NameWithoutBrand ?? product.Name}</h3>
        <p class="price-final">Price: ${money(finalPrice)}</p>
        <p class="description">${product.DescriptionHtmlSimple ?? ''}</p>
      </a>
      <button id="addToCartModal" data-id="${product.Id}">Add to Cart</button>
    </div>
  `;
}