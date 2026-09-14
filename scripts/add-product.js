import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc }
  from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getDownloadURL, ref, uploadBytes } from
  "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";
import { db, storage } from "./firebase-config.js";
import { requireAuth, bindNavigation, formatDate, setNotice, showSetupMessage } from "./auth.js";

const form = document.querySelector("#product-form");
const id = new URLSearchParams(location.search).get("id");
let user;

function field(name) { return form.elements[name].value.trim(); }

async function loadProduct() {
  if (!id) return;
  const snapshot = await getDoc(doc(db, "products", id));
  if (!snapshot.exists() || snapshot.data().sellerId !== user.uid) {
    setNotice("You can only edit your own listings.", "error");
    form.querySelector("button[type=submit]").disabled = true;
    return;
  }
  const data = snapshot.data();
  ["title", "category", "description", "startingPrice"].forEach((name) => {
    if (form.elements[name]) form.elements[name].value = data[name] ?? "";
  });
  if (data.startTime) {
    const date = data.startTime.toDate ? data.startTime.toDate() : new Date(data.startTime);
    form.elements.startTime.value = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  if (data.endTime) {
    const date = data.endTime.toDate ? data.endTime.toDate() : new Date(data.endTime);
    form.elements.endTime.value = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  document.querySelector("#form-heading").textContent = "Edit your listing";
  document.querySelector("#form-intro").textContent = "Keep your auction details fresh and accurate.";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = form.querySelector("button[type=submit]");
  const price = Number(field("startingPrice"));
  const start = new Date(field("startTime"));
  const end = new Date(field("endTime"));
  if (!field("title") || !field("description") || !Number.isFinite(price) || price <= 0 || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end || end <= new Date()) {
    setNotice("Complete every field and choose valid start and end times.", "error"); return;
  }
  submit.disabled = true; submit.textContent = id ? "Saving…" : "Publishing…";
  try {
    let imageUrl;
    const file = form.elements.image.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) throw new Error("Images must be smaller than 5 MB.");
      const imageRef = ref(storage, `products/${user.uid}/${crypto.randomUUID()}-${file.name}`);
      await uploadBytes(imageRef, file, { contentType: file.type });
      imageUrl = await getDownloadURL(imageRef);
    }
    const payload = {
      title: field("title"), category: field("category"), description: field("description"),
      startingPrice: price, startTime: start, endTime: end, updatedAt: serverTimestamp()
    };
    if (imageUrl) payload.imageUrl = imageUrl;
    if (id) {
      await updateDoc(doc(db, "products", id), payload);
      setNotice("Listing updated. Redirecting to your products…", "success");
    } else {
      await addDoc(collection(db, "products"), {
        ...payload, sellerId: user.uid, sellerName: user.displayName || "", sellerEmail: user.email || "",
        currentPrice: price, bidCount: 0, createdAt: serverTimestamp()
      });
      setNotice("Listing published. Redirecting to your products…", "success");
    }
    setTimeout(() => location.replace("my-products.html"), 900);
  } catch (error) {
    console.error(error); setNotice(error.message || "Could not save listing.", "error");
    submit.disabled = false; submit.textContent = id ? "Save changes" : "Publish auction";
  }
});

user = await requireAuth();
if (user) { bindNavigation(user); await loadProduct(); } else showSetupMessage();
