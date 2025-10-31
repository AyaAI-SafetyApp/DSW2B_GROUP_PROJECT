const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// === Environment Variables ===
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// === 1️⃣ Check Database Connectivity ===
app.get("/api/test-db", async (req, res) => {
  try {
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/push_tokens?select=*`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    res.json({
      message: "✅ Connected to Supabase successfully!",
      sample: response.data,
    });
  } catch (error) {
    console.error("❌ DB connection failed:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to connect to Supabase",
      details: error.response?.data || error.message,
    });
  }
});

// === 2️⃣ Save Push Token ===
app.post("/api/save-push-token", async (req, res) => {
  try {
    const { token, userId, platform = "expo" } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Push token is required" });
    }

    console.log("✅ Received Expo push token:", token);

    const response = await axios.post(
      `${SUPABASE_URL}/rest/v1/push_tokens`,
      {
        token: token,
        platform: platform,
        user_id: userId || null,
      },
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
      }
    );

    console.log("✅ Token saved in Supabase:", response.data);
    res.status(200).json({ message: "Push token saved successfully", data: response.data });
  } catch (err) {
    console.error("❌ Error saving push token:", {
      message: err.message,
      response: err.response?.data,
    });

    if (err.response?.status === 409 || err.response?.data?.code === "23505") {
      return res.status(200).json({ message: "Token already exists" });
    }

    res.status(500).json({
      error: err.response?.data?.message || err.message,
      details: err.response?.data,
    });
  }
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
