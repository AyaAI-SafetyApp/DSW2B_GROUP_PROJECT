const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5cHPPXv8nMIOTB2_I4VyrTvCAwcU4J7Q",
  authDomain: "ayaa-1b614.firebaseapp.com",
  projectId: "ayaa-1b614",
  storageBucket: "ayaa-1b614.firebasestorage.app",
  messagingSenderId: "823893711413",
  appId: "1:823893711413:web:a7e584e62d63a3891d6f7c",
  measurementId: "G-Q7NK1PVYLN",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

module.exports = { db };