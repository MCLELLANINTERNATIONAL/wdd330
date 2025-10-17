import { loadHeaderFooter, updateCartBadge } from './utils.mjs';
import { getLocalStorage, setLocalStorage } from './utils.mjs';

async function init() {
  // Only load header/footer if using dynamic loading (has #main-head element)
  const headerElement = document.querySelector('#main-head');
  if (headerElement) {
    await loadHeaderFooter(); // wait for header/footer to load
  } else {
    // For pages with inline headers, just update cart badge
    updateCartBadge();
  }

  // Now the search button exists in the DOM - using correct class selectors
  const searchInput = document.querySelector('.search-input');
  const searchButton = document.querySelector('.search-btn');
  const searchForm = document.querySelector('.search-bar');

  // Handle form submission (prevents page reload)
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const term = searchInput.value.trim();
      if (term) {
        window.location.href = `/search_results/index.html?query=${encodeURIComponent(term)}`;
      }
    });
  }

  // Fallback: Handle button click
  if (searchButton) {
    searchButton.addEventListener('click', (e) => {
      e.preventDefault();
      const term = searchInput.value.trim();
      if (term) {
        window.location.href = `/search_results/index.html?query=${encodeURIComponent(term)}`;
      }
    });
  }

  // Handle Enter key in input
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const term = searchInput.value.trim();
        if (term) {
          window.location.href = `/search_results/index.html?query=${encodeURIComponent(term)}`;
        }
      }
    });
  }
}

init();

// Logic for the Welcome Modal for the first visit

window.addEventListener('DOMContentLoaded', () => {
  // Select modal elements in HTML
  const modalOverlay = document.getElementById('welcome-modal-overlay');
  const closeModalBtn = document.getElementById('close-modal-btn');

  // Define a unique key to use in localStorage
  const visitedKey = getLocalStorage('hasVisitedBefore');

  function showModal() {
    if (modalOverlay) {
      modalOverlay.style.display = 'flex';
    }
  }

  function hideModal() {
    if (modalOverlay) {
      modalOverlay.style.display = 'none';
    }
  }

  // Checks if the 'hasVisitedBefore' key DOES NOT exist in localStorage
  if (!visitedKey) {
    // If it doesn't exist, it's the first visit.

    setTimeout(showModal, 300);

    setLocalStorage('hasVisitedBefore', 'true');
  }

  if (modalOverlay && closeModalBtn) {
    closeModalBtn.addEventListener('click', hideModal);

    modalOverlay.addEventListener('click', (event) => {
      if (event.target === modalOverlay) {
        hideModal();
      }
    });
  }
});
