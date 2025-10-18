import ProductData from './ExternalServices.mjs';
import ProductList from './ProductList.mjs';
import { updateCartBadge, getParam, loadHeaderFooter } from './utils.mjs';

loadHeaderFooter();

const category = getParam('category');
const query = getParam('query');
const dataSource = new ProductData(category);
const listElement = document.querySelector('.product-list');
const mylist = new ProductList(category, dataSource, listElement, query);

mylist.init();

document.addEventListener('DOMContentLoaded', async () => {
  updateCartBadge();
});
