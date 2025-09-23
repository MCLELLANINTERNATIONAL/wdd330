import { getLocalStorage } from './utils.mjs';

// id - price - name - quantity of each item in the cart

//Pulling Totals from Cart instead of Local Storage
const cart = getLocalStorage('so-cart'); 
const total = getCartTotal(cart);
const discountTotal = getCartDiscount(cart);
const subTotal = Math.max(total - discountTotal, 0);

const numItems = getLocalStorage('num-items');

const subValue = document.getElementById('sub-value');
const taxValue = document.getElementById('tax-value');
const shipValue = document.getElementById('ship-value');
const finValue = document.getElementById('fin-value');

export function displaySub() {
  subValue.textContent = subTotal.toFixed(2);
}
export function displayTotals() {
  displaySub();

  let tax = subTotal * 0.06;
  let ship = numItems * 2 + 8;

  taxValue.textContent = tax.toFixed(2);
  shipValue.textContent = ship.toFixed(2);
  finValue.textContent = (tax + ship + subTotal).toFixed(2);
}

function getCartTotal(cart) {
  return cart.reduce((sum, item) => {
    const qty = Number(item?.quantity ?? 1) || 1;
    const { compare } = getUnitPricing(item);
    return sum + compare * qty;
  }, 0);
}

function getCartDiscount(cart) {
  return cart.reduce((sum, item) => {
    const qty = Number(item?.quantity ?? 1) || 1;
    const { save } = getUnitPricing(item);
    return sum + save * qty;
  }, 0);
}

function getUnitPricing(item) {
  const final = coercePrice(
    item?._finalPrice ??
      item?.FinalPrice ??
      item?.price ??
      item?.Price ??
      item?.ListPrice ??
      0,
  );

  let pct = Number(item?._discountPct);
  if (!Number.isFinite(pct)) {
    // Fallback: derive from a compare/original price 
    const compareGuess = coercePrice(
      item?._comparePrice ??
        item?.Price ??
        item?.ListPrice ??
        item?.MSRP ??
        item?.SuggestedRetailPrice ??
        0,
    );
    if (compareGuess > final) {
      pct = Math.round(((compareGuess - final) / compareGuess) * 100);
    } else {
      pct = 0;
    }
  }

  // Compute compare and save from final and pct
  const compare = pct > 0 ? final / (1 - pct / 100) : final;
  const save = Math.max(compare - final, 0);

  return { final, compare, pct, save };
}

function coercePrice(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : 0;
  }
  return 0;
}