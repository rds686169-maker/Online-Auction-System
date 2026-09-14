import { collection, onSnapshot } from
  "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { requireAuth, bindNavigation, formatMoney, getMillis, escapeHtml, showSetupMessage } from "./auth.js";

const state = { products: [], search: "", category: "all", sort: "ending" };
const grid = document.querySelector("#product-grid");

function productCard(product) {
  const image = product.imageUrl || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80";
  const end = getMillis(product.endTime);
  const expired = end && end <= Date.now();
  return `
    <article class="product-card">
      <a class="product-image" href="product.html?id=${encodeURIComponent(product.id)}">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(product.title)}" loading="lazy">
        <span class="status-pill ${expired ? "ended" : ""}">${expired ? "Ended" : "Live auction"}</span>
      </a>
      <div class="product-card-body">
        <span class="eyebrow">${escapeHtml(product.category || "Other")}</span>
        <h3><a href="product.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.title)}</a></h3>
        <p class="muted">${escapeHtml((product.description || "").slice(0, 90))}</p>
        <div class="card-meta"><span>Current bid</span><strong>${formatMoney(product.currentPrice ?? product.startingPrice)}</strong></div>
        <div class="card-meta"><span>${product.bidCount || 0} bids</span><span class="${expired ? "text-danger" : "countdown"}" data-countdown="${end}">${expired ? "Auction ended" : "Loading…"}</span></div>
      </div>
    </article>`;
}

function render() {
  const query = state.search.trim().toLowerCase();
  let products = state.products.filter((product) => {
    const text = `${product.title || ""} ${product.description || ""} ${product.category || ""}`.toLowerCase();
    return (!query || text.includes(query)) &&
      (state.category === "all" || product.category === state.category);
  });
  products.sort((a, b) => {
    if (state.sort === "price-low") return (a.currentPrice ?? a.startingPrice) - (b.currentPrice ?? b.startingPrice);
    if (state.sort === "price-high") return (b.currentPrice ?? b.startingPrice) - (a.currentPrice ?? a.startingPrice);
    if (state.sort === "newest") return getMillis(b.createdAt) - getMillis(a.createdAt);
    return getMillis(a.endTime) - getMillis(b.endTime);
  });
  grid.innerHTML = products.length ? products.map(productCard).join("") :
    `<div class="empty-state"><span class="empty-icon">⌕</span><h3>No auctions found</h3><p>Try another search or be the first to list an item.</p></div>`;
}

function tick() {
  document.querySelectorAll("[data-countdown]").forEach((el) => {
    const remaining = Number(el.dataset.countdown) - Date.now();
    if (remaining <= 0) {
      el.textContent = "Auction ended";
      el.classList.add("text-danger");
      return;
    }
    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    el.textContent = days ? `${days}d ${hours}h left` : `${hours}h ${mins}m ${secs}s`;
  });
}

const user = await requireAuth();
if (user) {
  document.body.classList.remove("auth-pending");
  bindNavigation(user);
  document.querySelector("#search-input").addEventListener("input", (event) => {
    state.search = event.target.value; render();
  });
  document.querySelector("#category-filter").addEventListener("change", (event) => {
    state.category = event.target.value; render();
  });
  document.querySelector("#sort-filter").addEventListener("change", (event) => {
    state.sort = event.target.value; render();
  });
  onSnapshot(collection(db, "products"), (snapshot) => {
    state.products = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    render(); tick();
  }, (error) => {
    console.error(error);
    grid.innerHTML = `<div class="empty-state"><h3>Could not load auctions</h3><p>Check your Firestore rules and configuration.</p></div>`;
  });
  setInterval(tick, 1000);
} else {
  document.body.classList.remove("auth-pending");
  showSetupMessage();
}
