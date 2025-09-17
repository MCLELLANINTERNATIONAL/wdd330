import { renderListWithTemplate } from './utils.mjs';

function cartItemTemplate(item) {
  const FinalPrice = Number(item.FinalPrice); // Simple number conversion
  const discountPrice = FinalPrice * 0.1; // 10% of FinalPrice
  const newItem = `<li class='cart-card divider'>
    <a href='#' class='cart-card__image'>
        <img
        src='${item.Image}'
        alt='${item.Name}'
        />
    </a>
    <a href='#'>
        <h2 class='card__name'>${item.Name}</h2>
    </a>
    <p class='cart-card__color'>${item.Colors?.[0]?.ColorName ?? ''}</p>
    <p class='cart-card__quantity'>qty: 1</p>
    <p class='cart-card__price'>$${FinalPrice.toFixed(2)}<br>Discount 10%: -$${discountPrice.toFixed(2)}</p></li>`;

  return newItem;
}

export default class ShoppingCart {
    constructor(dataSource, listElement) {
      // You passed in this information to make the class as reusable as possible.
      // Being able to define these things when you use the class will make it very flexible
      this.dataSource = dataSource;
      this.listElement = typeof listElement === 'string'
      ? document.querySelector(listElement)
      : listElement;

    this.cart = [];
    }
  
    async init() {
        this.cart = this.dataSource;
        this.renderList(this.cart);
    }
    
  renderList(cart) {
    if (!Array.isArray(this.cart) || this.cart.length === 0) {
        this.listElement.innerHTML =
        '<p>Your cart is empty.</p>';
        return;
    }
    const htmlItems = cart.map((item) => cartItemTemplate(item));
    this.listElement.innerHTML = htmlItems.join('');
  }
}