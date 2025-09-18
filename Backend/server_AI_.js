require("dotenv").config();
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");

const upload = multer({ dest: "uploads/" });
const app = express();

app.use(express.json());
app.use(cors());

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is missing");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const db = new sqlite3.Database("conversations.db", (err) => {
  if (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  }
  console.log("SQLite connected");
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_message TEXT,
      ai_response TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Therapist System Prompt
const SYSTEM_PROMPT = `
You are Aya Therapist, a concise and empathetic virtual therapist for South African users. 
Respond in short sentences, listening attentively. Provide guidance, emotional support, and safety advice.
If user is in danger, advise contacting local emergency services:
- South Africa: 10111 (Police), 0800 12 13 14 (Domestic Violence Helpline), 0800 567 567 (Childline)
Always be calm, supportive, and concise.
`;

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ----------------- TEXT CHAT -----------------
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim())
    return res.status(400).json({ error: "Message required" });

  try {
    const aiResult = await model.generateContent({
      contents: [
        { role: "model", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "user", parts: [{ text: message }] },
      ],
      generationConfig: {
        temperature: 0.6,
        topP: 0.9,
        maxOutputTokens: 300,
        responseMimeType: "text/plain",
      },
    });

    const aiReply = aiResult.response.text();
    db.run(
      "INSERT INTO conversations (user_message, ai_response) VALUES (?, ?)",
      [message, aiReply]
    );
    res.json({ reply: aiReply });
  } catch (err) {
    console.error("AI chat error:", err.message);
    res.status(500).json({ error: "AI failed to respond" });
  }
});

// ----------------- AUDIO CHAT -----------------
app.post("/chat-audio", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Audio file required" });
  const audioPath = req.file.path;

  try {
    const transcriptionResult = await model.generateContent({
      contents: [
        { role: "model", parts: [{ text: SYSTEM_PROMPT }] },
        {
          role: "user",
          parts: [{ fileData: { mimeType: "audio/m4a", fileUri: audioPath } }],
        },
      ],
      generationConfig: {
        temperature: 0.6,
        topP: 0.9,
        maxOutputTokens: 300,
        responseMimeType: "text/plain",
      },
    });

    const transcription = transcriptionResult.response.text();

    const replyResult = await model.generateContent({
      contents: [
        { role: "model", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "user", parts: [{ text: transcription }] },
      ],
      generationConfig: {
        temperature: 0.6,
        topP: 0.9,
        maxOutputTokens: 300,
        responseMimeType: "text/plain",
      },
    });

    const aiReply = replyResult.response.text();

    db.run(
      "INSERT INTO conversations (user_message, ai_response) VALUES (?, ?)",
      [transcription, aiReply]
    );

    fs.unlink(audioPath, () => {});

    res.json({ transcription, reply: aiReply });
  } catch (err) {
    console.error("Audio processing error:", err.message);
    res.status(500).json({ error: "Failed to process audio" });
  }
});

// ----------------- CONVERSATION SUMMARY -----------------
app.get("/summary", async (req, res) => {
  db.all(
    "SELECT user_message, ai_response FROM conversations ORDER BY timestamp DESC LIMIT 20",
    async (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!rows.length) return res.json({ summary: "No recent conversations" });

      const convoText = rows
        .map((r) => `User: ${r.user_message}\nAI: ${r.ai_response}`)
        .join("\n");

      try {
        const summary = await model.generateContent({
          contents: [
            {
              role: "model",
              parts: [{ text: SYSTEM_PROMPT + "\nSummarize concisely:" }],
            },
            { role: "user", parts: [{ text: convoText }] },
          ],
          generationConfig: {
            temperature: 0.6,
            topP: 0.9,
            maxOutputTokens: 150,
          },
        });

        res.json({ summary: summary.response.text() });
      } catch (err) {
        res.status(500).json({ error: "Failed to generate summary" });
      }
    }
  );
});

// ----------------- FEEDBACK -----------------
app.get("/feedback", async (req, res) => {
  db.all(
    "SELECT user_message, ai_response FROM conversations ORDER BY timestamp DESC LIMIT 20",
    async (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (!rows.length)
        return res.json({ feedback: "No recent conversations" });

      const convoText = rows
        .map((r) => `User: ${r.user_message}\nAI: ${r.ai_response}`)
        .join("\n");

      try {
        const feedback = await model.generateContent({
          contents: [
            {
              role: "model",
              parts: [
                {
                  text:
                    SYSTEM_PROMPT + "\nProvide concise, empathetic feedback:",
                },
              ],
            },
            { role: "user", parts: [{ text: convoText }] },
          ],
          generationConfig: {
            temperature: 0.6,
            topP: 0.9,
            maxOutputTokens: 150,
          },
        });

        res.json({ feedback: feedback.response.text() });
      } catch (err) {
        res.status(500).json({ error: "Failed to generate feedback" });
      }
    }
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down...");
  db.close(() => process.exit(0));
});

app.listen(3000, "0.0.0.0", () =>
  console.log("Aya Therapist server running on port 3000")
);
