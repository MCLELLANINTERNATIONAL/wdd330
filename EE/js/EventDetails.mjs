// EventDetails.mjs — Unified Event Detail loader
// Supports ?key=source:id or ?src=&id=
// Expects a mount element: <section id="event-detail"></section>

import {
  fetchEventsByCategory,
  addToCart,
  formatWhen,
  classificationLine,
} from './js/api.mjs';

// ---- DOM target
const root = document.getElementById('event-detail');

// ---- URL params
const urlParams = new URLSearchParams(location.search);
const keyParam = urlParams.get('key'); // `${source}:${id}`
const srcParam = urlParams.get('src'); // "ticketmaster" | "eventbrite"
const idParam  = urlParams.get('id');  // event id

// ---- helpers ----------------------------------------------------
function updateCartBadgeFromStorage() {
  try {
    const items = JSON.parse(localStorage.getItem('ee_cart') || '[]');
    const count = items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
    const badge = document.getElementById('cart-badge');
    if (badge) badge.textContent = String(count);
  } catch {
    /* no-op */
  }
}

function priceLine(ev) {
  const p = ev?.price || {};
  if (p.type === 'free') return 'Free';
  const cur = p.currency || '';
  const fmt = (n) => (n != null ? String(n) : null);

  if (p.min != null && p.max != null) {
    if (p.min === p.max) return `${cur} ${fmt(p.min)}`.trim();
    return `${cur} ${fmt(p.min)}–${fmt(p.max)}`.trim();
  }
  if (p.min != null) return `From ${cur} ${fmt(p.min)}`.trim();
  return '—';
}

function venueLinks(v = {}) {
  const links = [];
  if (v.mapUrl) links.push(
    `<a class="btn btn--ghost" href="${v.mapUrl}" target="_blank" rel="noopener">Map</a>`
  );
  if (v.directionsUrl) links.push(
    `<a class="btn btn--ghost" href="${v.directionsUrl}" target="_blank" rel="noopener">Directions</a>`
  );
  return links.join('\n');
}

function render(ev) {
  const img = ev.image?.url || '../images/placeholder-16x9.png';
  const price = priceLine(ev);
  const meta = classificationLine(ev) || '';
  const when = ev.start ? formatWhen(ev) : '';
  const where = [ev.venue?.name, ev.venue?.city].filter(Boolean).join(' • ');

  root.innerHTML = `
    <img class="event-card__img" src="${img}" alt="${ev.name}">
    <div class="event-card__body">
      <span class="event-card__badge">${ev.category}</span>
      <h2 class="event-card__title">${ev.name}</h2>
      ${meta ? `<div class="event-card__meta">${meta}</div>` : ''}
      ${when ? `<p class="event-card__when">${when}</p>` : ''}
      ${where ? `<p class="event-card__where">${where}</p>` : ''}
      <p class="event-card__price">${price}</p>

      <div class="event-card__actions">
        <button id="add" class="btn">Add to cart</button>
        ${ev.url ? `<a class="btn btn--ghost" href="${ev.url}" target="_blank" rel="noopener">Official Page</a>` : ''}
        ${venueLinks(ev.venue)}
      </div>

      ${ev.description ? `<p style="margin-top:.75rem">${ev.description}</p>` : ''}
    </div>
  `;

  document.getElementById('add')?.addEventListener('click', () => {
    try {
      addToCart(ev, 1);
      updateCartBadgeFromStorage();
      const cart = document.querySelector('.cart-btn');
      if (cart) {
        cart.classList.add('bump');
        setTimeout(() => cart.classList.remove('bump'), 300);
      }
    } catch (err) {
      console.error('Add to cart failed:', err);
      alert('Sorry, could not add to cart.');
    }
  });
}

// ---- data loaders -----------------------------------------------
async function findEventByKey(keyStr) {
  const cats = ['music','theatre','sport','cinema'];
  const results = await Promise.allSettled(cats.map(c => fetchEventsByCategory(c)));
  const all = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []));
  return all.find(e => `${e.source}:${e.id}` === keyStr) || null;
}

async function findEventBySrcId(src, id) {
  const cats = ['music','theatre','sport','cinema'];
  const results = await Promise.allSettled(cats.map(c => fetchEventsByCategory(c)));
  const all = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []));
  return all.find(e => e.source === src && String(e.id) === String(id)) || null;
}

// ---- init --------------------------------------------------------
async function init() {
  if (!root) {
    console.error('EventDetails.mjs: #event-detail not found');
    return;
  }

  root.innerHTML = `<div class="event-card__body skel">Loading…</div>`;

  try {
    let ev = null;

    if (keyParam) {
      ev = await findEventByKey(keyParam);
    } else if (srcParam && idParam) {
      ev = await findEventBySrcId(srcParam, idParam);
    } else {
      root.innerHTML = `<div class="event-card__body"><p>Missing event reference. Use <code>?key=source:id</code> or <code>?src=&id=</code>.</p></div>`;
      return;
    }

    if (!ev) {
      root.innerHTML = `<div class="event-card__body"><p>Event not found.</p></div>`;
      return;
    }

    render(ev);
  } catch (err) {
    console.error(err);
    root.innerHTML = `<div class="event-card__body"><p>Error: ${err.message}</p></div>`;
  }
}

init();
updateCartBadgeFromStorage();

