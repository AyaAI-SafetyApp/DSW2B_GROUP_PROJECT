import AsyncStorage from "@react-native-async-storage/async-storage";

export const getSession = async () => {
  try {
    const data = await AsyncStorage.getItem("@user_session");
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Session fetch error:", err);
    return null;
  }
};

export const setSession = async (session) => {
  try {
    await AsyncStorage.setItem("@user_session", JSON.stringify(session));
  } catch (err) {
    console.error("Session save error:", err);
  }
};

export const clearSession = async () => {
  try {
    await AsyncStorage.removeItem("@user_session");
  } catch (err) {
    console.error("Session clear error:", err);
  }
};
