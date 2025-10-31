const axios = require("axios");

// Replace with your saved token
const expoPushToken = "ExponentPushToken[RBWZIjFtWZKOb6pH1cwA1l]";

async function sendPushNotification(token, title, body) {
  try {
    const response = await axios.post(
      "https://exp.host/--/api/v2/push/send",
      {
        to: token,
        sound: "default",
        title: title,
        body: body,
        data: { extra: "Some custom data" },
      },
      {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Push notification response:", response.data);
  } catch (error) {
    console.error("❌ Error sending push notification:", error.response?.data || error.message);
  }
}

// Test sending
sendPushNotification(expoPushToken, "Test Notification", "This is a test push from backend!. Emma saying hello, hello");

