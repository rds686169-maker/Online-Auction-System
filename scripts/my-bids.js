import { collection, onSnapshot, query, where } from
  "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { requireAuth, bindNavigation, formatMoney, formatDate, getMillis, escapeHtml, showSetupMessage } from "./auth.js";

const list = document.querySelector("#my-bids-list");
const user = await requireAuth();
if (user) {
  bindNavigation(user);
  let userBids = [];
  let products = new Map();
  const render = () => {
    const bids = userBids.sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
    if (!bids.length) {
      list.innerHTML = `<div class="empty-state"><h3>Your bid history is empty</h3><p>Explore live auctions and make your first offer.</p><a class="button primary" href="index.html">Explore auctions</a></div>`; return;
    }
    const groups = new Map();
    bids.forEach((bid) => { if (!groups.has(bid.productId)) groups.set(bid.productId, bid); });
    list.innerHTML = [...groups.values()].map((bid) => {
      const product = products.get(bid.productId) || {};
      const current = Number(product.currentPrice ?? bid.amount);
      const ended = getMillis(product.endTime) <= Date.now();
      const leading = Number(bid.amount) >= current;
      const status = ended ? (leading ? "Won auction" : "Auction ended") : (leading ? "Currently leading" : "Outbid");
      return `<article class="manage-card"><div class="bid-symbol">↗</div><div class="manage-info"><span class="eyebrow">${escapeHtml(status)}</span><h3><a href="product.html?id=${bid.productId}">${escapeHtml(product.title || "Auction")}</a></h3><p class="muted">Your bid: ${formatMoney(bid.amount)} · Current: ${formatMoney(current)} · ${formatDate(bid.createdAt)}</p></div><strong class="bid-amount">${formatMoney(current)}</strong><a class="button small" href="product.html?id=${bid.productId}">Open</a></article>`;
    }).join("");
  };
  onSnapshot(query(collection(db, "bids"), where("bidderId", "==", user.uid)), (snapshot) => {
    userBids = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    render();
  });
  onSnapshot(collection(db, "products"), (snapshot) => {
    products = new Map(snapshot.docs.map((item) => [item.id, { id: item.id, ...item.data() }]));
    render();
  });
} else showSetupMessage();
