export function initAutoCarousel(carouselEl, intervalMs = 5000) {
    const slides = Array.from(carouselEl.querySelectorAll('.pc-slide'));
    console.debug('[carousel] slides found:', slides.length);
    if (slides.length <= 1) {
      if (slides[0]) slides[0].classList.add('is-active');
      return;
    }
  
    let idx = 0;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === 0));
  
    function tick() {
      slides[idx].classList.remove('is-active');
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add('is-active');
    }
  
    let timer = setInterval(tick, intervalMs);
    const pause = () => { if (timer) { clearInterval(timer); timer = null; } };
    const resume = () => { if (!timer) timer = setInterval(tick, intervalMs); };
  
    carouselEl.addEventListener('mouseenter', pause);
    carouselEl.addEventListener('mouseleave', resume);
    carouselEl.addEventListener('focusin', pause);
    carouselEl.addEventListener('focusout', resume);
  }
  
  export function buildAutoCarousel({
    wrapper,
    urls,
    productName = 'Product',
    interval = 5000,
    keepFlag = true,
  }) {
    const existingFlag = keepFlag ? (wrapper.querySelector('#discountFlag') || null) : null;
    Array.from(wrapper.children).forEach((n) => { if (n !== existingFlag) n.remove(); });
  
    const carousel = document.createElement('div');
    carousel.className = 'product-carousel';
    carousel.setAttribute('aria-roledescription', 'carousel');
    carousel.setAttribute('aria-label', `${productName} images`);
    carousel.dataset.length = String(urls.length); // for easy debugging
  
    const track = document.createElement('div');
    track.className = 'pc-track';
  
    urls.forEach((url, i) => {
      const slide = document.createElement('img');
      slide.className = 'pc-slide';
      slide.src = url;
      slide.alt = `${productName} – image ${i + 1} of ${urls.length}`;
      track.appendChild(slide);
    });
  
    carousel.appendChild(track);
    wrapper.appendChild(carousel);
  
    if (keepFlag && !existingFlag) {
      const newFlag = document.createElement('div');
      newFlag.id = 'discountFlag';
      newFlag.className = 'discount-flag';
      wrapper.prepend(newFlag);
    }
  
    initAutoCarousel(carousel, interval);
    return carousel;
  }