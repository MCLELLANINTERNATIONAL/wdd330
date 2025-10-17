import { renderListWithTemplate, getParam, showSkeletonLoaders, showErrorState, showEmptyState } from './utils.mjs';
import ProductData from './ExternalServices.mjs';
import ProductDetails, { renderProductDetailsHTML } from './ProductDetails.mjs';
import { isBookmarked, toggleBookmark } from './bookmarks.mjs';

function productCardTemplate(product) {
    // matches the structure in /index.html
    const category = getParam('category')
    const id = product?.Id ?? product?.id ?? '';
    const href = `../product_pages/index.html?category=${category}&id=${encodeURIComponent(id)}`;
    const img = product?.Images?.PrimaryMedium ?? product?.images?.[0]?.url ?? '';
    const brand = product?.Brand?.Name ?? product?._embedded?.venues?.[0]?.name ?? '';
    const name = product?.name ?? product?.Name ?? '';
    const price =
      typeof product?.FinalPrice === 'number'
        ? `$${product.FinalPrice.toFixed(2)}`
        : `$${product?.FinalPrice ?? '0.00'}`;

    const bookmarked = isBookmarked(id);
    const bookmarkIcon = bookmarked ? '&#9733;' : '&#9734;'; // Filled or empty star
    const bookmarkLabel = bookmarked ? 'Remove from My Events' : 'Add to My Events';

    return `<li class="product-card">
      <a href="${href}">
        <p class="product-card__price">${price}</p>
        <img
          src="${img}"
          srcset="
            ${img} 80w,
            ${img} 160w
          "
          sizes="(max-width: 600px) 50vw, 160px"
          alt="Image of ${name}">
        <h2 class="card__brand">${brand}</h2>
        <h3 class="card__name">${name}</h3>
      </a>
      <button class="bookmark-btn ${bookmarked ? 'bookmarked' : ''}" data-id="${id}" data-product='${JSON.stringify(product).replace(/'/g, "&apos;")}' aria-label="${bookmarkLabel}" title="${bookmarkLabel}">
        ${bookmarkIcon}
      </button>
      <button class="quick-view" data-id=${id}>Quick View</button>
    </li>`;
}

export default class ProductList {
    constructor(category, dataSource, listElement, query) {
      // You passed in this information to make the class as reusable as possible.
      // Being able to define these things when you use the class will make it very flexible
      this.category = category;
      this.dataSource = dataSource;
      this.listElement = typeof listElement === 'string'
      ? document.querySelector(listElement)
      : listElement;
      this.query = query;
      this.fullList = []; // Store full unfiltered list
      this.currentList = []; // Store current filtered/sorted list
    }

    async init() {
      // Show skeleton loaders while loading
      showSkeletonLoaders(this.listElement, 6);

      try {
        let list = await this.dataSource.getData(this.category);

        // Store full list
        this.fullList = list;

        if (this.query) {
          document.title = `EE| ${this.query} Search Results`;
          list = list.filter(item =>
            item.Name?.toLowerCase().includes(this.query.toLowerCase())
          );
        }

        // Store current list
        this.currentList = list;

        // Check if list is empty
        if (!list || list.length === 0) {
          const message = this.query
            ? `No events found matching "${this.query}"`
            : 'No events found in this category';
          showEmptyState(this.listElement, message);
          return;
        }

        const sortSelect = document.getElementById('sort');
        if (sortSelect) {
          sortSelect.addEventListener('change', () => this.sortAndRender(this.currentList));
        }

        this.renderList(this.currentList);
      } catch (error) {
        console.error('Error loading events:', error);
        showErrorState(this.listElement, error, () => this.init());
        return;
      }

      // Handle bookmark button clicks
      this.listElement.addEventListener('click', (e) => {
        const bookmarkBtn = e.target.closest('.bookmark-btn');
        if (bookmarkBtn) {
          e.preventDefault();
          const productData = JSON.parse(bookmarkBtn.dataset.product.replace(/&apos;/g, "'"));
          const isNowBookmarked = toggleBookmark(productData);

          // Update button appearance
          if (isNowBookmarked) {
            bookmarkBtn.classList.add('bookmarked');
            bookmarkBtn.innerHTML = '&#9733;'; // Filled star
            bookmarkBtn.setAttribute('aria-label', 'Remove from My Events');
            bookmarkBtn.setAttribute('title', 'Remove from My Events');
          } else {
            bookmarkBtn.classList.remove('bookmarked');
            bookmarkBtn.innerHTML = '&#9734;'; // Empty star
            bookmarkBtn.setAttribute('aria-label', 'Add to My Events');
            bookmarkBtn.setAttribute('title', 'Add to My Events');
          }
        }
      });

      this.listElement.addEventListener('click', async (e) => {

        const qViewBtn = e.target.closest('.quick-view');
        if (!qViewBtn) return;

        const card = qViewBtn.closest('.product-card');
        const productId = qViewBtn.dataset.id;

        const existingModal = card.querySelector('.quick-view-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'quick-view-modal';
        modal.innerHTML = `
          <div class="modal-content">
            <span class="close">&times;</span>
            <div class="modal-body">Loading product details...</div>
          </div>
        `;
        card.appendChild(modal);

        const product = await this.dataSource.findProductById(productId);
        modal.querySelector('.modal-body').innerHTML = renderProductDetailsHTML(product);

        modal.classList.add('show'); 

        modal.querySelector('.close').addEventListener('click', () => {
          modal.classList.remove('show');
          setTimeout(() => modal.remove(), 300);
        });
        modal.querySelector('#addToCartModal').addEventListener('click', async () => {
          await addToCart(productId);
        });
      });

      function handleOutsideClick(e) {
        const modal = document.querySelector('.quick-view-modal.show');
        if (!modal) return;
        // If the click is NOT inside the modal
        if (!modal.contains(e.target)) {
          closeOpenModals();
        }
      }

      document.addEventListener('mousedown', handleOutsideClick);

      function closeOpenModals() {
        const openModals = document.querySelectorAll('.quick-view-modal.show');
        openModals.forEach(m => {
          m.classList.remove('show');
          setTimeout(() => m.remove(), 300);
        });
      }

      async function addToCart(productId) {
        const productData = new ProductData(); 
        const productDetails = new ProductDetails(productId, productData);
        productDetails.addProductToCart();
      }
    }

    renderList(list) {
      if (!this.listElement) return;
      renderListWithTemplate(
        productCardTemplate, // your top-level template function
        this.listElement,    // where to render
        list,            // data
        'afterbegin',        // position (default is fine)
        true                 // clear existing content (replaces innerHTML approach)
      );
    }

    //Sorting Function
    sortAndRender(list) {
    const sortSelect = document.getElementById('sort');
    let sortedList = [...list]; // Create a copy to avoid mutating the original

    if (sortSelect) {
      const sortValue = sortSelect.value;
      switch (sortValue) {
        case 'price-asc':
          sortedList.sort((a, b) => (a.FinalPrice ?? 0) - (b.FinalPrice ?? 0));
          break;
        case 'price-desc':
          sortedList.sort((a, b) => (b.FinalPrice ?? 0) - (a.FinalPrice ?? 0));
          break;
        case 'name-asc':
          sortedList.sort((a, b) => (a.Name ?? '').localeCompare(b.Name ?? ''));
          break;
      }
    }

    this.renderList(sortedList);
  }

  /**
   * Update display with filtered events
   * Called by FilterManager when filters change
   */
  updateFilteredList(filteredList) {
    this.currentList = filteredList;
    // Apply current sort to filtered list
    this.sortAndRender(filteredList);
  }

  /**
   * Get the full unfiltered list
   * Used by FilterManager to apply filters
   */
  getFullList() {
    return this.fullList;
  }
}