import { updateCartBadge } from './product.js'
import { getLocalStorage } from './utils.mjs';

async function loadProducts() {
    try {
        const response = await fetch("tents.json");
        const products = await response.json();

        const shownProducts = products.filter((product) => product.Show === true);
        const productList = document.querySelector(".product-list");
        productList.innerHTML = shownProducts.map(productCardTemplate).join("");
    } catch (error) {
        console.error("Error loading products:", error);
    }
}
function productCardTemplate(product) {
    return `
    <li class="product-card">
        <a href="product_pages/${product.Id}.html">
            <img
                src="${product.Image}"
                alt="${product.Name}"
            />
            <h3 class="card_brand">${product.Brand.Name}</h3>
            <h2 class="card_name">${product.NameWithoutBrand}<h2>
            <p class="product-card_price">$${product.FinalPrice}</p>
        </a>
    </li>`;
}

const cart = getLocalStorage('so-cart') || [];
updateCartBadge(cart.length);
loadProducts();