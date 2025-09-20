import { getLocalStorage, setLocalStorage, updateCartBadge } from './utils.mjs';
import ShoppingCart from './ShoppingCart.mjs';

let datasource = getLocalStorage('so-cart');
const element = document.querySelector('.product-list');
const shopCart = new ShoppingCart(datasource, element);
shopCart.init();

function showRemoveMessage(product, onChoice) {
  const overlay = document.getElementById('modalOverlay');
  const dialog = document.getElementById('removeDialog');
  const dialogTitle = document.getElementById('dialogTitle');
  const msg = document.getElementById('dialog-message');
  const opts = document.getElementById('dialog-options');

  opts.innerHTML = '';

  // Prevent background scrolling/interactions
  document.body.style.overflow = 'hidden';
  overlay.classList.remove('hide');
  dialog.classList.remove('hide');
  dialogTitle.textContent = 'Remove Item';
  let initialFocus = null;

  // Case 1: only one
  if (product.quantity === 1) {
    msg.textContent = `Are you sure you want to remove ${product.Name}?`;
    opts.innerHTML = `
      <button id="confirmRemove">Remove</button>
      <button id="cancelRemove">Cancel</button>
    `;
    initialFocus = document.getElementById('confirmRemove');
    document.getElementById('confirmRemove').onclick = () => {
      cleanup();
      onChoice({ type: 'removeAll' });
    };
    document.getElementById('cancelRemove').onclick = () => {
      cleanup();
      onChoice({ type: 'cancel' });
    };
  }

  // Case 2: exactly 2
  else if (product.quantity === 2) {
    msg.textContent = `You have 2 of ${product.Name}. Do you want to remove only one, both, or cancel?`;
    opts.innerHTML = `
      <button id="removeOne">Remove One</button>
      <button id="removeAll">Remove Both</button>
      <button id="cancelRemove">Cancel</button>
    `;
    initialFocus = document.getElementById('removeOne');
    document.getElementById('removeOne').onclick = () => {
      cleanup();
      onChoice({ type: 'removeOne' });
    };
    document.getElementById('removeAll').onclick = () => {
      cleanup();
      onChoice({ type: 'removeAll' });
    };
    document.getElementById('cancelRemove').onclick = () => {
      cleanup();
      onChoice({ type: 'cancel' });
    };
  }

  // Case 3: more than 2
  else {
    msg.textContent = `You have ${product.quantity} of ${product.Name}. How many would you like to remove?`;
    opts.innerHTML = `
      <input id="removeCount" type="number" min="1" max="${product.quantity}" value="1">
      <button id="confirmRemove">Remove</button>
      <button id="removeAll">Remove All</button>
      <button id="cancelRemove">Cancel</button>
    `;
    initialFocus = document.getElementById('removeCount');
    const input = document.getElementById('removeCount');
    document.getElementById('confirmRemove').onclick = () => {
      const val = parseInt(input.value, 10);
      if (Number.isNaN(val) || val < 1 || val > product.quantity) {
        alert(`Please enter a number between 1 and ${product.quantity}`);
        return;
      }
      cleanup();
      onChoice({ type: 'removeSome', count: val });
    };
    document.getElementById('removeAll').onclick = () => {
      cleanup();
      onChoice({ type: 'removeAll' });
    };
    document.getElementById('cancelRemove').onclick = () => {
      cleanup();
      onChoice({ type: 'cancel' });
    };
  }

  setTimeout(() => initialFocus && initialFocus.focus(), 100);

  // Trap focus inside dialog
  dialog.onkeydown = function (e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const focusable = dialog.querySelectorAll('button,input');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) last.focus();
        else first.focus();
      } else {
        if (document.activeElement === last) first.focus();
        else last.focus();
      }
    }
    if (e.key === 'Escape') {
      cleanup();
      onChoice({ type: 'cancel' });
    }
  };

  function cleanup() {
    overlay.classList.add('hide');
    dialog.classList.add('hide');
    document.body.style.overflow = '';
    opts.innerHTML = '';
    msg.textContent = '';
    shopCart.init();
  }
}

function updateCartFooter(cart) {
  const footerEl = document.getElementById('cart-footer');
  const totalEl = document.getElementById('cart-total');
  const discountEl = document.getElementById('cart-discount');
  const finalEl = document.getElementById('cart-final');
  datasource = getLocalStorage('so-cart');

  // If the footer HTML doesn't exist yet, do nothing (keeps this file safe to include anywhere)
  if (!footerEl || !totalEl || !discountEl || !finalEl) return;

  if (!Array.isArray(cart) || cart.length === 0) {
    footerEl.classList.add('hide');
    totalEl.textContent = '$0.00';
    discountEl.textContent = '$0.00';
    finalEl.textContent = '$0.00';
    return;
  }

  const total = getCartTotal(cart);
  const discountTotal = getCartDiscount(cart); // sum of per-item discounts (10%)
  const finalTotal = Math.max(total - discountTotal, 0);

  totalEl.textContent = formatCurrency(total);
  discountEl.textContent = formatCurrency(discountTotal);
  finalEl.textContent = formatCurrency(finalTotal);

  footerEl.classList.remove('hide');
}

function getCartTotal(cart) {
  return cart.reduce((sum, item) => {
    const qty = Number(item?.quantity ?? 1);
    const price = coercePrice(
      item?.FinalPrice ?? item?.price ?? item?.Price ?? item?.ListPrice,
    );
    return sum + price * (Number.isFinite(qty) ? qty : 1);
  }, 0);
}

function getCartDiscount(cart) {
  return cart.reduce((sum, item) => {
    const qty = Number(item?.quantity ?? 1);
    const price = coercePrice(
      item?.FinalPrice ?? item?.price ?? item?.Price ?? item?.ListPrice,
    );
    return sum + price * 0.1 * (Number.isFinite(qty) ? qty : 1);
  }, 0);
}

function coercePrice(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
}

function formatCurrency(amount) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

element.addEventListener('click', (e) => {
  // Look for the closest increase button
  const increaseBtn = e.target.closest('.increase-quantity');
  if (increaseBtn) {
    handleIncrease(increaseBtn.dataset.id);
    return;
  }

  // Look for the closest decrease button
  const decreaseBtn = e.target.closest('.decrease-quantity');
  if (decreaseBtn) {
    handleDecrease(decreaseBtn.dataset.id);
    return;
  }

  // Look for remove button
  const removeBtn = e.target.closest('.cart-remove');
  if (removeBtn) {
    const id = removeBtn.dataset.id;
    const product = datasource.find((item) => item.Id === id);
    if (!product) return;

    showRemoveMessage(product, (choice) => {
      if (choice.type === 'removeOne') product.quantity -= 1;
      else if (choice.type === 'removeAll')
        datasource = datasource.filter((i) => i.Id !== id);
      else if (choice.type === 'removeSome') {
        product.quantity -= choice.count;
        if (product.quantity <= 0)
          datasource = datasource.filter((i) => i.Id !== id);
      }

      setLocalStorage('so-cart', datasource);
      shopCart.renderList(datasource);
      updateCartFooter(datasource);
      updateCartBadge();
    });
  }
});

function handleIncrease(productId) {
  const cartItems = getLocalStorage('so-cart') || [];
  const item = cartItems.find((i) => i.Id === productId);
  if (!item) return;
  item.quantity = (item.quantity || 1) + 1;
  setLocalStorage('so-cart', cartItems);
  shopCart.renderList(cartItems);
  updateCartFooter(cartItems);
  updateCartBadge();
}

function handleDecrease(productId) {
  const cartItems = getLocalStorage('so-cart') || [];
  const item = cartItems.find((i) => i.Id === productId);
  if (!item) return;
  item.quantity = Math.max((item.quantity || 1) - 1, 1);
  setLocalStorage('so-cart', cartItems);
  shopCart.renderList(cartItems);
  updateCartFooter(cartItems);
  updateCartBadge();
}

document.getElementById('clear-cart-btn').addEventListener('click', clearCart);

function clearCart() {
  setLocalStorage('so-cart', []);
  shopCart.renderList([]);
  updateCartFooter([]);
  updateCartBadge();
}

document.addEventListener('DOMContentLoaded', () => {
  datasource = getLocalStorage('so-cart') || [];
  updateCartFooter(datasource);
  updateCartBadge(); // ensure correct on initial load
});
