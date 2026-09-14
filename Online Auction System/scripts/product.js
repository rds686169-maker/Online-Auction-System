import { collection, doc, onSnapshot, query, runTransaction, serverTimestamp, where }
  from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { requireAuth, bindNavigation, formatMoney, formatDate, getMillis, escapeHtml, setNotice, showSetupMessage } from "./auth.js";

const id = new URLSearchParams(location.search).get("id");
const details = document.querySelector("#product-details");
const bidsList = document.querySelector("#bids-list");
let product = null;

function renderProduct(data) {
  const image = data.imageUrl || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1000&q=80";
  const ended = getMillis(data.endTime) <= Date.now();
  details.innerHTML = `
    <div class="detail-image"><img src="${escapeHtml(image)}" alt="${escapeHtml(data.title)}"></div>
    <div class="detail-copy">
      <span class="eyebrow">${escapeHtml(data.category || "Other")}</span>
      <h1>${escapeHtml(data.title)}</h1>
      <p class="detail-description">${escapeHtml(data.description || "No description provided.")}</p>
      <div class="price-panel"><span>Current bid</span><strong>${formatMoney(data.currentPrice ?? data.startingPrice)}</strong><small>${data.bidCount || 0} bids · starts at ${formatMoney(data.startingPrice)}</small></div>
      <div class="auction-facts"><div><span>Ends</span><strong>${formatDate(data.endTime)}</strong></div><div><span>Seller</span><strong>${escapeHtml(data.sellerName || data.sellerEmail || "BidZone seller")}</strong></div></div>
      <div class="countdown large ${ended ? "text-danger" : ""}" data-countdown="${getMillis(data.endTime)}">${ended ? "Auction ended" : "Calculating time…"}</div>
      <form id="bid-form" class="bid-form" ${ended ? "hidden" : ""}>
        <label for="bid-amount">Your maximum bid</label>
        <div class="bid-input"><span>$</span><input id="bid-amount" type="number" min="${Number(data.currentPrice ?? data.startingPrice) + 0.01}" step="0.01" required placeholder="0.00"><button class="button primary" type="submit">Place bid</button></div>
        <small class="muted">Your bid must be higher than the current bid.</small>
      </form>
      <div data-notice hidden></div>
    </div>`;
  document.querySelector("#bid-form")?.addEventListener("submit", placeBid);
  tick();
}

async function placeBid(event) {
  event.preventDefault();
  const amount = Number(new FormData(event.currentTarget).get("bid-amount"));
  if (!Number.isFinite(amount) || amount <= 0) return;
  const button = event.currentTarget.querySelector("button");
  button.disabled = true;
  try {
    await runTransaction(db, async (transaction) => {
      const productRef = doc(db, "products", id);
      const latest = await transaction.get(productRef);
      if (!latest.exists()) throw new Error("This auction no longer exists.");
      const current = latest.data();
      const now = Date.now();
      if (getMillis(current.endTime) <= now) throw new Error("This auction has ended.");
      const currentPrice = Number(current.currentPrice ?? current.startingPrice);
      if (amount <= currentPrice) throw new Error(`Bid more than ${formatMoney(currentPrice)}.`);
      const bidRef = doc(collection(db, "bids"));
      transaction.update(productRef, {
        currentPrice: amount, currentBidderId: user.uid, bidCount: Number(current.bidCount || 0) + 1, updatedAt: serverTimestamp()
      });
      transaction.set(bidRef, {
        productId: id, bidderId: user.uid, bidderName: user.displayName || user.email,
        amount, createdAt: serverTimestamp()
      });
    });
    event.currentTarget.reset();
    setNotice("Bid placed successfully — you are now the highest bidder.", "success");
  } catch (error) {
    console.error(error);
    setNotice(error.message || "Unable to place bid.", "error");
  } finally { button.disabled = false; }
}

function renderBids(snapshot) {
  const bids = snapshot.docs.map((item) => item.data()).sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
  bidsList.innerHTML = bids.length ? bids.map((bid) => `
    <li><div><strong>${escapeHtml(bid.bidderName || "Bidder")}</strong><small>${formatDate(bid.createdAt)}</small></div><strong>${formatMoney(bid.amount)}</strong></li>`).join("") :
    `<li class="muted">No bids yet. Be the first to make an offer.</li>`;
}

function tick() {
  const el = document.querySelector("[data-countdown]");
  if (!el) return;
  const remaining = Number(el.dataset.countdown) - Date.now();
  if (remaining <= 0) { el.textContent = "Auction ended"; el.classList.add("text-danger"); return; }
  const sec = Math.floor(remaining / 1000);
  el.textContent = `${Math.floor(sec / 86400)}d ${Math.floor(sec % 86400 / 3600)}h ${Math.floor(sec % 3600 / 60)}m ${sec % 60}s remaining`;
}

const user = await requireAuth();
if (user && id) {
  bindNavigation(user);
  const productRef = doc(db, "products", id);
  onSnapshot(productRef, (snapshot) => {
    if (!snapshot.exists()) { details.innerHTML = `<div class="empty-state"><h2>Auction not found</h2><a class="button primary" href="index.html">Back to marketplace</a></div>`; return; }
    product = snapshot.data(); renderProduct(product);
  });
  onSnapshot(query(collection(db, "bids"), where("productId", "==", id)), renderBids);
  setInterval(tick, 1000);
} else if (!id) {
  details.innerHTML = `<div class="empty-state"><h2>Missing auction</h2></div>`;
} else showSetupMessage();
