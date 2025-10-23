// routes/tokens.js
import express from "express";
import { supabase } from "../lib/supabase.js";

const router = express.Router();

/**
 * POST /api/token
 * Body: { token: string, user_id?: string, platform?: string }
 * Upserts a device push token into user_push_tokens table.
 */
router.post("/", async (req, res) => {
  try {
    const { token, user_id = null, platform = null } = req.body || {};
    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "token required" });
    }

    const payload = {
      token,
      user_id,
      platform,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("user_push_tokens")
      .upsert(payload, { onConflict: "token" })
      .select();

    if (error) {
      console.error("Upsert token error:", error);
      return res.status(500).json({ error: "Failed to save token" });
    }

    return res.json({ ok: true, saved: data?.length ? data[0] : payload });
  } catch (err) {
    console.error("Token route error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;