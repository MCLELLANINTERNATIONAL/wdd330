function cartItemTemplate(item) {
 // ensure quantity
 const qty = Number(item.quantity || 1);

 // per-unit final (after discount) coming from Product Details, fallback to API fields
 const unitFinal = Number(
   item?._finalPrice ?? item?.FinalPrice ?? item?.Price ?? item?.ListPrice ?? 0
 );

 // use the exact percent saved by Product Details if present; else derive from a compare-like price
 let unitPct = Number(item?._discountPct);
 if (!Number.isFinite(unitPct)) {
   const compareGuess = Number(
     item?._comparePrice ?? item?.Price ?? item?.ListPrice ?? item?.MSRP ?? item?.SuggestedRetailPrice ?? 0
   );
   unitPct =
     compareGuess > unitFinal
       ? Math.round(((compareGuess - unitFinal) / compareGuess) * 100)
       : 0;
 }

 // compute compare & per-unit save from final and %
 const unitCompare = unitPct > 0 ? unitFinal / (1 - unitPct / 100) : unitFinal;
 const unitSave = Math.max(unitCompare - unitFinal, 0);

 // line totals scale with qty
 const lineTotal = unitFinal * qty;
 const lineSave = unitSave * qty;

 const imgSrc =
   item?.Images?.PrimaryMedium ||
   item?.Images?.PrimarySmall ||
   item?.Images?.PrimaryLarge ||
   '';
 const alt = item?.Name ?? "Product";
  
  
  return `
  <li class='cart-card divider' data-id='${item.Id}'>
    <div>
      <a href='#' class='cart-card__image'>
        <img src='${imgSrc}' alt='${alt}'/>
      </a>
    </div>
    <div>
      <a href='#'>
        <h2 class='card__name'>${item.Name}</h2>
      </a>
      <p class='cart-card__color'>${item.Colors?.[0]?.ColorName ?? ''}</p>
    </div>
    <div>
      <button class='cart-remove' data-id='${item.Id}'>X</button>
      <div class='cart-card__quantity-controls'>
        <button class='quantity-btn decrease-quantity' data-id='${item.Id}'>-</button>
        <p class='cart-card__quantity'>qty: <span class='item-quantity'>${qty}</span></p>
        <button class='quantity-btn increase-quantity' data-id='${item.Id}'>+</button>
      </div>
      <p class='cart-item-price'>Total: $${lineTotal.toFixed(2)}</p>
      <p class='cart-line-discount'>Discount ${unitPct}%: -$${lineSave.toFixed(2)}</p>
    </div>
  </li>`;
}

export default class ShoppingCart {
  constructor(dataSource, listElement) {
    this.dataSource = dataSource;
    this.listElement =
      typeof listElement === 'string'
        ? document.querySelector(listElement)
        : listElement;

    this.cart = [];
  }

  async init() {
    this.cart = this.dataSource;
    this.renderList(this.cart);
  }

  renderList(cart) {
    if (!Array.isArray(cart) || cart.length === 0) {
      this.listElement.innerHTML = 
        '<p>Your cart is empty.</p>';
      return;
    }
    const htmlItems = cart.map((item) => cartItemTemplate(item));
    this.listElement.innerHTML = htmlItems.join('');
  }
}