
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyC5cHPPXv8nMIOTB2_I4VyrTvCAwcU4J7Q",
  authDomain: "ayaa-1b614.firebaseapp.com",
  projectId: "ayaa-1b614",
  storageBucket: "ayaa-1b614.firebasestorage.app",
  messagingSenderId: "823893711413",
  appId: "1:823893711413:web:a7e584e62d63a3891d6f7c",
  measurementId: "G-Q7NK1PVYLN"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const firebaseAuth = {
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      throw error;
    }
  },

  async signUp(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      throw error;
    }
  },
};
