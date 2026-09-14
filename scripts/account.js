import { updateProfile } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { requireAuth, bindNavigation, formatDate, setNotice, showSetupMessage } from "./auth.js";

const form = document.querySelector("#profile-form");
const user = await requireAuth();
if (user) {
  bindNavigation(user);
  document.querySelector("#account-name").textContent = user.displayName || "BidZone member";
  document.querySelector("#account-email").textContent = user.email || "";
  document.querySelector("#email-readonly").value = user.email || "";
  document.querySelector("#member-since").textContent = formatDate(user.metadata?.creationTime);
  form.elements.displayName.value = user.displayName || "";
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = form.elements.displayName.value.trim();
    if (!name) return setNotice("Enter a display name.", "error");
    try {
      await updateProfile(user, { displayName: name });
      document.querySelector("#account-name").textContent = name;
      setNotice("Profile updated.", "success");
    } catch (error) { setNotice(error.message || "Could not update profile.", "error"); }
  });
} else showSetupMessage();
