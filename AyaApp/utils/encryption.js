import CryptoJS from "crypto-js";

const DEFAULT_SECRET = "67675856877";

const SECRET_KEY =
  (typeof process !== "undefined" && process.env && process.env.ENCRYPTION_KEY) ||
  (typeof global !== "undefined" && global.ENCRYPTION_KEY) ||
  DEFAULT_SECRET;

if (SECRET_KEY === DEFAULT_SECRET) {
  console.warn(
    "WARNING: Using default encryption key. Set ENCRYPTION_KEY in environment or secure storage for production."
  );
}

/**
 * Encrypt a value (string, number, object). Returns base64 ciphertext string.
 * @param {any} data
 * @returns {string|null}
 */
export const encryptData = (data) => {
  try {
    if (data === null || typeof data === "undefined") return null;
    const plaintext = typeof data === "object" ? JSON.stringify(data) : String(data);
    return CryptoJS.AES.encrypt(plaintext, SECRET_KEY).toString();
  } catch (err) {
    console.error("Encryption error:", err);
    return null;
  }
};

/**
 * Decrypt ciphertext produced by encryptData.
 * Returns original value (object if JSON was stored) or string, or null on failure.
 * @param {string} ciphertext
 * @returns {any|null}
 */
export const decryptData = (ciphertext) => {
  try {
    if (!ciphertext && ciphertext !== "") return null;
    const bytes = CryptoJS.AES.decrypt(String(ciphertext), SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted && decrypted !== "") return "";
    try {
      return JSON.parse(decrypted);
    } catch (e) {
      return decrypted;
    }
  } catch (err) {
    console.error("Decryption error:", err);
    return null;
  }
};

/**
 * Compute SHA-256 hash of plaintext (hex). Useful for searchable equality checks without storing plaintext.
 * Example: store { value_encrypted, value_hash } then query by hash.
 * @param {string} value
 * @returns {string}
 */
export const hashData = (value) => {
  try {
    const text = typeof value === "object" ? JSON.stringify(value) : String(value);
    return CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex);
  } catch (err) {
    console.error("Hashing error:", err);
    return null;
  }
};

export const encryptionSelfTest = (sample = "test") => {
  try {
    const ct = encryptData(sample);
    const pt = decryptData(ct);
    return pt === sample;
  } catch {
    return false;
  }
};