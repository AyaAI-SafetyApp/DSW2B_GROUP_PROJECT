// lib/scheduler.js
import cron from "node-cron";
import { supabase } from "./supabase.js";
import { sendExpoPushNotifications } from "./expoPush.js";

/**
 * Pick the appropriate tip for the current hour
 */
function pickTipForHour(tips, hour) {
  if (!Array.isArray(tips) || tips.length === 0) return null;
  const exact = tips.find(
    (t) => Number(t.hour_start) <= hour && hour < Number(t.hour_end)
  );
  return exact || tips[0] || null;
}

/**
 * Send time-based safety tip notification to all registered users
 */
async function sendTimeTipNotification() {
  try {
    console.log(`[${new Date().toISOString()}] Running scheduled time-tip notification...`);

    // 1. Fetch all time-based safety tips
    const { data: tips, error: tipsErr } = await supabase
      .from("time_based_safety_tips")
      .select("*")
      .order("hour_start", { ascending: true });

    if (tipsErr || !tips || tips.length === 0) {
      console.warn("No tips available:", tipsErr);
      return;
    }

    // 2. Get current hour and select appropriate tip
    const hour = new Date().getHours();
    const selected = pickTipForHour(tips, hour);
    
    if (!selected) {
      console.warn(`No tip found for hour ${hour}`);
      return;
    }

    console.log(`Selected tip for hour ${hour}: ${selected.time_range}`);

    // 3. Fetch all registered push tokens
    const { data: tokenRows, error: tokenErr } = await supabase
      .from("user_push_tokens")
      .select("token,user_id")
      .neq("token", null);

    if (tokenErr) {
      console.warn("Failed fetching tokens:", tokenErr);
      return;
    }

    const tokens = Array.isArray(tokenRows) ? tokenRows : [];
    
    if (tokens.length === 0) {
      console.log("No registered tokens to notify");
      return;
    }

    console.log(`Found ${tokens.length} tokens to notify`);

    // 4. Prepare notification messages
    const messageBody = `${selected.awareness}: ${selected.tip}`;
    const messages = tokens.map((r) => ({
      to: r.token,
      title: "Safety Tip",
      body: messageBody,
      data: { 
        tip: selected,
        type: "time_based_safety_tip",
        timestamp: new Date().toISOString()
      },
    }));

    // 5. Send push notifications
    const sendResult = await sendExpoPushNotifications(messages);
    console.log(`Sent ${messages.length} notifications. Result:`, sendResult);

    // 6. Log the notification event
    try {
      const { error: logErr } = await supabase.from("notifications_log").insert([
        {
          tip_id: selected.id ?? null,
          time_range: selected.time_range ?? null,
          sent_at: new Date().toISOString(),
          recipients: messages.length,
        },
      ]);
      if (logErr) {
        console.warn("Log insert failed:", logErr);
      } else {
        console.log(`Logged notification to database`);
      }
    } catch (e) {
      console.warn("Log insert exception:", e);
    }

    console.log(`✅ Time-tip notification completed successfully`);
  } catch (err) {
    console.error("❌ Scheduler error:", err);
  }
}

/**
 * Initialize cron jobs for time-based notifications
 * Runs at the start of each time phase: 0:00, 6:00, 12:00, 18:00
 */
export function initializeScheduler() {
  console.log("🕐 Initializing notification scheduler...");

  // ============ TEST MODE: Send notification 1 minute from now ============
  const now = new Date();
  const testTime = new Date(now.getTime() + 60000); // 1 minute from now
  const testMinute = testTime.getMinutes();
  const testHour = testTime.getHours();
  
  console.log(`\n🧪 TEST MODE ACTIVATED`);
  console.log(`   Current time: ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
  console.log(`   Test notification will send at: ${testHour}:${String(testMinute).padStart(2, '0')}`);
  
  // Schedule test notification for 1 minute from now
  cron.schedule(`${testMinute} ${testHour} * * *`, () => {
    console.log("\n🧪 TEST NOTIFICATION (1 minute delay) - Sending safety tip");
    sendTimeTipNotification();
  }, {
    timezone: "Africa/Johannesburg"
  });
  // ========================================================================

  // Schedule for 00:00 (midnight)
  cron.schedule("0 0 * * *", () => {
    console.log("\n⏰ Midnight (00:00) - Sending night safety tip");
    sendTimeTipNotification();
  }, {
    timezone: "Africa/Johannesburg" // South Africa timezone
  });

  // Schedule for 06:00 (morning)
  cron.schedule("0 6 * * *", () => {
    console.log("\n⏰ Morning (06:00) - Sending morning safety tip");
    sendTimeTipNotification();
  }, {
    timezone: "Africa/Johannesburg"
  });

  // Schedule for 12:00 (afternoon)
  cron.schedule("0 12 * * *", () => {
    console.log("\n⏰ Afternoon (12:00) - Sending afternoon safety tip");
    sendTimeTipNotification();
  }, {
    timezone: "Africa/Johannesburg"
  });

  // Schedule for 18:00 (evening)
  cron.schedule("0 18 * * *", () => {
    console.log("\n⏰ Evening (18:00) - Sending evening safety tip");
    sendTimeTipNotification();
  }, {
    timezone: "Africa/Johannesburg"
  });

  console.log("\n✅ Scheduler initialized with test + 4 daily time phases:");
  console.log(`   - ${testHour}:${String(testMinute).padStart(2, '0')} (TEST - in 1 minute) 🧪`);
  console.log("   - 00:00 (Midnight)");
  console.log("   - 06:00 (Morning)");
  console.log("   - 12:00 (Afternoon)");
  console.log("   - 18:00 (Evening)");
  console.log("\n⏳ Waiting 1 minute for test notification...");
}

// Export for manual testing
export { sendTimeTipNotification };
