const axios = require("axios");

// Your Railway backend URL
const RAILWAY_BASE_URL = "https://ayabackgroundservices-production.up.railway.app";

async function getStoredTokens() {
  try {
    console.log("📱 Getting stored tokens from Railway backend...");
    
    const response = await axios.get(`${RAILWAY_BASE_URL}/get-tokens`, {
      timeout: 10000
    });

    if (response.data && response.data.tokens) {
      console.log("✅ Found stored tokens:");
      response.data.tokens.forEach((tokenData, index) => {
        console.log(`${index + 1}. User: ${tokenData.userId} | Platform: ${tokenData.platform} | Token: ${tokenData.token.substring(0, 30)}...`);
      });
      return response.data.tokens;
    } else {
      console.log("❌ No tokens found in backend");
      return [];
    }
  } catch (error) {
    console.error("❌ Error getting tokens:", error.response?.data || error.message);
    return [];
  }
}

async function sendTestNotification(token, userId, testType = "manual") {
  try {
    console.log(`📤 Sending ${testType} notification to ${userId}...`);
    
    let title, body;
    switch (testType) {
      case "subscription":
        title = "Subscription Test! 🎉";
        body = "Your Personal plan is now active. Enjoy all premium features!";
        break;
      case "emergency":
        title = "Emergency Alert! 🚨";
        body = "Fall detected! Emergency contacts have been notified.";
        break;
      case "location":
        title = "Location Risk Alert";
        body = "You are in a high-crime area. Stay vigilant!";
        break;
      default:
        title = "Manual Test Notification";
        body = `Hello ${userId}! This is a manual test from the backend.`;
    }

    const response = await axios.post(
      "https://exp.host/--/api/v2/push/send",
      {
        to: token,
        sound: "default",
        title: title,
        body: body,
        data: { 
          type: testType,
          timestamp: new Date().toISOString(),
          userId: userId
        },
      },
      {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Notification sent successfully!");
    console.log("📋 Response:", response.data);
    return true;
  } catch (error) {
    console.error("❌ Error sending notification:", error.response?.data || error.message);
    return false;
  }
}

async function testAllStoredTokens(testType = "manual") {
  const tokens = await getStoredTokens();
  
  if (tokens.length === 0) {
    console.log("❌ No tokens to test. Make sure devices have registered first.");
    return;
  }

  console.log(`\n🧪 Testing ${testType} notifications for all stored tokens...\n`);
  
  for (let i = 0; i < tokens.length; i++) {
    const tokenData = tokens[i];
    console.log(`\n--- Testing token ${i + 1}/${tokens.length} ---`);
    console.log(`User: ${tokenData.userId}`);
    console.log(`Platform: ${tokenData.platform}`);
    
    await sendTestNotification(tokenData.token, tokenData.userId, testType);
    
    // Wait between notifications to avoid rate limiting
    if (i < tokens.length - 1) {
      console.log("⏳ Waiting 2 seconds before next notification...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function interactiveTest() {
  console.log("\n🎯 Interactive Notification Test");
  console.log("================================");
  
  const tokens = await getStoredTokens();
  
  if (tokens.length === 0) {
    console.log("❌ No tokens available for testing.");
    return;
  }

  // Test different notification types
  const testTypes = ["manual", "subscription", "emergency", "location"];
  
  for (const testType of testTypes) {
    console.log(`\n📢 Testing ${testType.toUpperCase()} notifications...`);
    await testAllStoredTokens(testType);
    console.log("⏳ Waiting 3 seconds before next test type...");
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

// Main execution
(async () => {
  try {
    console.log("🚀 Starting Manual Notification Test");
    console.log("====================================");
    
    // First, check if backend is accessible
    console.log("🏥 Testing backend connection...");
    try {
      await axios.get(`${RAILWAY_BASE_URL}/`, { timeout: 5000 });
      console.log("✅ Backend connection successful");
    } catch (error) {
      console.log("⚠️ Backend connection warning:", error.message);
    }
    
    await interactiveTest();
    
    console.log("\n✅ Manual notification test complete!");
    console.log("📱 Check your devices for notifications");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
})();