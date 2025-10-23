// routes/timeTips.js
import express from "express";
import { supabase } from "../lib/supabase.js";

const router = express.Router();

// GET /api/time-based-safety-tips
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("time_based_safety_tips")
      .select("*")
      .order("hour_start", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message || "Supabase error" });
    }
    return res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;