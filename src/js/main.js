import { updateCartBadge } from './product.js';
import { getLocalStorage } from './utils.mjs';
import ProductData from './ProductData.mjs';
import { ProductList } from './ProductList.mjs';

const productData = new ProductData();
const productList = new productList();
const cart = getLocalStorage('so-cart') || [];
updateCartBadge(cart.length);
