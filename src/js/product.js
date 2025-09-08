import { getLocalStorage, setLocalStorage } from './utils.mjs';
import ProductData from './ProductData.mjs';

const dataSource = new ProductData('tents');

function addProductToCart(product) {
  const cart = getLocalStorage('so-cart'); // always an array per your utils
  cart.push(product);
  setLocalStorage('so-cart', cart);
  updateCartBadge(cart.length);
}

export function updateCartBadge(count) {
  const badge = document.getElementById('cart-badge');
  badge.style.display = (count > 0) ? 'flex' : 'none';
  badge.textContent = count;
}

// add to cart button event handler
async function addToCartHandler(e) {
  const id = e.target.dataset.id;
  if (!id) return; // defensive guard

  const product = await dataSource.findProductById(id);
  if (!product) return;

  addProductToCart(product);
}

// adding listener to when the page is reloaded, to display the correct cart badge information.
document.addEventListener('DOMContentLoaded', () => {
  const cartList = getLocalStorage('so-cart') || [];
  console.log('Main page cartList:', cartList);
  updateCartBadge(cartList.length);
});

// add listener to Add to Cart button if it exists
const addToCartBtn = document.getElementById('addToCart');
if (addToCartBtn) {
  addToCartBtn.addEventListener('click', addToCartHandler);
}
