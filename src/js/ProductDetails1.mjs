import { getLocalStorage, setLocalStorage, updateCartBadge } from './utils.mjs';
import { buildAutoCarousel } from './imageCarousel1.js';

export default class ProductDetails {
  constructor(productId, dataSource) {
    this.productId = productId;
    this.product = {};
    this.dataSource = dataSource;
  }

  async init() {
    this.product = await this.dataSource.findProductById(this.productId);
    this.renderProductDetails();

    const addBtn = document.getElementById('addToCart');
    if (addBtn) {
      addBtn.addEventListener('click', this.addProductToCart.bind(this));
    }
    updateCartBadge();
  }

  addProductToCart() {
    const cart = getLocalStorage('so-cart') || [];
    const productId = this.product.Id;
    const existing = cart.find((item) => item.Id === productId);

    const { finalPrice, comparePrice, discountPct, saveAmount } = computeDiscount(this.product);

    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;

      if (existing._discountPct == null) {
        existing._discountPct = discountPct;
        existing._discountAmount = Number(saveAmount.toFixed(2));
        existing._finalPrice = Number(finalPrice.toFixed(2));
        existing._comparePrice = Number(comparePrice.toFixed(2));
      }
    } else {
      const item = { ...this.product };
      item.quantity = 1;
      item._discountPct = discountPct;
      item._discountAmount = Number(saveAmount.toFixed(2));
      item._finalPrice = Number(finalPrice.toFixed(2));
      item._comparePrice = Number(comparePrice.toFixed(2));
      cart.push(item);
    }

    alert(`${this.product.Name} has been added to your cart.`);
    setLocalStorage('so-cart', cart);
    updateCartBadge();
  }

  renderProductDetails() {
    productDetailsTemplate(this.product);
  }
}

/* ------------------------- helpers ------------------------- */

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
    const rawPct = Math.round(((compareAt - finalPrice) / compareAt) * 100);
    discountPct = Math.min(40, Math.max(10, rawPct));
    comparePrice = finalPrice / (1 - discountPct / 100);
  } else {
    discountPct = seededPercent(product.Id, 10, 40);
    comparePrice = finalPrice / (1 - discountPct / 100);
  }

  const saveAmount = comparePrice - finalPrice;

  return { finalPrice, comparePrice, discountPct, saveAmount };
}

function collectImageUrls(product) {
  const urls = new Set();
  const push = (u) => {
    if (typeof u === 'string' && u.trim()) urls.add(u.trim());
  };

  const I = product?.Images || {};
  [I.PrimaryExtraLarge, I.PrimaryLarge, I.PrimaryMedium, I.PrimarySmall, I.SecondaryExtraLarge, I.SecondaryLarge].forEach(push);

  if (Array.isArray(I.AlternateImages)) {
    I.AlternateImages.forEach((ai) =>
      push(typeof ai === 'string' ? ai : (ai?.Url || ai?.Image || ai?.Src))
    );
  }

  if (Array.isArray(product?.Colors)) {
    product.Colors.forEach((c) => {
      const CI = c?.Images || {};
      [CI.PrimaryExtraLarge, CI.PrimaryLarge, CI.PrimaryMedium, CI.PrimarySmall, c?.ColorImage, c?.ImageUrl, c?.Image].forEach(push);
      if (Array.isArray(CI.AlternateImages)) {
        CI.AlternateImages.forEach((ai) =>
          push(typeof ai === 'string' ? ai : (ai?.Url || ai?.Image || ai?.Src))
        );
      }
    });
  }

  // Fallback so we always have at least one
  if (urls.size === 0 && product?.Images?.PrimaryLarge) push(product.Images.PrimaryLarge);

  // Keep order stable: primary first if present
  const ordered = [];
  const primaries = [I.PrimaryExtraLarge, I.PrimaryLarge, I.PrimaryMedium, I.PrimarySmall].filter(Boolean);
  primaries.forEach((p) => {
    if (urls.has(p)) {
      ordered.push(p);
      urls.delete(p);
    }
  });
  return [...ordered, ...urls];
}

/* ---------------------- main template ---------------------- */

function productDetailsTemplate(product) {
  const brandEl = document.querySelector('h2');
  const nameEl = document.querySelector('h3');
  if (brandEl) brandEl.textContent = product?.Brand?.Name || '';
  if (nameEl) nameEl.textContent = product?.NameWithoutBrand || product?.Name || '';

  // Optional: set the seed image if #productImage exists
  const productImage = document.getElementById('productImage');
  if (productImage && product?.Images) {
    productImage.src = product.Images.PrimaryLarge || '';
    productImage.srcset = [
      product.Images.PrimaryLarge ? `${product.Images.PrimaryLarge} 320w` : null,
      product.Images.PrimaryExtraLarge ? `${product.Images.PrimaryExtraLarge} 600w` : null,
    ].filter(Boolean).join(', ');
    productImage.sizes = '(max-width: 600px) 100vw, 600px';
    productImage.alt = product.NameWithoutBrand || product.Name || 'Product image';
  }

  const money = (n) => `$${Number(n).toFixed(2)}`;

  // --- Discount logic & pricing UI ---
  const { finalPrice, comparePrice, discountPct, saveAmount } = computeDiscount(product);

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

  // --- MEDIA: wrapper + flag + (carousel OR single image) ---
  function renderMedia() {
    // 1) Find or create a media wrapper we can rely on
    let wrapper =
      document.querySelector('.product-media') ||
      (document.getElementById('productImage') &&
        document.getElementById('productImage').closest('.product-media'));

    if (!wrapper) {
      const anchor =
        document.getElementById('productImage') ||
        document.getElementById('productPrice') ||
        document.querySelector('h2') ||
        document.body; // absolute fallback

      wrapper = document.createElement('div');
      wrapper.className = 'product-media';

      if (anchor && anchor.parentElement) {
        anchor.parentElement.insertBefore(wrapper, anchor);
      } else {
        document.body.appendChild(wrapper);
      }
    }

    // 2) Ensure/update discount flag
    let flag = wrapper.querySelector('#discountFlag');
    if (!flag) {
      flag = document.createElement('div');
      flag.id = 'discountFlag';
      flag.className = 'discount-flag';
      wrapper.prepend(flag);
    }
    flag.textContent = `${discountPct}% OFF`;
    flag.setAttribute('aria-label', `Discount ${discountPct} percent off`);

    // 3) Build URLs
    const urls = collectImageUrls(product).filter(Boolean);

    // Helper: render a single image safely
    const renderSingle = (url) => {
      let img = wrapper.querySelector('#productImage');
      if (!img) {
        img = document.createElement('img');
        img.id = 'productImage';
        wrapper.appendChild(img);
      }
      img.alt = product.NameWithoutBrand || product.Name || 'Product image';
      img.src = url || '';

      const large = product?.Images?.PrimaryLarge || null;
      const xlarge = product?.Images?.PrimaryExtraLarge || null;
      if (large || xlarge) {
        img.srcset = [
          large ? `${large} 320w` : null,
          xlarge ? `${xlarge} 600w` : null,
        ].filter(Boolean).join(', ');
        img.sizes = '(max-width: 600px) 100vw, 600px';
      } else {
        img.removeAttribute('srcset');
        img.removeAttribute('sizes');
      }
    };

    // 4) Carousel if 2+ images; otherwise single image
    if (urls.length >= 2) {
      Array.from(wrapper.children).forEach((n) => {
        if (n !== flag) n.remove();
      });

      buildAutoCarousel({
        wrapper,
        urls,
        productName: product.NameWithoutBrand || product.Name || 'Product',
        interval: 4000,
        keepFlag: true,
      });
    } else {
      const fallback =
        product?.Images?.PrimaryLarge ||
        urls[0] ||
        product?.Images?.PrimaryMedium ||
        product?.Images?.PrimarySmall ||
        '';
      Array.from(wrapper.children).forEach((n) => {
        if (n !== flag && n.id !== 'productImage') n.remove();
      });
      renderSingle(fallback);
    }
  }

  // Call the renderer
  renderMedia();

  // Description
  const descEl = document.getElementById('productDesc');
  if (descEl) {
    descEl.innerHTML = product?.DescriptionHtmlSimple ?? '';
  }

  // Color
  const colorEl = document.getElementById('productColor');
  if (colorEl) {
    colorEl.textContent = product?.Colors?.[0]?.ColorName ?? '—';
  }

  // Ensure addToCart has id
  const addBtn = document.getElementById('addToCart');
  if (addBtn) {
    addBtn.dataset.id = product.Id;
  }
}