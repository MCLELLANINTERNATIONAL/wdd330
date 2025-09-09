import { getLocalStorage, setLocalStorage } from './utils.mjs';
import ProductData from './ProductData.mjs';

const dataSource = new ProductData('tents');

function addProductToCart(product) {
  const cart = getLocalStorage('so-cart'); // always an array per your utils
  cart.push(product);
  setLocalStorage('so-cart', cart);
}
// add to cart button event handler
async function addToCartHandler(e) {
  const id = e.target.dataset.id;
  if (!id) return; // defensive guard

  const product = await dataSource.findProductById(id);
  if (!product) return;

  addProductToCart(product);
}

// add listener to Add to Cart button
document
  .getElementById('addToCart')
  .addEventListener('click', addToCartHandler);
