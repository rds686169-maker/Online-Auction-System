// BidZone Firebase configuration.
// Replace every PASTE_* value with the config from Firebase Console > Project settings.
// This file is intentionally free of real credentials so it is safe to commit.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBaKlrBps1VkE9OyW3qTtuTTKgvwlfD-Ik",
  authDomain: "online-auction-system-99a8c.firebaseapp.com",
  projectId: "online-auction-system-99a8c",
  storageBucket: "online-auction-system-99a8c.firebasestorage.app",
  messagingSenderId: "566725782286",
  appId: "1:566725782286:web:5adc44fdcb2c5099f5055f",
  measurementId: "G-EMZ766HXL3"
};

export const firebaseConfigured = !Object.values(firebaseConfig).some((value) =>
  String(value).includes("PASTE_")
);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
