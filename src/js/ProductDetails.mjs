import { getLocalStorage, setLocalStorage } from "./utils.mjs";
import { updateCartBadge } from "./product.js";

export default class ProductDetails {
    constructor(productId, dataSource) {
        this.productId = productId;
        this.product = {};
        this.dataSource = dataSource;
    }
    async init() {
        this.product = await this.dataSource.findProductById(this.productId);
        // console.log(this.product);
        this.renderProductDetails();
        document
            .getElementById('addToCart')
            .addEventListener('click', this.addProductToCart.bind(this));
        //ensure badge correct on load
        updateCartBadge();
    }
    addProductToCart() {
        const cart = getLocalStorage('so-cart'); // always an array per your utils
        cart.push(this.product);
        setLocalStorage('so-cart', cart);
        // Update badge right after cart changes
        updateCartBadge();
    }

    
    renderProductDetails() {
        productDetailsTemplate(this.product);
    }
}

function productDetailsTemplate(product) {
    document.querySelector('h2').textContent = product.Brand.Name; 
    document.querySelector('h3').textContent = product.NameWithoutBrand; 
   
    const productImage = document.getElementById('productImage'); 
    productImage.src = product.Image; 
    productImage.alt = product.NameWithoutBrand; 

    const finalPrice = Number(product.FinalPrice); // Simple number conversion
    document.getElementById('productPrice').textContent = '$' + finalPrice.toFixed(2); // Basic formatting
    const descEl = document.getElementById('productDesc');
    if (descEl) {
      const discountPrice = finalPrice * 0.10; // 10% of FinalPrice
      descEl.innerHTML = product.DescriptionHtmlSimple + '<br>10% Discount Price: $' + discountPrice.toFixed(2);
    }

    // document.getElementById('productPrice').textContent = product.FinalPrice; 
    document.getElementById('productColor').textContent = product.Colors[0].ColorName; 
    // document.getElementById('productDesc').innerHTML = product.DescriptionHtmlSimple; 
    document.getElementById('addToCart').dataset.id = product.Id; 
}
  
