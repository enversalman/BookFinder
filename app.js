import { saveBookToDb, fetchReadingList, updateBookStatus, removeBookFromDb } from './firebase.js';

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchLoading = document.getElementById('search-loading');
const searchResults = document.getElementById('search-results');
const readingListGrid = document.getElementById('reading-list');
const errorBanner = document.getElementById('error-message');

// State
let debounceTimer;

// Constants
const API_BASE = 'https://openlibrary.org';
const FALLBACK_COVER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="320"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="50%" font-family="sans-serif" font-size="16" fill="%2394a3b8" text-anchor="middle" dy=".3em">No Cover</text></svg>';

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initSearch();
  loadReadingList();
});

function initSearch() {
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    
    if (query.length < 3) {
      if (query.length === 0) {
        searchResults.innerHTML = '<p class="empty-state">Type to start searching...</p>';
      } else {
        searchResults.innerHTML = '<p class="empty-state">Type at least 3 characters to start searching...</p>';
      }
      return;
    }

    debounceTimer = setTimeout(() => {
      performSearch(query);
    }, 400);
  });
}

function showError(msg) {
  errorBanner.textContent = msg;
  errorBanner.classList.remove('hidden');
  setTimeout(() => {
    errorBanner.classList.add('hidden');
  }, 5000);
}

async function performSearch(query) {
  try {
    searchLoading.classList.remove('hidden');
    searchResults.innerHTML = '';
    
    const response = await fetch(`${API_BASE}/search.json?q=${encodeURIComponent(query)}&limit=20&sort=editions`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    renderSearchResults(data.docs);
  } catch (err) {
    console.error("Search error:", err);
    showError("Failed to fetch search results. Please try again later.");
    searchResults.innerHTML = '<p class="empty-state">Search failed.</p>';
  } finally {
    searchLoading.classList.add('hidden');
  }
}

function getCoverUrl(coverId) {
  if (!coverId) return FALLBACK_COVER;
  return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
}

function renderSearchResults(docs) {
  if (!docs || docs.length === 0) {
    searchResults.innerHTML = '<p class="empty-state">No books found for this query.</p>';
    return;
  }

  searchResults.innerHTML = '';
  
  docs.forEach(doc => {
    const title = doc.title || 'Unknown Title';
    const author = doc.author_name ? doc.author_name.join(', ') : 'Unknown Author';
    const coverId = doc.cover_i;
    // document ID: use the OpenLibrary work key (e.g. OL45883W) to prevent duplicates
    const olidMatch = doc.key ? doc.key.match(/OL\d+W/) : null;
    const olid = olidMatch ? olidMatch[0] : (doc.cover_i ? `C${doc.cover_i}` : Math.random().toString(36).substring(7));
    
    if (!olidMatch) return; // Skip if we can't get a proper key

    const card = document.createElement('div');
    card.className = 'book-card';
    
    card.innerHTML = `
      <img src="${getCoverUrl(coverId)}" alt="Cover of ${title}" class="book-cover" onerror="this.src='${FALLBACK_COVER}'">
      <div class="book-info">
        <h3 class="book-title" title="${title}">${title}</h3>
        <p class="book-author">${author}</p>
        <div class="card-actions">
          <button class="btn btn-primary save-btn">Save to List</button>
        </div>
      </div>
    `;

    const saveBtn = card.querySelector('.save-btn');
    saveBtn.addEventListener('click', async () => {
      try {
        const saved = await saveBookToDb({
          olid,
          title,
          author,
          coverId: coverId || null
        });
        
        if (saved) {
          saveBtn.textContent = 'Saved ✓';
          saveBtn.classList.replace('btn-primary', 'btn-success');
          saveBtn.disabled = true;
          loadReadingList(); // refresh list
        } else {
          saveBtn.textContent = 'Already Saved';
          saveBtn.disabled = true;
        }
      } catch (err) {
        console.error("Save error:", err);
        if(err.code === "auth/invalid-api-key" || err.message.includes("API_KEY") || String(err).includes("YOUR_API_KEY")){
            showError("Please configure your Firebase credentials in firebase.js first!");
        } else if (err.code === "permission-denied" || err.message.includes("permissions")) {
            showError("Permission Denied: You need to update your Firestore Security Rules to allow read/write access.");
        } else {
            showError("Could not save the book. Check your connection or Firebase config.");
        }
      }
    });

    searchResults.appendChild(card);
  });
}

async function loadReadingList() {
  try {
    const books = await fetchReadingList();
    renderReadingList(books);
  } catch (err) {
    console.error("Fetch reading list error:", err);
    if(err.code === "auth/invalid-api-key" || err.message.includes("API_KEY") || String(err).includes("YOUR_API_KEY")){
       readingListGrid.innerHTML = '<p class="empty-state" style="color:var(--danger-color)">Firebase is not configured. Edit firebase.js to see your reading list.</p>';
    } else if (err.code === "permission-denied" || err.message.includes("permissions")) {
       readingListGrid.innerHTML = '<p class="empty-state" style="color:var(--danger-color)">Permission Denied: Please update your Firestore Security Rules in the Firebase Console.</p>';
    } else {
       readingListGrid.innerHTML = '<p class="empty-state">Could not load reading list.</p>';
    }
  }
}

function renderReadingList(books) {
  if (!books || books.length === 0) {
    readingListGrid.innerHTML = '<p class="empty-state">Your reading list is empty. Save some books to get started!</p>';
    return;
  }

  readingListGrid.innerHTML = '';

  // Sort by savedAt descending if available
  books.sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));

  books.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';
    
    const isRead = book.status === 'read';
    const toggleBtnClass = isRead ? 'btn-read' : 'btn-want';
    const toggleBtnText = isRead ? '✓ Read' : '+ Want to Read';
    
    card.innerHTML = `
      <img src="${getCoverUrl(book.coverId)}" alt="Cover of ${book.title}" class="book-cover" onerror="this.src='${FALLBACK_COVER}'">
      <div class="book-info">
        <h3 class="book-title" title="${book.title}">${book.title}</h3>
        <p class="book-author">${book.author}</p>
        <div class="card-actions">
          <button class="btn ${toggleBtnClass} toggle-status-btn">${toggleBtnText}</button>
          <button class="btn btn-remove remove-btn">Remove</button>
        </div>
      </div>
    `;

    const toggleBtn = card.querySelector('.toggle-status-btn');
    toggleBtn.addEventListener('click', async () => {
      try {
        const newStatus = book.status === 'want_to_read' ? 'read' : 'want_to_read';
        
        // Optimistic UI update
        book.status = newStatus;
        if (newStatus === 'read') {
          toggleBtn.className = 'btn btn-read toggle-status-btn';
          toggleBtn.textContent = '✓ Read';
        } else {
          toggleBtn.className = 'btn btn-want toggle-status-btn';
          toggleBtn.textContent = '+ Want to Read';
        }

        await updateBookStatus(book.olid, newStatus);
      } catch (err) {
        console.error("Update status error:", err);
        // Revert optimistic update
        book.status = book.status === 'want_to_read' ? 'read' : 'want_to_read';
        if (book.status === 'read') {
          toggleBtn.className = 'btn btn-read toggle-status-btn';
          toggleBtn.textContent = '✓ Read';
        } else {
          toggleBtn.className = 'btn btn-want toggle-status-btn';
          toggleBtn.textContent = '+ Want to Read';
        }
        showError("Could not update book status.");
      }
    });

    const removeBtn = card.querySelector('.remove-btn');
    removeBtn.addEventListener('click', async () => {
      if(confirm('Remove this book from your reading list?')) {
        try {
          await removeBookFromDb(book.olid);
          card.remove(); // Optimistic remove
          if (readingListGrid.children.length === 0) {
            readingListGrid.innerHTML = '<p class="empty-state">Your reading list is empty. Save some books to get started!</p>';
          }
        } catch (err) {
           console.error("Delete error:", err);
           showError("Could not remove the book.");
        }
      }
    });

    readingListGrid.appendChild(card);
  });
}
