import { getParam } from './utils.mjs';
import ProductData from './ProductData.mjs';
import ProductDetails from './ProductDetails.mjs';

const dataSource = new ProductData('tents');

const productId = getParam('product');
const productDetails = new ProductDetails(productId, dataSource);

// console.log(dataSource);
productDetails.init();

// console.log(dataSource.findProductById(productId));
export function updateCartBadge(count) {
  const badge = document.getElementById('cart-badge');
  badge.style.display = (count > 0) ? 'flex' : 'none';
  badge.textContent = count;
}

// adding listener to when the page is reloaded, to display the correct cart badge information.
document.addEventListener('DOMContentLoaded', () => {
  const cartList = getLocalStorage('so-cart') || [];
  console.log('Main page cartList:', cartList);
  updateCartBadge(cartList.length);
});