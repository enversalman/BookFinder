// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXUZu6ycRAT2EWmY9LRRWbDn78cUXrzGQ",
  authDomain: "bookfinder-10be3.firebaseapp.com",
  projectId: "bookfinder-10be3",
  storageBucket: "bookfinder-10be3.firebasestorage.app",
  messagingSenderId: "728166909694",
  appId: "1:728166909694:web:601b679c8369bfa9bd87af"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper functions for the app

export async function saveBookToDb(bookData) {
  const bookRef = doc(db, "books", bookData.olid);
  const bookSnap = await getDoc(bookRef);

  if (!bookSnap.exists()) {
    await setDoc(bookRef, {
      ...bookData,
      status: "want_to_read",
      savedAt: new Date().toISOString()
    });
    return true; // Newly saved
  }
  return false; // Already exists
}

export async function fetchReadingList() {
  const booksCol = collection(db, "books");
  const bookSnapshot = await getDocs(booksCol);
  return bookSnapshot.docs.map(doc => doc.data());
}

export async function updateBookStatus(olid, newStatus) {
  const bookRef = doc(db, "books", olid);
  await updateDoc(bookRef, {
    status: newStatus
  });
}

export async function removeBookFromDb(olid) {
  const bookRef = doc(db, "books", olid);
  await deleteDoc(bookRef);
}
