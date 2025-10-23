// lib/encryption.js
import CryptoJS from "crypto-js";

// Use a secure key from your environment (Expo supports EXPO_PUBLIC_* vars)
const SECRET_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || "YOUR_SECRET_KEY";

export const encryptData = (data) => {
  try {
    const ciphertext = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      SECRET_KEY
    ).toString();
    return ciphertext;
  } catch (error) {
    console.error("Encryption error:", error);
    return null;
  }
};

export const decryptData = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};
