// Product listing page controller
// Handles display of events by category

import ProductData from './ExternalServices.mjs';
import ProductList from './ProductList.mjs';
import { getParam, updateCartBadge } from './utils.mjs';
import { FilterManager } from './filters.js';

// Update cart badge (header is inline on this page)
updateCartBadge();

// Get category from URL parameter
const category = getParam('category');

// Initialize product data source
const dataSource = new ProductData(category);

// Get the product list element
const listElement = document.querySelector('.product-list');

// Create and initialize the product list
if (listElement && category) {
  const productList = new ProductList(category, dataSource, listElement);

  // Initialize the product list and wait for it to load data
  productList.init().then(() => {
    // Get the full list of events from ProductList
    const allEvents = productList.getFullList();

    // Initialize filter manager
    const filterManager = new FilterManager();

    // Set the events in the filter manager and get initial filtered results
    const filteredEvents = filterManager.setEvents(allEvents);

    // Initialize filter UI with callback to update product list when filters change
    filterManager.init((filteredEvents) => {
      productList.updateFilteredList(filteredEvents);
      filterManager.updateCounts();
    });

    // Apply initial filter (default: from today)
    filterManager.applyFilters();
  });
}
