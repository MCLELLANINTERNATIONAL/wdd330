import { getLocalStorage, setLocalStorage, updateCartBadge } from "./utils.mjs";

export default class ProductDetails {
    constructor(productId, dataSource) {
        this.productId = productId;
        this.product = {};
        this.dataSource = dataSource;
    }
    async init() {
        console.log(this.dataSource);
        this.product = await this.dataSource.findProductById(this.productId);
        console.log(this.product);
        this.renderProductDetails();
        document
            .getElementById('addToCart')
            .addEventListener('click', this.addProductToCart.bind(this));
        //ensure badge correct on load
        updateCartBadge();
    }
    addProductToCart() {
        const cart = getLocalStorage('so-cart') || [];
        const productId = this.product.Id
        const existing = cart.find(item => item.Id === productId);

        if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
        } else {
            this.product.quantity = 1;
            cart.push(this.product);
        }

        alert(`${this.product.Name} has been added to your cart.`);
        setLocalStorage('so-cart', cart);
        updateCartBadge();
    }

    
    renderProductDetails() {
        productDetailsTemplate(this.product);
    }
}

function productDetailsTemplate(product) {
    console.log(product);
    document.querySelector('h2').textContent = product.Brand.Name; 
    document.querySelector('h3').textContent = product.NameWithoutBrand; 
   
    const productImage = document.getElementById('productImage'); 
    productImage.src = product.Images.PrimaryLarge; 
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
  
