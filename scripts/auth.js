import { getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, GoogleAuthProvider, signOut } from
  "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { auth, firebaseConfigured } from "./firebase-config.js";
import { doc, setDoc, serverTimestamp } from
  "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { db } from "./firebase-config.js";

const provider = new GoogleAuthProvider();

export async function syncUserProfile(user) {
  if (!user || !firebaseConfigured) return;
  await setDoc(doc(db, "users", user.uid), {
    userId: user.uid,
    name: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL || "",
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export function showSetupMessage(target = document.querySelector("[data-setup-message]")) {
  if (!target || firebaseConfigured) return;
  target.hidden = false;
  target.innerHTML = `
    <strong>Firebase is not configured yet.</strong>
    Open <code>scripts/firebase-config.js</code>, paste your Firebase web app config,
    enable Google Authentication, Firestore and Storage, then reload this page using VS Code Live Server.
  `;
}

export function requireAuth() {
  return new Promise((resolve) => {
    if (!firebaseConfigured) {
      showSetupMessage();
      resolve(null);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (!user) {
        const next = `${location.pathname}${location.search}`;
        location.replace(`login.html?next=${encodeURIComponent(next)}`);
      }
      if (user) syncUserProfile(user).catch((error) => console.error("User profile sync failed:", error));
      resolve(user || null);
    }, (error) => {
      console.error("Auth state error", error);
      const next = `${location.pathname}${location.search}`;
      location.replace(`login.html?next=${encodeURIComponent(next)}`);
      resolve(null);
    });
  });
}

export function watchAuth(callback) {
  if (!firebaseConfigured) {
    showSetupMessage();
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    if (user) syncUserProfile(user).catch((error) => console.error("User profile sync failed:", error));
    callback(user);
  }, (error) => {
    console.error("Auth state error", error);
    callback(null);
  });
}

export async function signInWithGoogle() {
  if (!firebaseConfigured) throw new Error("Configure Firebase before signing in.");
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    if (error.code === "auth/popup-blocked") {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
}

export async function finishGoogleRedirect() {
  if (!firebaseConfigured) return null;
  return getRedirectResult(auth);
}

export async function logout() {
  if (firebaseConfigured) await signOut(auth);
}

export function setupLogoutButtons() {
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await logout();
        location.replace("login.html");
      } catch (error) {
        console.error(error);
        button.disabled = false;
      }
    });
  });
}

export function mountUser(user) {
  document.querySelectorAll("[data-user-name]").forEach((el) => {
    el.textContent = user?.displayName || user?.email || "BidZone member";
  });
  document.querySelectorAll("[data-user-avatar]").forEach((el) => {
    if (user?.photoURL) el.src = user.photoURL;
    el.alt = user?.displayName || "Your profile";
  });
}

export function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

export function formatDate(value) {
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString([], {
    dateStyle: "medium", timeStyle: "short"
  });
}

export function getMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  const millis = new Date(value).getTime();
  return Number.isNaN(millis) ? 0 : millis;
}

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

export function setNotice(message, type = "info", target = document.querySelector("[data-notice]")) {
  if (!target) return;
  target.className = `notice ${type}`;
  target.textContent = message;
  target.hidden = !message;
}

export function bindNavigation(user = null) {
  if (user) mountUser(user);
  setupLogoutButtons();
  document.querySelectorAll("[data-menu-toggle]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      document.querySelector(toggle.dataset.menuToggle)?.classList.toggle("open");
    });
  });
}
