// backend/server.js

// Import dependencies
const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

// Load environment variables from .env
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Port and API key
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Aya system prompt – instructs AI how to respond
const SYSTEM_PROMPT = `
You are Aya, an advanced Emergency Responder chatbot developed by The Sabios team.
Your role is to provide immediate, actionable help to users during any emergency.
Do NOT refer users to external services. Instead, guide the user directly on what to do step by step.
You must always try to help the user NOW, using any available advice, safety actions, or self-administered care.

Return JSON ONLY with the following keys:
- triage: category of emergency (critical, moderate, minor, unknown)
- instructions: array of short, actionable steps the user can perform immediately
- confidence: number between 0 and 1 indicating your confidence in the instructions
- escalate: true/false if the situation is life-threatening or requires professional help
- escalate_reason: short reason why escalation is needed

Guidelines:
- Make instructions clear, practical, and concise.
- Format each instruction as a bullet with a bold title (e.g., "*Step 1:* Check responsiveness").
- Focus on what the user can do immediately.
- Include first-aid, safety, or emergency procedures whenever applicable.
- Assume the user has no professional medical knowledge.
- Always prioritize saving life, reducing harm, or stabilizing the situation until professional help arrives.
`;

// Test endpoint to verify backend is running
app.get("/", (req, res) => {
  res.send("🚨 Aya Emergency backend running...");
});

// Main chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message, location, user_profile } = req.body;

    // Combine user message with optional context
    const userContext = JSON.stringify({ message, location, user_profile });

    // Prepare AI request
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }, { text: userContext }],
        },
      ],
    };

    // Call Gemini API
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
      }
    );

    // Extract AI response text
    let rawText =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean formatting if AI wraps JSON in json
    rawText = rawText
      .replace(/json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      // Parse JSON from AI response
      parsed = JSON.parse(rawText);

      // Format instructions as bullet-style with bolded step titles
      parsed.instructions = parsed.instructions.map((step, index) => {
        return **Step ${index + 1}:** ${step.trim().replace(/\n+/g, " ")};
      });
    } catch (e) {
      // Default fallback if AI fails to return valid JSON
      parsed = {
        triage: "unknown",
        instructions: [
          "*Attention:* Aya could not understand the situation clearly. Ensure safety and seek help immediately.",
        ],
        confidence: 0.3,
        escalate: true,
        escalate_reason:
          "AI response could not be parsed, treat as urgent emergency.",
      };
    }

    // Return structured response
    res.json({ ok: true, incident: parsed });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ ok: false, error: "Something went wrong" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(🚀 Aya Emergency backend running on http://localhost:${PORT});
});