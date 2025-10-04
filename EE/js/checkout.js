import { loadHeaderFooter } from './utils.mjs';
import { displayTotals } from './CheckoutProcess.mjs';

loadHeaderFooter();

document.getElementById('zip-add').addEventListener('blur', displayTotals);
