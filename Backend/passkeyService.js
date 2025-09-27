const { doc, setDoc, getDoc, updateDoc, arrayUnion } = require("firebase/firestore");
const { db } = require("../AyaApp/screens/Auth/firebaseConfig");

const storePasskey = async (userId, credentialId, publicKey) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  const passkeyData = {
    credentialId,
    publicKey,
    createdAt: new Date().toISOString(),
  };

  if (!userSnap.exists()) {
    await setDoc(userRef, { passkeys: [passkeyData] });
  } else {
    await updateDoc(userRef, {
      passkeys: arrayUnion(passkeyData),
    });
  }
};

module.exports = {
  storePasskey
};
