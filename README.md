# BidZone Firebase auction app

BidZone is a static, real-time auction marketplace built with Firebase's modular CDN SDK. It has Google sign-in, live Firestore product and bid updates, Firebase Storage images, bid transactions, seller management, countdowns, search, filtering and a responsive dark-blue/white/gold interface.

## Run it locally

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Add a **Web app**, copy its config, and replace the `PASTE_*` values in `scripts/firebase-config.js`. No real credentials are committed to this repository.
3. In **Authentication → Sign-in method**, enable **Google** and add the domain you use for Live Server (normally `localhost`) under authorised domains.
4. Create a Firestore database and deploy/copy the rules in `firestore.rules`.
5. Enable Firebase Storage and deploy/copy `storage.rules`. Update the bucket value in the config if your project uses the newer `PROJECT_ID.firebasestorage.app` bucket name.
6. Open the project root with VS Code and choose **Go Live** (VS Code Live Server). Do not open the HTML files with `file://`; browser module and Firebase restrictions require HTTP.

## Publish on GitHub Pages

This is a static Firebase application, so GitHub Pages hosts the frontend and Firebase provides authentication, database and storage. In the GitHub repository, put the contents of this folder directly in the repository root so `index.html` is at the top level (not inside another `Online Auction System` folder).

In **Settings → Pages**, select the `main` branch and `/ (root)`. Then add this domain in Firebase **Authentication → Settings → Authorized domains**:

```text
divyaps3054-hub.github.io
```

The hosted site will be:

```text
https://divyaps3054-hub.github.io/Online-Auction-System/
```

Deploy the Firestore and Storage rules from this project before using products or bids. GitHub Pages cannot run the old Flask server; Firebase is the backend for this version.

The app intentionally displays a setup message until a real Firebase config is supplied. It does not contain dummy data or fake credentials.

## Firebase CLI (optional)

```bash
firebase login
firebase use YOUR_PROJECT_ID
firebase deploy --only firestore:rules,storage
```

## Data model

- `products/{productId}`: title, description, category, imageUrl, startingPrice, currentPrice, endTime, sellerId, sellerName, sellerEmail, bidCount, createdAt, updatedAt.
- `bids/{bidId}`: productId, bidderId, bidderName, amount, createdAt.

The bid flow uses a Firestore transaction so the product price and bid record change atomically. Firestore and Storage rules also enforce authenticated access and seller ownership.
