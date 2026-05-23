# 📚 DigitalLibrary
 
A lightweight reading list app — search any book or author, save what catches your eye, and track what you've read.
 
---
 
## What It Does
 
- Search for books or authors using the **OpenLibrary API**
- Browse results with **cover images, titles, and author names**
- **Save any book** to your personal reading list with one click
- Toggle saved books between **Want to Read** and **Read**
- Your list **persists across sessions** via Firebase Firestore
---
 
## Tech Stack
 
| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | HTML, CSS, JavaScript (vanilla)     |
| Database    | Firebase Firestore                  |
| External API| OpenLibrary (free, no key required) |
| Hosting     | GitHub Pages                        |
 
---
 
## Project Structure
 
```
digitallibrary/
├── index.html          # App shell and search UI
├── style.css           # Styles and layout
├── app.js              # Search, display, and reading list logic
├── firebase.js         # Firestore initialisation and config
├── agents.md           # Agent context and build instructions
└── README.md           # This file
```
 
---
 
## Getting Started
 
### 1. Clone the repo
 
```bash
git clone https://github.com/your-username/digitallibrary.git
cd digitallibrary
```
 
### 2. Set up Firebase
 
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Enable **Firestore Database** in test mode
3. Copy your Firebase config object into `firebase.js`
```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  ...
};
```
 
### 3. Deploy to GitHub Pages
 
1. Push the repo to GitHub
2. Go to **Settings → Pages**
3. Set source to the `main` branch, root folder
4. Your app will be live at `https://your-username.github.io/digitallibrary`
> No build step needed — this is plain HTML/CSS/JS.
 
---
 
## API Reference
 
DigitalLibrary uses the [OpenLibrary Search API](https://openlibrary.org/developers/api). No key or account required.
 
**Search endpoint:**
```
GET https://openlibrary.org/search.json?q={query}&limit=20
```
 
**Cover image:**
```
https://covers.openlibrary.org/b/id/{cover_id}-M.jpg
```
 
Results with no cover fall back to a placeholder.
 
---
 
## Firestore Data Model
 
Each saved book is stored as a document in the `books` collection:
 
```json
{
  "olid": "OL45883W",
  "title": "The Hitchhiker's Guide to the Galaxy",
  "author": "Douglas Adams",
  "coverId": 8739161,
  "status": "want_to_read",
  "savedAt": "2026-05-23T10:00:00Z"
}
```
 
`status` is either `"want_to_read"` or `"read"`.
 
---
 
## Firestore Rules (Recommended)
 
For a personal app without auth, use:
 
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /books/{bookId} {
      allow read, write: if true;
    }
  }
}
```
 
For a public-facing app, add Firebase Authentication before deploying.
 
---
 
## Limitations
 
- No user authentication — all visitors share the same Firestore reading list unless auth is added
- OpenLibrary rate limit: 1 request/second (unauthenticated) or 3/sec with a User-Agent header
- Cover images are not available for all books; a fallback placeholder is shown
---
 
## License
 
MIT
