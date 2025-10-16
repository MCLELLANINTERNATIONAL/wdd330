document.addEventListener('DOMContentLoaded', () => {
    const crumb = document.getElementById('breadcrumbs');
    if (!crumb) return;

    // ===== get Home URL from your nav (e.g., "../index.html") and resolve it
    const navHomeLink =
        document.querySelector('nav a[title="index"], nav a[href$="index.html"]');

    const HOME_URL = navHomeLink
        ? new URL(navHomeLink.getAttribute('href'), location.href).href
        : new URL('../index.html', location.href).href; // fallback

    // Consider both "/path/" and "/path/index.html" as Home
    const isHome = (() => {
        const home = new URL(HOME_URL);
        const here = new URL(location.href);
        const norm = (u) => u.pathname.replace(/index\.html$/i, '');
        return norm(here) === norm(home);
    })();

    const path = window.location.pathname;
    const params = new URLSearchParams(location.search);

    // Root home only
    if (isHome) {
        crumb.style.display = 'none';
        return;
    }

    // helpers
    const getCategoryFromParam = () =>
        params.get('category')
            ? params.get('category').charAt(0).toUpperCase() + params.get('category').slice(1)
            : null;

    const getCategoryFromTitle = () => {
        const h2 = document.querySelector('.event-detail h2');
        if (!h2) return 'event';

        const text = h2.textContent.toLowerCase();
        const keywords = ['music', 'theatre', 'cinema', 'sport'];

        // Look for the first keyword in the h2 text
        const match = keywords.find((word) => text.includes(word));

        return match ? match.charAt(0).toUpperCase() + match.slice(1) : 'event';
    };

    const getCategoryFromList = () =>
        document.querySelector('.event-list')?.dataset?.category || null;

    const rememberCategory = (cat) => {
        if (cat) localStorage.setItem('last-category', cat);
    };
    const recallCategory = () => localStorage.getItem('last-category');

    const setCrumb = (html) => {
        crumb.innerHTML = `<a href="${HOME_URL}">Home</a> &gt; ${html}`;
        crumb.style.display = '';
    };

    const isDetail = path.includes('/event_pages/');
    const isCart = path.includes('/cart/');
    const isList = !!document.querySelector('.event-list');

    if (isCart) {
        const category = 'Cart';
        setCrumb(`<span>${category}</span>`);
        return;
    }

    if (isDetail) {
        const category = recallCategory() || 'events';
        setCrumb(`<span>${category}</span>`);
        return;
    }

    if (isList) {
        // event list: "Category -> (N items)"
        const listEl = document.querySelector('.event-list');

        const update = () => {
            const category =
                getCategoryFromParam() ||
                getCategoryFromTitle() ||
                getCategoryFromList() ||
                'events';

            rememberCategory(category);

            const count = listEl.querySelectorAll('.event-card').length;
            setCrumb(`<span>${category}</span> &gt; <span>(${count} items)</span>`);
        };

        // events may render async; observe for when cards appear
        const observer = new MutationObserver(update);
        observer.observe(listEl, { childList: true });

        update(); // initial
        return;
    }

    // Other pages: hide by default
    crumb.style.display = 'none';
});