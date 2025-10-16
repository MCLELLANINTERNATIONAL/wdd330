// =====================================================
//  Edinburgh Entertainment — Unified API + Cart Module
//  Handles Ticketmaster + Eventbrite + Local Cart storage
// ========================================================

// ---- API Keys / Tokens ----
// 👇 Insert your real keys between the quotes
const TM_KEY = 'HGiBZ5JTwATOOhB0kIGZWXAgCXwrglXq';      // Ticketmaster API key
const EB_TOKEN = '3JHCKH7IX3J5SBA63XCU';    // Eventbrite personal OAuth token (Bearer)

// ---- Endpoints ----
const TM_API = 'https://app.ticketmaster.com/discovery/v2';
const EB_API = 'https://www.eventbriteapi.com/v3';

// ---- CORS Proxy (needed for GitHub Pages / static sites) ----
const CORS_PROXY = 'https://corsproxy.io/?';

// ---- Utilities ----
const nowISO = () => new Date().toISOString();
const toNum = (x) => (x == null ? null : Number(x));
const clean = (s) => (typeof s === 'string' ? s.trim() : '');
const mapUrl = (lat, lon, label = '') =>
  lat && lon
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lon} ${label}`)}`
    : '';
const directionsUrl = (lat, lon) =>
  lat && lon
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
    : '';

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`${opts?.__label || 'HTTP'} ${res.status}: ${t || res.statusText}`);
  }
  return res.json();
}

function buildUrl(base, params) {
  const u = new URL(base);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, v);
  });
  return u.toString();
}

// ========================================================
//  Ticketmaster (Music, Theatre, Sport)
// ========================================================
const TM_CATEGORY_SEGMENT = {
  music: 'Music',
  theatre: 'Arts & Theatre',
  sport: 'Sports',
};

function pickTMImage(images = []) {
  const pref = images.find(i => i.ratio === '3_2') || images.find(i => i.ratio === '16_9');
  return pref || images[0] || null;
}

function normalizeTM(ev, category) {
  const img = pickTMImage(ev.images);
  const v = ev?._embedded?.venues?.[0] || {};
  const price = (ev.priceRanges && ev.priceRanges[0]) || {};
  const classSeg = ev.classifications?.[0] || {};
  return {
    id: ev.id,
    source: 'ticketmaster',
    category,
    name: clean(ev.name),
    description: clean(ev.info || ev.pleaseNote || ''),
    classifications: {
      segment: classSeg.segment?.name || '',
      genre: classSeg.genre?.name || '',
      subGenre: classSeg.subGenre?.name || '',
    },
    start: ev.dates?.start?.dateTime || ev.dates?.start?.localDate || null,
    end: ev.dates?.end?.dateTime || null,
    image: img
      ? { url: img.url, width: toNum(img.width), height: toNum(img.height) }
      : { url: '', width: null, height: null },
    price: {
      type: price.type || '',
      currency: price.currency || '',
      min: toNum(price.min),
      max: toNum(price.max),
    },
    venue: {
      id: v.id || '',
      name: clean(v.name || ''),
      city: clean(v.city?.name || ''),
      state: clean(v.state?.name || v.state?.stateCode || ''),
      country: clean(v.country?.name || v.country?.countryCode || ''),
      address: clean(v.address?.line1 || ''),
      postalCode: clean(v.postalCode || ''),
      latitude: v.location?.latitude ? Number(v.location.latitude) : null,
      longitude: v.location?.longitude ? Number(v.location.longitude) : null,
      mapUrl: mapUrl(v.location?.latitude, v.location?.longitude, v.name || ''),
      directionsUrl: directionsUrl(v.location?.latitude, v.location?.longitude),
    },
    url: ev.url || '',
  };
}

export async function getTicketmasterEvents(category, { size = 100 } = {}) {
  const segmentName = TM_CATEGORY_SEGMENT[category];
  if (!segmentName) return [];

  const url = buildUrl(`${TM_API}/events.json`, {
    apikey: TM_KEY,
    city: 'Edinburgh',
    countryCode: 'GB',
    segmentName,
    sort: 'date,asc',
    startDateTime: nowISO(),
    size,
    includeTBA: 'yes',
    includeTBD: 'yes',
  });

  // Use proxy for browser CORS safety
  const proxiedUrl = CORS_PROXY + encodeURIComponent(url);
  const data = await fetchJson(proxiedUrl, { __label: 'Ticketmaster Events' });
  const events = data._embedded?.events || [];
  return events.map(e => normalizeTM(e, category));
}

// ========================================================
//  Eventbrite (Cinema)
// ========================================================
function normalizeEB(ev) {
  const venue = ev.venue || {};
  const lat = venue.latitude ? Number(venue.latitude) : null;
  const lon = venue.longitude ? Number(venue.longitude) : null;
  const ta = ev.ticket_availability || {};
  const minp = ta.minimum_ticket_price || {};
  const maxp = ta.maximum_ticket_price || {};
  const logo = ev.logo || {};
  const imgUrl = logo.original?.url || logo.url || '';

  return {
    id: String(ev.id),
    source: 'eventbrite',
    category: 'cinema',
    name: clean(ev.name?.text || ''),
    description: clean(ev.description?.text || ''),
    classifications: {
      segment: 'Film & Media',
      genre: ev.category_id === '105' ? 'Film' : '',
      subGenre: '',
    },
    start: ev.start?.utc || ev.start?.local || null,
    end: ev.end?.utc || ev.end?.local || null,
    image: { url: imgUrl, width: null, height: null },
    price: {
      type: ev.is_free ? 'free' : 'paid',
      currency: minp.currency || maxp.currency || ev.currency || '',
      min: minp.value != null ? Number(minp.value) / 100 : null,
      max: maxp.value != null ? Number(maxp.value) / 100 : null,
    },
    venue: {
      id: venue.id || '',
      name: clean(venue.name || ''),
      city: clean(venue.address?.city || ''),
      state: clean(venue.address?.region || 'Scotland'),
      country: clean(venue.address?.country || 'GB'),
      address: clean(venue.address?.address_1 || ''),
      postalCode: clean(venue.address?.postal_code || ''),
      latitude: lat,
      longitude: lon,
      mapUrl: mapUrl(lat, lon, venue.name || ''),
      directionsUrl: directionsUrl(lat, lon),
    },
    url: ev.url || '',
  };
}

export async function getEventbriteCinema({ pageSize = 50 } = {}) {
  const params = {
    'location.address': 'Edinburgh, Scotland, UK',
    'start_date.range_start': nowISO(),
    sort_by: 'date',
    categories: '105',
    q: 'cinema OR film OR screening',
    expand: 'venue',
    'page_size': pageSize,
  };

  const rawUrl = buildUrl(`${EB_API}/events/search/`, params);
  const proxiedUrl = CORS_PROXY + encodeURIComponent(rawUrl);

  const data = await fetchJson(proxiedUrl, {
    __label: 'Eventbrite Events',
    headers: { Authorization: `Bearer ${EB_TOKEN}` },
  });

  const events = data.events || [];
  return events.map(e => normalizeEB(e));
}

// ========================================================
//  Aggregator + Public API
// ========================================================
export async function fetchEventsByCategory(category) {
  const cat = (category || '').toLowerCase();

  if (cat === 'cinema') {
    const eb = await getEventbriteCinema();
    return eb.sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  }

  if (['music', 'theatre', 'sport'].includes(cat)) {
    const tm = await getTicketmasterEvents(cat);
    return tm.sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  }

  if (cat === 'all') {
    const [music, theatre, sport, cinema] = await Promise.all([
      getTicketmasterEvents('music'),
      getTicketmasterEvents('theatre'),
      getTicketmasterEvents('sport'),
      getEventbriteCinema(),
    ]);
    return [...music, ...theatre, ...sport, ...cinema].sort((a, b) =>
      (a.start || '').localeCompare(b.start || '')
    );
  }

  throw new Error('Unknown category. Use: music, theatre, cinema, sport, or all.');
}

export async function fetchAllGrouped() {
  const [music, theatre, sport, cinema] = await Promise.all([
    getTicketmasterEvents('music'),
    getTicketmasterEvents('theatre'),
    getTicketmasterEvents('sport'),
    getEventbriteCinema(),
  ]);
  return { music, theatre, sport, cinema };
}

// ========================================================
//  Cart (LocalStorage)
// ========================================================
const CART_KEY = 'ee_cart';

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(eventObj, qty = 1) {
  if (!eventObj?.id) throw new Error('Invalid event for cart');
  const items = getCart();
  const key = `${eventObj.source}:${eventObj.id}`;
  const idx = items.findIndex(it => it.key === key);

  if (idx >= 0) {
    items[idx].qty += qty;
  } else {
    items.push({
      key,
      qty,
      id: eventObj.id,
      source: eventObj.source,
      category: eventObj.category,
      name: eventObj.name,
      start: eventObj.start,
      venueName: eventObj.venue?.name || '',
      image: eventObj.image?.url || '',
      priceMin: eventObj.price?.min ?? null,
      priceMax: eventObj.price?.max ?? null,
      currency: eventObj.price?.currency || '',
      url: eventObj.url || '',
    });
  }

  saveCart(items);
  return items;
}

export function removeFromCart(key) {
  const items = getCart().filter(it => it.key !== key);
  saveCart(items);
  return items;
}

export function clearCart() {
  saveCart([]);
  return [];
}

// ========================================================
//  Helpers for Display
// ========================================================
export function formatWhen(ev) {
  if (!ev?.start) return '';
  try {
    const d = new Date(ev.start);
    return d.toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ev.start;
  }
}

export function classificationLine(ev) {
  const c = ev.classifications || {};
  return [c.segment, c.genre, c.subGenre].filter(Boolean).join(' • ');
}
