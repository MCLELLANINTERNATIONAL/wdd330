import { updateCartBadge } from './product.js';
import { getLocalStorage } from './utils.mjs';

const cart = getLocalStorage('so-cart') || [];
updateCartBadge(cart.length);
