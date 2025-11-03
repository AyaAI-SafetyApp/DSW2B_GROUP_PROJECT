// Test notification flow manually
const axios = require("axios");

// Use the token from your app logs
const EXPO_PUSH_TOKEN = "ExponentPushToken[CwNtYqDQPrtwcCDPQuo2bQ]";

async function testSubscriptionNotification() {
  try {
    console.log("🧪 Testing subscription notification...");
    
    const response = await axios.post(
      "https://exp.host/--/api/v2/push/send",
      {
        to: EXPO_PUSH_TOKEN,
        sound: "default",
        title: "Subscription Activated! 🎉",
        body: "Your Personal plan is now active. Enjoy all premium features!",
        data: { 
          type: "subscription", 
          tier: "personal",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
      },
      {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Subscription notification sent!");
    console.log("📋 Response:", response.data);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

async function testEmergencyNotification() {
  try {
    console.log("🚨 Testing emergency notification...");
    
    const response = await axios.post(
      "https://exp.host/--/api/v2/push/send",
      {
        to: EXPO_PUSH_TOKEN,
        sound: "default",
        title: "🚨 Emergency Alert",
        body: "Fall detected! Emergency contacts have been notified.",
        data: { 
          type: "emergency", 
          alert_type: "fall_detection",
          timestamp: new Date().toISOString()
        },
        priority: "high",
      },
      {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Emergency notification sent!");
    console.log("📋 Response:", response.data);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

async function testLocationRiskNotification() {
  try {
    console.log("📍 Testing location risk notification...");
    
    const response = await axios.post(
      "https://exp.host/--/api/v2/push/send",
      {
        to: EXPO_PUSH_TOKEN,
        sound: "default",
        title: "High Crime Risk Alert",
        body: "You are currently in Hillbrow, Johannesburg. An area with 85% crime rate - High Risk area. Stay vigilant!",
        data: { 
          type: "location_risk",
          location: "Hillbrow, Johannesburg",
          riskLevel: "High Risk",
          dangerPercentage: 85,
          timestamp: new Date().toISOString()
        },
      },
      {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Location risk notification sent!");
    console.log("📋 Response:", response.data);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

// Run all tests
(async () => {
  console.log("🧪 Starting manual notification tests...\n");
  
  await testSubscriptionNotification();
  console.log("\n" + "=".repeat(50) + "\n");
  
  await testEmergencyNotification();
  console.log("\n" + "=".repeat(50) + "\n");
  
  await testLocationRiskNotification();
  
  console.log("\n✅ All manual tests completed!");
  console.log("📱 Check your phone for notifications!");
})();