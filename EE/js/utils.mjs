// utils.mjs — robust partial loader for /public/partials + fixes dates after inject

export async function loadTemplate(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

// Try multiple depths and two bases: "partials/" and "public/partials/"
async function findPartial(relFile) {
  const depths = ["", "../", "../../", "../../../"];
  const bases = ["partials/", "public/partials/"];

  for (const depth of depths) {
    for (const base of bases) {
      const url = depth + base + relFile;
      try {
        const html = await loadTemplate(url);
        // IMPORTANT: return depth separately from base
        // We will only use `depth` to rebase links (never the base folder path).
        return { html, depthPrefix: depth, baseUsed: base };
      } catch (_) {
        // keep trying
      }
    }
  }
  throw new Error(`Could not load ${relFile} from partials or public/partials at any depth`);
}

// Rebase only *relative* URLs using the depth prefix, NOT the partials folder path.
function rebaseRelativeUrls(rootElem, depthPrefix) {
  rootElem.querySelectorAll('a[href], img[src], link[href], script[src]').forEach(el => {
    const attr = el.tagName === "IMG" || el.tagName === "SCRIPT" ? "src" : "href";
    const val = el.getAttribute(attr);
    if (!val) return;

    // Skip absolute or root-absolute URLs
    if (/^(?:https?:)?\/\//i.test(val) || val.startsWith("/")) return;

    // Skip in-page anchors and mailto/tel
    if (val.startsWith("#") || val.startsWith("mailto:") || val.startsWith("tel:")) return;

    // Avoid double-prefixing
    if (val.startsWith("./") || val.startsWith("../")) {
      // already relative to the page; optionally leave it alone
      return;
    }

    // Rebase with depth only (e.g., "../"), NOT "public/partials/"
    el.setAttribute(attr, depthPrefix + val);
  });
}

// After footer inject, ensure current year + last modified are set
function applyDates() {
  try {
    const currentYearElement = document.getElementById('currentyear');
    if (currentYearElement) currentYearElement.textContent = new Date().getFullYear();

    const lastModifiedElement = document.getElementById('lastModified');
    if (lastModifiedElement) lastModifiedElement.textContent = `Last Modified: ${document.lastModified}`;
  } catch { }
}

export async function loadHeaderFooter() {
  const headerHost = document.querySelector('#main-head');
  const footerHost = document.querySelector('#main-foot');

  // Header
  if (headerHost) {
    const { html, depthPrefix } = await findPartial("header.html");
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    rebaseRelativeUrls(wrapper, depthPrefix);
    headerHost.innerHTML = "";
    headerHost.append(...wrapper.childNodes);

    // If you have a badge updater, call it
    try { typeof updateCartBadge === "function" && updateCartBadge(); } catch { }
  }

  // Footer
  if (footerHost) {
    const { html, depthPrefix } = await findPartial("footer.html");
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    rebaseRelativeUrls(wrapper, depthPrefix);
    footerHost.innerHTML = "";
    footerHost.append(...wrapper.childNodes);

    // Now that #lastModified exists, set it
    applyDates();
  }
}
