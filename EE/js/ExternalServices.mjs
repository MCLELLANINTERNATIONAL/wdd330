import { setLocalStorage } from './utils.mjs';

const eventbriteURL = ''

async function convertToJson(res) {
  const jsonResponse = await res.json();
  if (!res.ok) throw { name: 'servicesError', message: jsonResponse };
  return jsonResponse;
}

export default class eventData {
  constructor(category) {
    this.category = category;
  }

  async getData(category = this.category) {
    const apiKey = 'HGiBZ5JTwATOOhB0kIGZWXAgCXwrglXq';
    const baseUrl = 'https://app.ticketmaster.com/discovery/v1/events.json';
    const ticketmasterURL = '';

    https://app.ticketmaster.com/discovery/v2/events.json?apikey=HGiBZ5JTwATOOhB0kIGZWXAgCXwrglXq&city=Edinburgh&segmentId=KZFzniwnSyZfZ7v7nJ

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
      url = `${eventbriteURL}`;
    } else if (categoryMap[category]) {
      url += `&segmentId=${categoryMap[category]}`;
    }

    // Optional: add city, locale filters if needed
    // url += '&city=YourCity&locale=en-us'

    const response = await fetch(url);
    const data = await response.json();
    if (data._embedded && data._embedded.events) {
      return data._embedded.events;
    } else {
      return [];
    }
  }
  async findeventById(id) {
    const events = await this.getData();
    return events.find(item => item.Id === id);
  }

  async checkout(payload) {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    console.log('Order Sent');
    setLocalStorage('order', payload);
    return await fetch('src/checkout/', options).then(convertToJson);
  }
}