import { setLocalStorage } from "./utils.mjs";

const baseURL = import.meta.env.VITE_SERVER_URL;

async function convertToJson(res) {
  const jsonResponse = await res.json();
  if (!res.ok) throw { name: 'servicesError', message: jsonResponse };
  return jsonResponse;
}

export default class ProductData {
  constructor(category) {
    this.category = category;
  }

  async getData(category = this.category) {
    if (!category || category === 'null' || category === 'undefined') {
      category = null;
    }
    const categoriesToFetch = category
      ? Array.isArray(category)
        ? category
        : [category]
      : ['backpacks', 'sleeping-bags', 'tents', 'hammocks'];
    const results = [];

    // fetch each category sequentially
    for (const cat of categoriesToFetch) {
      const response = await fetch(`${baseURL}products/search/${cat}`);
      const data = await convertToJson(response);
      results.push(...data.Result);
    }
    return results;
  }

  async findProductById(id) {
    const products = await this.getData();
    return products.find(item => item.Id === id);
  }

  async checkout(payload) {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    };
    console.log('Order Sent');
    setLocalStorage('order', payload);
    return await fetch(`${baseURL}checkout/`, options).then(convertToJson);
  }
}