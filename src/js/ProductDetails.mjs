import { getLocalStorage, setLocalStorage } from "./utils.mjs";
import { updateCartBadge } from "./product";

export default class ProductDetails {
    constructor(productId, dataSource){
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
            // adding listener to when the page is reloaded, to display the correct cart badge information.
            addEventListener('DOMContentLoaded', () => {
            const cartList = getLocalStorage('so-cart') || [];
            console.log('Main page cartList:', cartList);
            updateCartBadge(cartList.length);
            });
    }
    
    addProductToCart(product) {
        const cart = getLocalStorage('so-cart'); // always an array per your utils
        cart.push(this.product);
        setLocalStorage('so-cart', cart);
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

    document.getElementById('productPrice').textContent = product.FinalPrice;
    document.getElementById('productColor').textContent = product.Colors[0].ColorName;
    document.getElementById('productDesc').innerHTML = product.DescriptionHtmlSimple;

    document.getElementById('addToCart').dataset.id = product.Id;
}