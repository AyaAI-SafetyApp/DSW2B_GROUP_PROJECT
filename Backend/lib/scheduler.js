// lib/scheduler.js
const cron = require('node-cron');
const { sendExpoPushNotifications } = require('./expoPush');

// Supabase will be injected from server.js
let supabase = null;

function setSupabase(supabaseClient) {
  supabase = supabaseClient;
}

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
    if (!supabase) {
      console.error('❌ Supabase client not initialized in scheduler');
      return;
    }

    console.log(`[${new Date().toISOString()}] Running scheduled time-tip notification...`);
    console.log('✓ Supabase client is available');

    // 1. Fetch all time-based safety tips
    console.log('Fetching tips from time_based_safety_tips table...');
    const { data: tips, error: tipsErr } = await supabase
      .from("time_based_safety_tips")
      .select("*")
      .order("hour_start", { ascending: true });

    if (tipsErr) {
      console.error("❌ Error fetching tips:", tipsErr);
      console.error("Error details:", {
        message: tipsErr.message,
        details: tipsErr.details,
        hint: tipsErr.hint,
        code: tipsErr.code
      });
      return;
    }

    if (!tips || tips.length === 0) {
      console.warn("⚠️  No tips found in database");
      return;
    }

    console.log(`✓ Found ${tips.length} tips in database`);

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
function initializeScheduler() {
  console.log("🕐 Initializing notification scheduler...");

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

  console.log("\n✅ Scheduler initialized with 4 daily time phases:");
  console.log("   - 00:00 (Midnight)");
  console.log("   - 06:00 (Morning)");
  console.log("   - 12:00 (Afternoon)");
  console.log("   - 18:00 (Evening)");
  console.log("   Timezone: Africa/Johannesburg");
}

module.exports = { 
  initializeScheduler, 
  sendTimeTipNotification,
  setSupabase,
  pickTipForHour
};
