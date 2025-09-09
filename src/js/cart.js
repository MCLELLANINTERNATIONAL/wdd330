import { getLocalStorage, setClick } from './utils.mjs';

function renderCartContents() {
  const cartItems = getLocalStorage('so-cart');
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    document.querySelector('.product-list').innerHTML =
      '<p>Your cart is empty.</p>';
    return;
  }

  const htmlItems = cartItems.map((item) => cartItemTemplate(item));
  document.querySelector('.product-list').innerHTML = htmlItems.join('');
  // foreach (item in htmlItems) {
  //   setClick(item, removeItemFromCart);
  // }
}

function cartItemTemplate(item) {
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
  <span id='${item.Id}' class='close_button'>X</span>
  <p class='cart-card__price'>$${item.FinalPrice}</p>
</li>`;

// setClick(this, removeItemFromCart);

  return newItem;
}

renderCartContents();

function removeItemFromCart() {

}