import { updateCartBadge } from './product.js';
import { getLocalStorage } from './utils.mjs';
import ProductData from './ProductData.mjs';
import ProductList from './ProductList.mjs';

const dataSource = new ProductData('tents');
const element = document.querySelector('.product-list');
const productList = new ProductList('Tents', dataSource, element);

productList.init();

const cart = getLocalStorage('so-cart') || [];
updateCartBadge(cart.length);
