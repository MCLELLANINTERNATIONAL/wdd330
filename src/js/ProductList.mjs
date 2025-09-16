import { renderListWithTemplate } from './utils.mjs';

function productCardTemplate(product) {
    // matches the structure in /index.html
    //const id = product?.Id ?? '';
    //const href = `product_pages/index.html?product=${encodeURIComponent(id)}`;
    //const img = product?.Image ?? '';
    //const brand = product?.Brand?.Name ?? '';
    //const name = product?.NameWithoutBrand ?? product?.Name ?? 'Product';
    //const price =
    //  typeof product?.FinalPrice === 'number'
    //    ? `$${product.FinalPrice.toFixed(2)}`
    //    : `$${product?.FinalPrice ?? '0.00'}`;
  
    return `<li class="product-card">
      <a href='/product_pages/?product=${product.Id}'>
        <img src='${product.Images.PrimaryMeduim}' alt='${product.Name}'>
        <h2 class="card__brand">${brand}</h2>
        <h3>${product.Brand.Name}</h3>
        <p class='product-card__price'>$${product.FinalPrice}</p>
      </a>
    </li>`;
}

export default class ProductList {
    constructor(category, dataSource, listElement) {
      // You passed in this information to make the class as reusable as possible.
      // Being able to define these things when you use the class will make it very flexible
      this.category = category;
      this.dataSource = dataSource;
      this.listElement = typeof listElement;
      // === 'string'
      //? document.querySelector(listElement)
      //: listElement;

    //this.products = [];
    }
  
    async init() {
        const list = await this.dataSource.getData(this.category);
        //this.products = await this.dataSource.getData();
        this.renderList(list);
        document.querySelector(".title").textContent = this.category;
    }
    
  renderList(list) {
  //if (!this.listElement) return;
 //renderListWithTemplate(
  //    productCardTemplate, // your top-level template function
  //    this.listElement,    // where to render
   //   products,            // data
   //   'afterbegin',        // position (default is fine)
   //   true                 // clear existing content (replaces innerHTML approach)
   // );
  
   renderListWithTemplate(productCardTemplate, this.listElement, list);
  }
}
