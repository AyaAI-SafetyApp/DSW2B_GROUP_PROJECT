const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `
You are an AI Interview Coach that helps users master interviews with personalized strategies.
Analyze the user's role, experience, and goals to create practical, data-driven preparation insights.

Return your response in JSON with:
{
  "strategy": "string",
  "questions": [{"question": "string", "model_answer": "string"}],
  "frameworks": ["string"],
  "feedback": ["string"],
  "tone": "string"
}
`;

app.get("/", (req, res) => {
  res.send("Interview Mastery AI backend running...");
});

app.post("/chat", async (req, res) => {
  try {
    const { message, user_profile, target_role } = req.body;
    const userContext = JSON.stringify({ message, user_profile, target_role });

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM_PROMPT}\n\nUser Input:\n${userContext}` }],
        },
      ],
    };

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
      }
    );

    let rawText =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    rawText = rawText.replace(/```(json)?/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      parsed = {
        strategy: "Unable to parse structured response. Try again.",
        questions: [],
        frameworks: [],
        feedback: ["Provide more role details for accurate suggestions."],
        tone: "Keep confident and calm delivery.",
      };
    }

    res.json({ ok: true, plan: parsed });
  } catch (error) {
    console.error("Gemini API Error:", error.response?.data || error.message);
    res.status(500).json({
      ok: false,
      error: error.response?.data?.error?.message || "Something went wrong",
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `Interview Mastery AI backend running on http://localhost:${PORT}`
  );
});
