import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Your Firebase config
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

// Initialize Firebase Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const firebaseAuth = {
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential;
    } catch (error) {
      throw error;
    }
  },

  async signUp(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential;
    } catch (error) {
      throw error;
    }
  },
};
