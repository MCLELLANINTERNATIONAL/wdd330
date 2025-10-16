// utils.mjs
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

export function getLocalStorage(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return key === 'so-cart' ? (Array.isArray(data) ? data : []) : data;
  } catch {
    return key === 'so-cart' ? [] : null;
  }
}

export function setLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

export async function loadTemplate(path) {
  const res = await fetch(path);
  return await res.text();
}

function basePrefixFromPathname() {
  // e.g.
  // /EE/index.html                -> prefix ''
  // /EE/cart/index.html           -> prefix '../'
  // /EE/event_listing/music.html  -> prefix '../'
  const parts = location.pathname.replace(/\/$/, '').split('/');
  // remove last part if it looks like a file (has dot)
  const isFile = /\./.test(parts[parts.length - 1]);
  const folders = isFile ? parts.slice(0, -1) : parts;
  // folders like ["", "EE"] -> depth=1 (root of app)
  // we want "../" for each folder after the app root
  const appRootIndex = folders.indexOf('EE'); // adjust if folder name changes
  const depth = appRootIndex >= 0 ? Math.max(0, folders.length - (appRootIndex + 1) - 0) : Math.max(0, folders.length - 2);
  return '../'.repeat(depth);
}

function rebaseDomLinks(rootElem, prefix) {
  const sel = ['a[data-rel="a"]', 'img[data-rel="img"]', 'link[data-rel="link"]'];
  rootElem.querySelectorAll(sel.join(',')).forEach((el) => {
    const attr = el.tagName === 'A' ? 'href' : 'src';
    const val = el.getAttribute(attr);
    if (!val) return;
    // Skip absolute/ protocol links
    if (/^(https?:)?\/\//i.test(val) || val.startsWith('/')) return;
    el.setAttribute(attr, prefix + val);
  });
}

export async function loadHeaderFooter() {
  const prefix = basePrefixFromPathname();

  // Load header
  const headerHost = document.querySelector('#main-head');
  if (headerHost) {
    const headerHtml = await loadTemplate(`${prefix}partials/header.html`);
    const frag = document.createElement('div');
    frag.innerHTML = headerHtml;
    rebaseDomLinks(frag, prefix);
    headerHost.innerHTML = '';
    headerHost.append(...frag.childNodes);
    updateCartBadge();
  }

  // Load footer
  const footerHost = document.querySelector('#main-foot');
  if (footerHost) {
    const footerHtml = await loadTemplate(`${prefix}partials/footer.html`);
    const frag = document.createElement('div');
    frag.innerHTML = footerHtml;
    rebaseDomLinks(frag, prefix);
    footerHost.innerHTML = '';
    footerHost.append(...frag.childNodes);
  }
}

export function updateCartBadge() {
  const cart = getLocalStorage('so-cart') || [];
  const count = cart.reduce((sum, it) => sum + (it.quantity || 1), 0);

  const badgeById = document.getElementById('cart-badge');
  const badgeByClass = document.querySelector('.cart-count');

  [badgeById, badgeByClass].forEach((el) => {
    if (!el) return;
    el.textContent = count;
    el.classList.toggle('hide', count === 0);
  });
}

export function bounceCartIcon() {
  const cartIcon = document.querySelector('.cart-btn');
  if (!cartIcon) return;
  cartIcon.classList.remove('cart-bounce');
  void cartIcon.offsetWidth;
  cartIcon.classList.add('cart-bounce');
}

export function alertMessage(message, scroll = true) {
  const alert = document.createElement('div');
  const main = document.querySelector('main');
  alert.classList.add('alert');
  alert.innerHTML = `<h2>${message}</h2><button id="alert-close">&times;</button>`;
  alert.addEventListener('click', (e) => {
    if (e.target.id === 'alert-close') main.removeChild(alert);
  });
  main.prepend(alert);
  if (scroll) window.scrollTo(0, 0);
}

export function removeAllAlerts() {
  document.querySelectorAll('.alert').forEach((a) => a.remove());
}
