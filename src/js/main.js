import { loadHeaderFooter } from '../utils.mjs';

function waitForElement(selector, timeout = 3000) {
  return new Promise((resolve) => {
    const found = document.querySelector(selector);
    if (found) return resolve(found);

    const obs = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) { obs.disconnect(); resolve(el); }
    });

    obs.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(() => { obs.disconnect(); resolve(null); }, timeout);
  });
}

async function init() {
  await loadHeaderFooter();

  // === Search wiring ===
  const searchInput = document.querySelector('#item-search');
  const searchButton = document.querySelector('#search-button');

  const goSearch = () => {
    if (!searchInput) return;
    const term = searchInput.value.trim();
    if (term) {
      window.location.href = `../search_results/index.html?query=${encodeURIComponent(term)}`;
    }
  };

  if (searchButton) searchButton.addEventListener('click', goSearch);
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') goSearch(); });
  }

  // === Welcome modal (injected): show every page load ===
  const modalOverlay = (await waitForElement('#welcome-modal-overlay')) || document.getElementById('welcome-modal-overlay');
  const closeModalBtn = document.getElementById('close-modal-btn');

  const showModal = () => { if (modalOverlay) modalOverlay.style.display = 'flex'; };
  const hideModal = () => { if (modalOverlay) modalOverlay.style.display = 'none'; };

  setTimeout(showModal, 300);

  if (modalOverlay && closeModalBtn) {
    closeModalBtn.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) hideModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideModal(); });
  }
}

init();

