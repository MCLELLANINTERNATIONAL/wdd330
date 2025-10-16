import { renderListWithTemplate, getParam } from './utils.mjs';
import eventData from './ExternalServices.mjs';
import eventDetails, { rendereventDetailsHTML } from './EventDetails.mjs';

function eventCardTemplate(event) {
    // matches the structure in /index.html
    const category = getParam('category')
    const id = event?.Id ?? '';
    const href = `../event_pages/index.html?category=${category}&id=${encodeURIComponent(id)}`;
    const img = event?.Images.PrimaryMedium ?? '';
    const brand = event?.Brand?.Name ?? '';
    const name = event?.name;
    const price =
      typeof event?.FinalPrice === 'number'
        ? `$${event.FinalPrice.toFixed(2)}`
        : `$${event?.FinalPrice ?? '0.00'}`;
  
    return `<li class='event-card'>
      <a href='${href}'>
        <p class='event-card__price'>${price}</p>
        <img 
          src='${event.Images.PrimaryMedium}' 
          srcset='
            ${event.Images.PrimarySmall} 80w,
            ${event.Images.PrimaryMedium} 160w
          '
          sizes='(max-width: 600px) 50vw, 160px'
          alt='Image of ${name}'>
        <h2 class='card__brand'>${brand}</h2>
        <h3 class='card__name'>${name}</h3>
      </a>
      <button class='quick-view' data-id=${event.Id}>Quick View</button>
    </li>`;
}

export default class eventList {
    constructor(category, dataSource, listElement, query) {
      // You passed in this information to make the class as reusable as possible.
      // Being able to define these things when you use the class will make it very flexible
      this.category = category;
      this.dataSource = dataSource;
      this.listElement = typeof listElement === 'string'
      ? document.querySelector(listElement)
      : listElement;
      this.query = query;
    }
  
    async init() {
      let list = await this.dataSource.getData(this.category);
      if (this.query) {
        document.title = `EE| ${this.query} Search Results`;
        list = list.filter(item =>
          item.Name?.toLowerCase().includes(this.query.toLowerCase())
        );
      }

      const sortSelect = document.getElementById('sort');
      if (sortSelect) {
        sortSelect.addEventListener('change', () => this.sortAndRender(list));
      }

      this.renderList(list);

      this.listElement.addEventListener('click', async (e) => {
        
        const qViewBtn = e.target.closest('.quick-view');
        if (!qViewBtn) return;

        const card = qViewBtn.closest('.event-card');
        const eventId = qViewBtn.dataset.id;

        const existingModal = card.querySelector('.quick-view-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'quick-view-modal';
        modal.innerHTML = `
          <div class='modal-content'>
            <span class='close'>&times;</span>
            <div class='modal-body'>Loading event details...</div>
          </div>
        `;
        card.appendChild(modal);

        const event = await this.dataSource.findeventById(eventId);
        modal.querySelector('.modal-body').innerHTML = rendereventDetailsHTML(event);

        modal.classList.add('show'); 

        modal.querySelector('.close').addEventListener('click', () => {
          modal.classList.remove('show');
          setTimeout(() => modal.remove(), 300);
        });
        modal.querySelector('#addToCartModal').addEventListener('click', async () => {
          await addToCart(eventId);
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

      async function addToCart(eventId) {
        const eventData = new eventData(); 
        const eventDetails = new eventDetails(eventId, eventData);
        eventDetails.addeventToCart();
      }
    }

    renderList(list) {
      if (!this.listElement) return;
      renderListWithTemplate(
        eventCardTemplate, // your top-level template function
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
}