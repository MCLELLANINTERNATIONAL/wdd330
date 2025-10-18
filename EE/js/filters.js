// Filter Management Module
// Handles filter state, UI, and event filtering logic

export class FilterManager {
  constructor() {
    this.filters = {
      dateStart: null,
      dateEnd: null,
      priceMin: null,
      priceMax: null,
    };
    this.allEvents = [];
    this.filteredEvents = [];
    this.onFilterChange = null;
  }

  /**
   * Initialize filter UI and event listeners
   */
  init(onFilterChangeCallback) {
    this.onFilterChange = onFilterChangeCallback;
    this.setupEventListeners();
    this.setDefaultDateStart();
  }

  /**
   * Set default start date to today
   */
  setDefaultDateStart() {
    const today = new Date().toISOString().split('T')[0];
    const dateStartInput = document.getElementById('date-start');
    if (dateStartInput) {
      dateStartInput.value = today;
      this.filters.dateStart = today;
    }
  }

  /**
   * Setup all event listeners for filter UI
   */
  setupEventListeners() {
    // Mobile filter toggle
    const filterToggle = document.getElementById('filter-toggle');
    const filterSidebar = document.getElementById('filter-sidebar');
    const filterClose = document.getElementById('filter-close');

    if (filterToggle) {
      filterToggle.addEventListener('click', () => {
        filterSidebar.classList.toggle('open');
      });
    }

    if (filterClose) {
      filterClose.addEventListener('click', () => {
        filterSidebar.classList.remove('open');
      });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (filterSidebar && filterSidebar.classList.contains('open')) {
        if (
          !filterSidebar.contains(e.target) &&
          !filterToggle.contains(e.target)
        ) {
          filterSidebar.classList.remove('open');
        }
      }
    });

    // Filter form submission
    const filterForm = document.getElementById('filter-form');
    if (filterForm) {
      filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.applyFilters();
      });
    }

    // Clear filters button
    const clearButton = document.getElementById('clear-filters');
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        this.clearFilters();
      });
    }
  }

  /**
   * Apply current filter values
   */
  applyFilters() {
    // Get filter values from form
    const dateStart = document.getElementById('date-start').value;
    const dateEnd = document.getElementById('date-end').value;
    const priceMin = document.getElementById('price-min').value;
    const priceMax = document.getElementById('price-max').value;

    // Update filter state
    this.filters.dateStart = dateStart || null;
    this.filters.dateEnd = dateEnd || null;
    this.filters.priceMin = priceMin ? parseFloat(priceMin) : null;
    this.filters.priceMax = priceMax ? parseFloat(priceMax) : null;

    // Filter events
    this.filteredEvents = this.filterEvents(this.allEvents);

    // Update UI
    this.updateFilterChips();
    this.updateFilterCount();

    // Close mobile sidebar
    const filterSidebar = document.getElementById('filter-sidebar');
    if (filterSidebar) {
      filterSidebar.classList.remove('open');
    }

    // Notify callback
    if (this.onFilterChange) {
      this.onFilterChange(this.filteredEvents);
    }
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    // Reset form
    document.getElementById('filter-form').reset();

    // Reset to default date start (today)
    this.setDefaultDateStart();

    // Clear other filters
    this.filters.dateEnd = null;
    this.filters.priceMin = null;
    this.filters.priceMax = null;

    // Re-filter events
    this.filteredEvents = this.filterEvents(this.allEvents);

    // Update UI
    this.updateFilterChips();
    this.updateFilterCount();

    // Notify callback
    if (this.onFilterChange) {
      this.onFilterChange(this.filteredEvents);
    }
  }

  /**
   * Set the full list of events to filter
   */
  setEvents(events) {
    this.allEvents = events;
    this.filteredEvents = this.filterEvents(events);
    this.updateCounts();
    return this.filteredEvents;
  }

  /**
   * Filter events based on current filter state
   */
  filterEvents(events) {
    return events.filter((event) => {
      // Date filtering
      if (this.filters.dateStart || this.filters.dateEnd) {
        const eventDate = this.getEventDate(event);
        if (!eventDate) return false;

        if (this.filters.dateStart) {
          const startDate = new Date(this.filters.dateStart);
          if (eventDate < startDate) return false;
        }

        if (this.filters.dateEnd) {
          const endDate = new Date(this.filters.dateEnd);
          endDate.setHours(23, 59, 59, 999); // End of day
          if (eventDate > endDate) return false;
        }
      }

      // Price filtering
      if (this.filters.priceMin !== null || this.filters.priceMax !== null) {
        const eventPrice = this.getEventPrice(event);

        // If event has no price and we have a min price filter, exclude it
        if (
          eventPrice === null &&
          this.filters.priceMin !== null &&
          this.filters.priceMin > 0
        ) {
          return false;
        }

        // If event has a price, apply price filters
        if (eventPrice !== null) {
          if (
            this.filters.priceMin !== null &&
            eventPrice < this.filters.priceMin
          ) {
            return false;
          }

          if (
            this.filters.priceMax !== null &&
            eventPrice > this.filters.priceMax
          ) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * Extract event date from Ticketmaster API format
   */
  getEventDate(event) {
    if (event.dates && event.dates.start && event.dates.start.dateTime) {
      return new Date(event.dates.start.dateTime);
    }
    if (event.dates && event.dates.start && event.dates.start.localDate) {
      return new Date(event.dates.start.localDate);
    }
    return null;
  }

  /**
   * Extract event price from Ticketmaster API format
   */
  getEventPrice(event) {
    if (event.priceRanges && event.priceRanges.length > 0) {
      return event.priceRanges[0].min || 0;
    }
    return null;
  }

  /**
   * Update filter chips display
   */
  updateFilterChips() {
    const chipsContainer = document.getElementById('filter-chips');
    const activeFiltersSection = document.getElementById('active-filters');

    if (!chipsContainer || !activeFiltersSection) return;

    // Clear existing chips
    chipsContainer.innerHTML = '';

    const chips = [];

    // Date chips
    if (this.filters.dateStart) {
      chips.push(
        this.createChip(
          'date-start',
          `From: ${this.formatDate(this.filters.dateStart)}`,
        ),
      );
    }
    if (this.filters.dateEnd) {
      chips.push(
        this.createChip(
          'date-end',
          `To: ${this.formatDate(this.filters.dateEnd)}`,
        ),
      );
    }

    // Price chips
    if (this.filters.priceMin !== null) {
      chips.push(
        this.createChip('price-min', `Min: £${this.filters.priceMin}`),
      );
    }
    if (this.filters.priceMax !== null) {
      chips.push(
        this.createChip('price-max', `Max: £${this.filters.priceMax}`),
      );
    }

    // Show/hide active filters section
    if (chips.length > 0) {
      activeFiltersSection.classList.remove('hidden');
      chips.forEach((chip) => chipsContainer.appendChild(chip));
    } else {
      activeFiltersSection.classList.add('hidden');
    }
  }

  /**
   * Create a filter chip element
   */
  createChip(filterId, text) {
    const chip = document.createElement('span');
    chip.className = 'filter-chip';
    chip.innerHTML = `
      ${text}
      <button class="chip-remove" data-filter="${filterId}" aria-label="Remove filter">×</button>
    `;

    // Add remove handler
    chip.querySelector('.chip-remove').addEventListener('click', () => {
      this.removeFilter(filterId);
    });

    return chip;
  }

  /**
   * Remove a specific filter
   */
  removeFilter(filterId) {
    switch (filterId) {
      case 'date-start':
        document.getElementById('date-start').value = '';
        this.filters.dateStart = null;
        break;
      case 'date-end':
        document.getElementById('date-end').value = '';
        this.filters.dateEnd = null;
        break;
      case 'price-min':
        document.getElementById('price-min').value = '';
        this.filters.priceMin = null;
        break;
      case 'price-max':
        document.getElementById('price-max').value = '';
        this.filters.priceMax = null;
        break;
    }

    this.applyFilters();
  }

  /**
   * Update filter count badge
   */
  updateFilterCount() {
    const filterCountBadge = document.getElementById('filter-count');
    if (!filterCountBadge) return;

    let activeCount = 0;
    if (this.filters.dateStart) activeCount++;
    if (this.filters.dateEnd) activeCount++;
    if (this.filters.priceMin !== null) activeCount++;
    if (this.filters.priceMax !== null) activeCount++;

    if (activeCount > 0) {
      filterCountBadge.textContent = activeCount;
      filterCountBadge.classList.remove('hidden');
    } else {
      filterCountBadge.classList.add('hidden');
    }
  }

  /**
   * Update event counts display
   */
  updateCounts() {
    const filteredCountEl = document.getElementById('filtered-count');
    const totalCountEl = document.getElementById('total-count');

    if (filteredCountEl) {
      filteredCountEl.textContent = this.filteredEvents.length;
    }
    if (totalCountEl) {
      totalCountEl.textContent = this.allEvents.length;
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  /**
   * Get current filtered events
   */
  getFilteredEvents() {
    return this.filteredEvents;
  }
}
