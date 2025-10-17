import { setLocalStorage } from "./utils.mjs";

const eventbriteURL = ''

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
    try {
      const apiKey = import.meta.env.VITE_TICKETMASTER_API_KEY;
      const eventbriteToken = import.meta.env.VITE_EVENTBRITE_TOKEN;

      // Check if API key is configured
      if (!apiKey) {
        throw new Error('API key not configured. Please check your environment settings.');
      }

      // Ticketmaster v2 API allows CORS, so we can call it directly
      const baseUrl = 'https://app.ticketmaster.com/discovery/v2/events.json';

      // Example URL format:
      // https://app.ticketmaster.com/discovery/v2/events.json?apikey=KEY&city=Edinburgh&segmentId=SEGMENT_ID

      // Map your categories to segment IDs or keywords
      const categoryMap = {
        music: 'KZFzniwnSyZfZ7v7nJ',
        theatre: 'KZFzniwnSyZfZ7v7na',
        sports: 'KZFzniwnSyZfZ7v7nE',
        cinema: '' // Cinema may need to use keyword or genre filter
      };

      let url = `${baseUrl}?apikey=${apiKey}&city=Edinburgh&size=50`; // e.g. size=50 results

      if (category === 'cinema') {
        // Cinema fallback: use keyword search for film or movie titles
        url += '&keyword=film';
      } else if (categoryMap[category]) {
        url += `&segmentId=${categoryMap[category]}`;
      }

      // Optional: add city, locale filters if needed
      // url += '&city=YourCity&locale=en-us'

      const response = await fetch(url);

      // Check if response is ok
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your credentials.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please try again in a moment.');
        } else if (response.status >= 500) {
          throw new Error('Server error. The service is temporarily unavailable.');
        } else {
          throw new Error(`Failed to fetch events (Error ${response.status})`);
        }
      }

      const data = await response.json();

      if (data._embedded && data._embedded.events) {
        return data._embedded.events;
      } else {
        return [];
      }
    } catch (error) {
      // If it's already our custom error, rethrow it
      if (error.message.includes('API key') ||
          error.message.includes('Too many requests') ||
          error.message.includes('Server error') ||
          error.message.includes('Failed to fetch')) {
        throw error;
      }

      // Network error or other issues
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }

      // Unknown error
      throw new Error('Unable to load events. Please try again later.');
    }
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
    return await fetch('src/checkout/', options).then(convertToJson);
  }
}