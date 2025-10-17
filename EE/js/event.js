// Event SINGLE EVENT DETAILS
// Supports BOTH ?key=source:id and ?src=&id=
import {
  fetchEventBySourceAndId,
  fetchEventsByCategory,
  addToCart,
  formatWhen,
  classificationLine
} from '../js/api.mjs';
import { flyToCart } from '../js/flyToCart.js';
import { updateCartBadge, getParam, loadHeaderFooter } from '../js/utils.mjs';

loadHeaderFooter();

const root = document.querySelector('#pd-root');

// --- helpers ---
function priceLine(ev) {
  const p = ev?.price || {};
  if (p.type === 'free') return 'Free';
  if (p.min != null && p.max != null) {
    if (p.min === p.max) return `${p.min} ${p.currency || ''}`.trim();
    return `${p.min}–${p.max} ${p.currency || ''}`.trim();
  }
  if (p.min != null) return `From ${p.min} ${p.currency || ''}`.trim();
  return '—';
}

function venueBlock(ev) {
  const v = ev?.venue || {};
  const addrParts = [v.address, v.city, v.state, v.postalCode, v.country].filter(Boolean);
  const addr = addrParts.join(', ');
  const map = v.mapUrl ? `<a href='${v.mapUrl}' target='_blank' rel='noopener'>View map</a>` : '';
  const dir = v.directionsUrl ? `<a href='${v.directionsUrl}' target='_blank' rel='noopener'>Directions</a>` : '';
  const links = [map, dir].filter(Boolean).join(' · ');
  return `
    <div class='pd-venue'>
      <h4>Venue</h4>
      <p><strong>${v.name || ''}</strong></p>
      <p>${addr}</p>
      ${links ? `<p class='links'>${links}</p>` : ''}
    </div>
  `;
}

function render(ev) {
  const imgHTML = ev.image?.url
    ? `<img class='pd-img js-pd-img' src='${ev.image.url}' alt='${ev.name}' />`
    : '';

  const classLine = classificationLine(ev);
  const whenLine = ev.start ? formatWhen(ev) : '';
  const price = priceLine(ev);

  root.innerHTML = `
    <article class='pd-card'>
      <div class='pd-media'>${imgHTML}</div>
      <div class='pd-body'>
        <h1>${ev.name || 'Event'}</h1>
        ${classLine ? `<p class='pd-class'>${classLine}</p>` : ''}
        ${whenLine ? `<p class='pd-when'>${whenLine}</p>` : ''}
        ${price ? `<p class='pd-price'>${price}</p>` : ''}
        ${ev.description ? `<p class='pd-desc'>${ev.description}</p>` : ''}
        ${venueBlock(ev)}
        <div class='pd-actions'>
          <button id='addCartBtn' class='btn primary'>Add to cart</button>
          ${ev.url ? `<a class='btn ghost' href='${ev.url}' target='_blank' rel='noopener'>Event page</a>` : ''}
        </div>
      </div>
    </article>
  `;

  const btn = root.querySelector('#addCartBtn');
  const imgEl = root.querySelector('.js-pd-img');

  btn?.addEventListener('click', () => {
    addToCart(ev, 1);
    flyToCart({ imageUrl: ev.image?.url, fromEl: imgEl });
    updateCartBadge();

    btn.textContent = 'Added!';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'Add to cart';
      btn.disabled = false;
    }, 900);
  });
}

function renderError(msg) {
  root.innerHTML = `<p class='error'>${msg}</p>`;
}

async function lookupByKey(keyStr) {
  // Fallback discover: pull all categories once and find the event
  const cats = ['music', 'theatre', 'sport', 'cinema'];
  const results = await Promise.allSettled(cats.map(c => fetchEventsByCategory(c)));
  const all = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []));
  return all.find(e => `${e.source}:${e.id}` === keyStr) || null;
}

async function init() {
  if (!root) {
    console.error('event.js: #pd-root not found');
    return;
  }

  root.innerHTML = `<div class="event-card__body skel">Loading…</div>`;

  try {
    // Support both styles:
    //   ?src=ticketmaster&id=EVENT_ID
    //   ?key=ticketmaster:EVENT_ID
    const src = getParam('src');
    const id = getParam('id');
    const key = getParam('key');

    let ev = null;

    if (src && id) {
      ev = await fetchEventBySourceAndId(src, id);
    } else if (key) {
      ev = await lookupByKey(key);
    } else {
      renderError('Missing event reference. Use ?src=…&id=… or ?key=source:id');
      return;
    }

    if (!ev) {
      renderError('Event not found.');
      return;
    }

    render(ev);
  } catch (e) {
    renderError(`Could not load event: ${e.message}`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  init();
});
