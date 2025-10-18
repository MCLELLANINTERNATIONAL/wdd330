import ProductData from './ExternalServices.mjs';
import ProductDetails from './ProductDetails.mjs';
import { updateCartBadge, getParam, loadHeaderFooter } from './utils.mjs';

loadHeaderFooter();

const category = getParam('category');
const dataSource = new ProductData(category);

const productId = getParam('id');
const productDetails = new ProductDetails(productId, dataSource);

// console.log(dataSource);
productDetails.init();

// console.log(dataSource.findProductById(productId));

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
});
