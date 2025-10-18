export default class Alert {
  constructor(jsonPath = 'alerts.json') {
    this.jsonPath = jsonPath;
  }

  async showAlerts() {
    try {
      const response = await fetch(this.jsonPath);
      if (!response.ok) throw new Error('Could not load alerts');
      const alerts = await response.json();
      if (!alerts.length) return;

      const section = document.createElement('section');
      section.classList.add('alert-list');

      alerts.forEach((alert) => {
        const p = document.createElement('p');
        p.textContent = alert.message;
        p.style.background = alert.background || '';
        p.style.color = alert.color || '';
        section.appendChild(p);
      });

      const main = document.querySelector('main');
      if (main) main.prepend(section);
    } catch (e) {
      // console.error(e);
    }
  }
}
