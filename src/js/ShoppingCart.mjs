function cartItemTemplate(item) {
  const FinalPrice = Number(item.FinalPrice); 
  const discountPrice = FinalPrice * 0.1; 
  item.quantity = item.quantity || 1; 
  
  return `
  <li class='cart-card divider' data-id='${item.Id}'>
    <div>
      <a href='#' class='cart-card__image'>
        <img src='${item.Images.PrimaryMedium}' alt='${item.Name}'/>
      </a>
    </div>
    <div>
      <a href='#'>
        <h2 class='card__name'>${item.Name}</h2>
      </a>
      <p class='cart-card__color'>${item.Colors?.[0]?.ColorName ?? ''}</p>
    </div>
    <div>
      <button class='cart-remove' data-id=${item.Id}>X</button>
      <div class='cart-card__quantity-controls'>
        <button class='quantity-btn decrease-quantity' data-id='${item.Id}'>-</button>
        <p class='cart-card__quantity'>qty: <span class='item-quantity'>${item.quantity}</span></p>
        <button class='quantity-btn increase-quantity' data-id='${item.Id}'>+</button>
      </div>
      <p class='cart-card__price'>
        $${FinalPrice.toFixed(2)}<br>
        Discount 10%: -$${discountPrice.toFixed(2)}
      </p>
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