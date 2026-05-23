# DigitalLibrary — Agent Context
 
This file gives AI coding agents (Claude Code, Copilot, Cursor, etc.) the context needed to work on this codebase without requiring explanation each session.
 
---
 
## App Summary
 
DigitalLibrary is a personal reading list app. Users search for books via the OpenLibrary API, save results to Firebase Firestore, and toggle books between "Want to Read" and "Read". It is a single-page app with no build step — plain HTML, CSS, and JavaScript hosted on GitHub Pages.
 
---
 
## Key Files
 
| File          | Purpose                                                         |
|---------------|-----------------------------------------------------------------|
| `index.html`  | App shell: search bar, results grid, reading list section       |
| `style.css`   | All visual styles                                               |
| `app.js`      | Search logic, OpenLibrary API calls, rendering, UI interactions |
| `firebase.js` | Firebase initialisation, Firestore read/write helpers           |
 
---
 
## External Services
 
### OpenLibrary API
- Base URL: `https://openlibrary.org`
- No API key required
- Search endpoint: `GET /search.json?q={query}&limit=20`
- Returns a `docs` array; each doc has `title`, `author_name[]`, `cover_i`, `key`
- Cover images: `https://covers.openlibrary.org/b/id/{cover_i}-M.jpg`
- Books with no `cover_i` should show a fallback placeholder image
- Add a `User-Agent` header with app name and contact to get 3 req/sec instead of 1
### Firebase Firestore
- Collection: `books`
- Document ID: use the OpenLibrary work key (e.g. `OL45883W`) to prevent duplicates
- Fields: `olid` (string), `title` (string), `author` (string), `coverId` (number|null), `status` (string: `"want_to_read"` | `"read"`), `savedAt` (ISO timestamp)
- On save: check if doc already exists before writing
- On toggle: update only the `status` field
- On page load: fetch all docs from `books` collection and render the reading list
---
 
## App Logic Flow
 
```
User types query
  → debounce 400ms
  → GET /search.json?q={query}&limit=20
  → render result cards (cover, title, author, Save button)
 
User clicks Save
  → check Firestore for existing doc with same olid
  → if not found: write new doc with status "want_to_read"
  → update Save button to show "Saved ✓"
 
Reading list on page load
  → fetch all docs from Firestore books collection
  → render each with title, author, cover, and a status toggle button
 
User clicks status toggle
  → if "want_to_read" → update to "read"
  → if "read" → update to "want_to_read"
  → re-render that card's button label
```
 
---
 
## Constraints & Conventions
 
- **No build step.** No npm, no bundler, no TypeScript. Everything runs directly in the browser.
- **No frameworks.** Vanilla JS only. DOM manipulation via `document.createElement` and `innerHTML`.
- **No user authentication** in the initial version. All users share one Firestore reading list. If auth is added later, scope all Firestore queries by `uid`.
- **ES Modules** are fine (`type="module"` in script tags).
- **Error handling:** all Firestore calls and fetch calls should be wrapped in try/catch. Show a user-visible error message if search fails; silently retry or log if a Firestore write fails.
- **Accessibility:** search input must have a label. Result cards must have `alt` text on cover images.
- **No inline styles.** All visual rules go in `style.css`.
---
 
## What Has Not Been Built Yet
 
The following are known gaps — agents should not assume these exist:
 
- User authentication (Firebase Auth)
- Ability to remove a book from the reading list
- Pagination of search results beyond the first 20
- Offline support or service worker
- Any backend or serverless functions
---
 
## Environment Notes
 
- Firebase config lives in `firebase.js` and is not committed to the repo (use a `.env`-style config or inject at deploy time via GitHub Actions secrets if needed)
- The app is hosted as a static site on GitHub Pages — there is no server
- All API calls are client-side
---
 
## Common Tasks for Agents
 
**Adding a Remove button to saved books:**
- Add a delete button to each reading list card
- On click: call `deleteDoc(doc(db, "books", olid))`
- Remove the card from the DOM
**Adding search pagination:**
- OpenLibrary supports `&offset=N` on the search endpoint
- Track current offset in state; add Next / Previous buttons below results
**Adding Firebase Auth:**
- Use Firebase Anonymous Auth as a lightweight option (no login form needed)
- Scope all Firestore queries with `where("uid", "==", currentUser.uid)`
- Store `uid` on each document at save time
 
