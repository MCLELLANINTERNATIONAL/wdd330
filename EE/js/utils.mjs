import ProductData from "./ExternalServices.mjs";
// wrapper for querySelector...returns matching element
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}
// or a more concise version if you are into that sort of thing:
// export const qs = (selector, parent = document) => parent.querySelector(selector);

// retrieve data from localstorage
export function getLocalStorage(key) {
  try { const data = JSON.parse(localStorage.getItem(key));
    // Always return an array for the cart key
    return key === 'so-cart' ? (Array.isArray(data) ? data : []) : data;
  } catch {
    return key === 'so-cart' ? [] : null;
  }
}
 
// save data to local storage
export function setLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
// set a listener for both touchend and click
export function setClick(selector, callback) {
  const el = qs(selector);
  if (!el) return;
  el.addEventListener('touchend', (event) => {
    event.preventDefault();
    callback();
  });
  el.addEventListener('click', callback);
}

export function getParam(param) {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const product = urlParams.get(param);
  return product
}

export function renderListWithTemplate(
  templateFn,
  parentElement,
  list,
  position = 'afterbegin',
  clear = false
) {
  // allow selector string or element
  const parent =
    typeof parentElement === 'string'
      ? document.querySelector(parentElement)
      : parentElement;

  if (!parent) return;
  if (clear) parent.innerHTML = '';
  if (!Array.isArray(list) || list.length === 0) {
    parent.insertAdjacentHTML(position, '<p>No products found.</p>');
    return;
  }

  const htmlStrings = list.map(templateFn);
  parent.insertAdjacentHTML(position, htmlStrings.join(''));
}

export function renderWithTemplate(templateFn, parentElement, callback) {
  parentElement.innerHTML = templateFn;
  if(callback) {
    callback();
  }
}

export async function loadTemplate(path) {
  const res = await fetch(path);
  const template = await res.text();
  return template;
}

export async function loadHeaderFooter() {
  const headerTemplate = await loadTemplate("../partials/header.html");
  const headerElement = document.querySelector("#main-head");
  renderWithTemplate(headerTemplate, headerElement, updateCartBadge);

  const footerTemplate = await loadTemplate("../partials/footer.html");
  const footerElement = document.querySelector("#main-foot");
  renderWithTemplate(footerTemplate, footerElement);
}

export function updateCartBadge() {
  const cart = getLocalStorage('so-cart') || [];
  const badge = document.querySelector('.cart-count');
  if (!badge) return; // Silently returns if Badge doesn't exist yet
  // Sum all quantities in the cart array:
  const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  badge.textContent = totalCount;
  if (totalCount > 0) badge.classList.remove('hide');
  else badge.classList.add('hide');
}

export function bounceCartIcon() {
  const cartIcon = document.querySelector('.cart');
  if (!cartIcon) return;

  cartIcon.classList.remove('cart-bounce'); 
  void cartIcon.offsetWidth; // force reflow so animation restarts
  cartIcon.classList.add('cart-bounce');
}

export function alertMessage(message, scroll = true) {
  // create element to hold the alert
  const alert = document.createElement('div');
  const main = document.querySelector('main');
  // add a class to style the alert
  alert.classList.add('alert');
  // set the contents. You should have a message and an X or something the user can click on to remove
  alert.innerHTML = `<h2>${message}</h2><button id='alert-close'>&times;</button>`;
  // add a listener to the alert to see if they clicked on the X
  // if they did then remove the child
  alert.addEventListener('click', function(e) {
      if(e.target.id === 'alert-close') { // how can you tell if they clicked on the X or on something else?  hint: check out e.target.tagName or e.target.innerText
        main.removeChild(this);
      }
  })
  // add the alert to the top of main
  main.prepend(alert);
  // make sure they see the alert by scrolling to the top of the window
  // you may not always want to do this...so default to scroll=true, but allow it to be passed in and overridden.
  if(scroll)
    window.scrollTo(0,0);
}

export function removeAllAlerts() {
  const alerts = document.querySelectorAll(".alert");
  alerts.forEach((alert) => document.querySelector("main").removeChild(alert));
}