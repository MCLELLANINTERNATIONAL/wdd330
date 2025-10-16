// eventDetails.mjs — EVENTS version (Ticketmaster + Eventbrite)
import { fetchEventBySourceAndId, addToCart, formatWhen, classificationLine } from './Api.js';
import { getLocalStorage, setLocalStorage, updateCartBadge, bounceCartIcon, getParam } from './utils.mjs';

// ---- helpers ----
function priceLine(ev) {
  const p = ev?.price || {};
  if (p.type === 'free') return 'Free';
  if (p.min != null && p.max != null) {
    if (p.min === p.max) return `${p.min} ${p.currency || ''}`.trim();
    return `${p.min}–${p.max} ${p.currency || ''}`.trim();
  }
  if (p.min != null) return `From ${p.min} ${p.currency || ''}`.trim();
  return '';
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

function detailsHTML(ev) {
  const imgHTML = ev.image?.url
    ? `<img id='eventImage' class='pd-img' src='${ev.image.url}' alt='${ev.name}' />`
    : '';
  const classLine = classificationLine(ev);
  const whenLine  = ev.start ? formatWhen(ev) : '';
  const price     = priceLine(ev);

  return `
    <article class='pd-card'>
      <div class='event-media'>
        ${imgHTML}
      </div>
      <div class='pd-body'>
        <h1>${ev.name || 'Event'}</h1>
        ${classLine ? `<p class='pd-class'>${classLine}</p>` : ''}
        ${whenLine ? `<p id='eventWhen' class='pd-when'>${whenLine}</p>` : ''}
        ${price ? `<p id='eventPrice' class='pd-price'>${price}</p>` : ''}
        ${ev.description ? `<p id='eventDesc' class='pd-desc'>${ev.description}</p>` : ''}
        ${venueBlock(ev)}
        <div class='pd-actions'>
          <button id='addToCart' class='btn primary'>Add to cart</button>
          ${ev.url ? `<a class='btn ghost' href='${ev.url}' target='_blank' rel='noopener'>Event page</a>` : ''}
        </div>
      </div>
    </article>
  `;
}

export default class eventDetails {
  constructor() {
    this.event = null;
    this.src = null;
    this.id  = null;
  }

  async init() {
    // Expect event_pages.html?src={ticketmaster|eventbrite}&id={EVENT_ID}
    this.src = getParam('src');
    this.id  = getParam('id');

    const mount = document.querySelector('#pd-root');
    if (!mount) {
      console.error('eventDetails: #pd-root not found');
      return;
    }

    if (!this.src || !this.id) {
      mount.innerHTML = `<p class='error'>Missing event reference. Expected ?src=…&id=…</p>`;
      updateCartBadge();
      return;
    }

    try {
      this.event = await fetchEventBySourceAndId(this.src, this.id);
      mount.innerHTML = detailsHTML(this.event);

      // wire Add to cart
      const btn = document.getElementById('addToCart');
      btn?.addEventListener('click', () => this.addeventToCart());

      // ensure badge correct on load
      updateCartBadge();
    } catch (e) {
      mount.innerHTML = `<p class='error'>Could not load event: ${e.message}</p>`;
      updateCartBadge();
    }
  }

  addeventToCart() {
    // Reuse your existing localStorage utils if you still need them elsewhere,
    // but for events we’ll use the unified cart in events.js so everything stays consistent.
    addToCart(this.event, 1);
    updateCartBadge();
    bounceCartIcon();
  }
}

// Optional: card HTML for listings that link to event_pages.html
export function rendereventDetailsHTML(ev) {
  const price = priceLine(ev);
  const when  = ev.start ? formatWhen(ev) : '';
  const classLine = classificationLine(ev);
  const href = `event_pages.html?src=${encodeURIComponent(ev.source)}&id=${encodeURIComponent(ev.id)}`;

  return `
    <a href='${href}' class='event-card' aria-label='${ev.name}'>
      <article>
        <div class='thumb'>
          <img src='${ev.image?.url || ''}' alt='${ev.name || 'Event image'}' loading='lazy'>
        </div>
        <div class='body'>
          <h3>${ev.name || 'Untitled event'}</h3>
          ${classLine ? `<p class='meta'>${classLine}</p>` : ''}
          ${when ? `<p class='when'>${when}</p>` : ''}
          ${ev.venue?.name ? `<p class='venue'>${ev.venue.name}</p>` : ''}
          ${price ? `<p class='price'>${price}</p>` : ''}
        </div>
      </article>
    </a>
  `;
}
