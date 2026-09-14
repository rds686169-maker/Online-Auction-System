import { collection, deleteDoc, doc, onSnapshot, query, where }
  from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { requireAuth, bindNavigation, formatMoney, formatDate, getMillis, escapeHtml, setNotice, showSetupMessage } from "./auth.js";

const list = document.querySelector("#my-products-list");
const user = await requireAuth();
if (user) {
  bindNavigation(user);
  onSnapshot(query(collection(db, "products"), where("sellerId", "==", user.uid)), (snapshot) => {
    const products = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
    list.innerHTML = products.length ? products.map((item) => `
      <article class="manage-card">
        <div class="manage-thumb">${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="">` : "◆"}</div>
        <div class="manage-info"><span class="eyebrow">${escapeHtml(item.category || "Other")}</span><h3>${escapeHtml(item.title)}</h3><p class="muted">${formatMoney(item.currentPrice ?? item.startingPrice)} · ${item.bidCount || 0} bids · ends ${formatDate(item.endTime)}</p></div>
        <div class="manage-actions"><a class="button small" href="product.html?id=${item.id}">View</a><a class="button small" href="add-product.html?id=${item.id}">Edit</a><button class="button small danger" data-delete="${item.id}">Delete</button></div>
      </article>`).join("") : `<div class="empty-state"><h3>No listings yet</h3><p>Share something great with the BidZone community.</p><a class="button primary" href="add-product.html">List an item</a></div>`;
    list.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", async () => {
      if (!confirm("Delete this listing? This cannot be undone.")) return;
      try { await deleteDoc(doc(db, "products", button.dataset.delete)); setNotice("Listing deleted.", "success"); }
      catch (error) { setNotice(error.message || "Could not delete listing.", "error"); }
    }));
  });
} else showSetupMessage();
