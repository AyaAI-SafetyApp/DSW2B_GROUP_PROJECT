// routes/notify.js
import express from "express";
import { supabase } from "../lib/supabase.js";
import { sendExpoPushNotifications } from "../lib/expoPush.js";

const router = express.Router();

function pickTipForHour(tips, hour) {
  if (!Array.isArray(tips) || tips.length === 0) return null;
  const exact = tips.find((t) => Number(t.hour_start) <= hour && hour < Number(t.hour_end));
  return exact || tips[0] || null;
}

/**
 * POST /api/notify/time-tip
 * Body options:
 *  { token: 'ExponentPushToken[...]' }  // send to single token
 *  { suppressSendLog: true }            // skip logging
 */
router.post("/time-tip", async (req, res) => {
  try {
    const { data: tips, error: tipsErr } = await supabase
      .from("time_based_safety_tips")
      .select("*")
      .order("hour_start", { ascending: true });

    if (tipsErr) {
      console.warn("Failed fetching tips:", tipsErr);
      return res.status(500).json({ error: "Failed to fetch tips" });
    }
    if (!tips || tips.length === 0) {
      return res.status(400).json({ error: "No time-based tips available" });
    }

    const hour = new Date().getHours();
    const selected = pickTipForHour(tips, hour);
    if (!selected) return res.status(404).json({ error: "No tip for current hour" });

    const messageBody = `${selected.awareness}: ${selected.tip}`;

    const singleToken = req.body?.token;
    let tokens = [];

    if (singleToken) {
      tokens = [{ token: singleToken }];
    } else {
      const { data: tokenRows, error: tokenErr } = await supabase
        .from("user_push_tokens")
        .select("token,user_id")
        .neq("token", null);

      if (tokenErr) {
        console.warn("Failed fetching tokens:", tokenErr);
      } else {
        tokens = Array.isArray(tokenRows) ? tokenRows : [];
      }
    }

    if (tokens.length === 0) {
      return res.status(200).json({ ok: true, message: "No tokens to notify" });
    }

    const messages = tokens.map((r) => ({
      to: r.token || r,
      title: "Safety tip",
      body: messageBody,
      data: { tip: selected },
    }));

    const sendResult = await sendExpoPushNotifications(messages);

    if (!req.body?.suppressSendLog) {
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
        }
      } catch (e) {
        console.warn("Log insert exception:", e);
      }
    }

    return res.json({ ok: true, sentTo: messages.length, result: sendResult });
  } catch (err) {
    console.error("Notify error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/notify/test
 * Manually trigger a time-tip notification for testing
 */
router.post("/test", async (req, res) => {
  try {
    const { data: tips, error: tipsErr } = await supabase
      .from("time_based_safety_tips")
      .select("*")
      .order("hour_start", { ascending: true });

    if (tipsErr) {
      console.warn("Failed fetching tips:", tipsErr);
      return res.status(500).json({ error: "Failed to fetch tips" });
    }
    if (!tips || tips.length === 0) {
      return res.status(400).json({ error: "No time-based tips available" });
    }

    const hour = new Date().getHours();
    const selected = pickTipForHour(tips, hour);
    if (!selected) return res.status(404).json({ error: "No tip for current hour" });

    const messageBody = `${selected.awareness}: ${selected.tip}`;

    const { data: tokenRows, error: tokenErr } = await supabase
      .from("user_push_tokens")
      .select("token,user_id")
      .neq("token", null);

    if (tokenErr) {
      console.warn("Failed fetching tokens:", tokenErr);
      return res.status(500).json({ error: "Failed to fetch tokens" });
    }

    const tokens = Array.isArray(tokenRows) ? tokenRows : [];

    if (tokens.length === 0) {
      return res.status(200).json({ ok: true, message: "No tokens to notify" });
    }

    const messages = tokens.map((r) => ({
      to: r.token,
      title: "Safety Tip (Test)",
      body: messageBody,
      data: { tip: selected, test: true },
    }));

    const sendResult = await sendExpoPushNotifications(messages);

    return res.json({ 
      ok: true, 
      sentTo: messages.length, 
      result: sendResult,
      tip: selected,
      currentHour: hour
    });
  } catch (err) {
    console.error("Test notify error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;