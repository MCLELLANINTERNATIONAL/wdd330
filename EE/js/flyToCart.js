// fly-to-cart.js
export function flyToCart({ imageUrl, fromEl, cartSelector = ".js-cart-btn", duration = 700 } = {}) {
    const cartEl = document.querySelector(cartSelector);
    if (!cartEl || (!fromEl && !imageUrl)) return;
  
    // Determine a start rect + image
    const startRect = (fromEl?.getBoundingClientRect && fromEl.getBoundingClientRect()) || null;
    const startX = startRect ? startRect.left + startRect.width / 2 : window.innerWidth / 2;
    const startY = startRect ? startRect.top + startRect.height / 2 : window.innerHeight / 2;
  
    const endRect = cartEl.getBoundingClientRect();
    const endX = endRect.left + endRect.width / 2;
    const endY = endRect.top + endRect.height / 2;
  
    const img = document.createElement("img");
    img.src = imageUrl || (fromEl?.src ?? "");
    img.alt = "";
    img.style.position = "fixed";
    img.style.left = `${startX - 24}px`;
    img.style.top = `${startY - 24}px`;
    img.style.width = "48px";
    img.style.height = "48px";
    img.style.objectFit = "cover";
    img.style.borderRadius = "8px";
    img.style.zIndex = "9999";
    img.style.pointerEvents = "none";
    img.style.transition = `transform ${duration}ms cubic-bezier(.22,.61,.36,1), opacity ${duration}ms ease`;
  
    document.body.appendChild(img);
  
    const dx = endX - startX;
    const dy = endY - startY;
  
    requestAnimationFrame(() => {
      img.style.transform = `translate(${dx}px, ${dy}px) scale(0.3)`;
      img.style.opacity = "0.2";
    });
  
    window.setTimeout(() => {
      img.remove();
    }, duration + 60);
  }
  