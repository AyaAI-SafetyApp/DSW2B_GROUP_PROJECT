const axios = require("axios");

const expoPushToken = "ExponentPushToken[CwNtYqDQPrtwcCDPQuo2bQ]";

async function sendPushNotification(token, title, body, data = {}) {
  try {
    console.log("📤 Sending push notification...");
    console.log("🎯 Token:", token);
    console.log("📝 Title:", title);
    console.log("💬 Body:", body);
    
    const response = await axios.post(
      "https://exp.host/--/api/v2/push/send",
      {
        to: token,
        sound: "default",
        title: title,
        body: body,
        data: data,
        priority: "high",
        channelId: "default",
      },
      {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Push notification sent successfully!");
    console.log("📊 Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error sending push notification:");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Message:", error.message);
    return null;
  }
}


async function runTests() {
  console.log("🧪 Starting manual push notification tests...\n");

  console.log("=== Test 1: Basic Notification ===");
  await sendPushNotification(
    expoPushToken, 
    "Hello from Backend!", 
    "This is a manual test notification from the backend server! 👋"
  );

  await new Promise(resolve => setTimeout(resolve, 2000));


  console.log("\n=== Test 2: Subscription Notification ===");
  await sendPushNotification(
    expoPushToken, 
    "Subscription Activated! 🎉", 
    "Your Personal plan is now active. Enjoy all premium features!",
    { type: "subscription", tier: "personal" }
  );


  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log("\n=== Test 3: Safety Alert ===");
  await sendPushNotification(
    expoPushToken, 
    "Safety Alert! ⚠️", 
    "High crime area detected nearby. Stay vigilant and consider changing your route.",
    { type: "safety_alert", riskLevel: "high" }
  );

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log("\n=== Test 4: Emergency Notification ===");
  await sendPushNotification(
    expoPushToken, 
    "🚨 EMERGENCY ALERT", 
    "SOS signal detected! Emergency contacts have been notified of your location.",
    { type: "emergency", priority: "critical" }
  );

  console.log("\n✅ All tests completed! Check your phone for notifications.");
}

runTests();

