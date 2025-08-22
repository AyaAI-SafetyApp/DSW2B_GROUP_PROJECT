require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });
const app = express();

app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in .env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const db = new sqlite3.Database('conversations.db', (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_message TEXT,
      ai_response TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
});

const SYSTEM_PROMPT = `
You are AyaTherapist, a compassionate, trauma-informed virtual therapist for the Aya App. Your role is to provide empathetic, supportive, and safe guidance to users who may be experiencing stress, trauma, abuse, or other emotional difficulties. Always respond with understanding, patience, and encouragement.

Guidelines:
- Prioritize user safety and well-being. If the user is in immediate danger, calmly advise them to contact local emergency services or trusted authorities.
- Provide practical coping strategies, grounding exercises, self-care tips, and emotional support.
- Avoid judgment, criticism, or blaming the user. Maintain a calm, gentle, and encouraging tone.
- Respect boundaries and privacy. Never ask for unnecessary personal details.
- Encourage seeking professional help when needed, including therapists, hotlines, or support groups.
- Adapt your tone based on the user's emotional state: more comforting if distressed, more empowering if seeking guidance.

Example Phrases:
- "I hear you, and it’s completely understandable to feel this way."
- "You are not alone; there are ways to cope and heal from this."
- "It might help to take a few deep breaths and focus on one small step at a time."
- "If you feel unsafe, please reach out to [local support services] immediately."

Goal: Make the user feel supported, safe, and guided toward constructive actions for their mental and emotional well-being, without replacing professional help.
`;

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Received ${req.method} request for ${req.url}`);
  next();
});

// TEXT CHAT
app.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required and must be a non-empty string' });
  }
  try {
    const result = await model.generateContent({
      contents: [
        { role: 'model', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'user', parts: [{ text: message }] }
      ],
      generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 2048, responseMimeType: 'text/plain' }
    });
    const aiReply = result.response.text();
    db.run('INSERT INTO conversations (user_message, ai_response) VALUES (?, ?)', [message, aiReply]);
    res.json({ reply: aiReply });
  } catch (error) {
    console.error('AI generation error:', error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// AUDIO CHAT
app.post('/chat-audio', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Audio file is required' });
  const audioPath = req.file.path;
  try {
    const transcriptionResult = await model.generateContent({
      contents: [
        { role: 'model', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'user', parts: [{ fileData: { mimeType: 'audio/m4a', fileUri: audioPath } }] }
      ],
      generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 2048, responseMimeType: 'text/plain' }
    });

    const transcription = transcriptionResult.response.text();

    const replyResult = await model.generateContent({
      contents: [
        { role: 'model', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'user', parts: [{ text: transcription }] }
      ],
      generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 2048, responseMimeType: 'text/plain' }
    });

    const aiReply = replyResult.response.text();

    db.run('INSERT INTO conversations (user_message, ai_response) VALUES (?, ?)', [transcription, aiReply]);

    fs.unlink(audioPath, () => {});

    res.json({ transcription, reply: aiReply });
  } catch (error) {
    console.error('Audio processing error:', error.message);
    res.status(500).json({ error: 'Something went wrong with voice input' });
  }
});

// SUMMARY
app.get('/summary', async (req, res) => {
  db.all('SELECT user_message, ai_response FROM conversations ORDER BY timestamp DESC LIMIT 10', async (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (rows.length === 0) return res.json({ summary: 'No conversations available to summarize.' });

    const conversationText = rows.map(r => `User: ${r.user_message}\nAI: ${r.ai_response}`).join('\n');

    try {
      const summaryResult = await model.generateContent({
        contents: [
          { role: 'model', parts: [{ text: SYSTEM_PROMPT + '\nSummarize the key points of this conversation concisely and empathetically.' }] },
          { role: 'user', parts: [{ text: conversationText }] }
        ],
        generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 2048 }
      });
      res.json({ summary: summaryResult.response.text() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate summary' });
    }
  });
});

// FEEDBACK
app.get('/feedback', async (req, res) => {
  db.all('SELECT user_message, ai_response FROM conversations ORDER BY timestamp DESC LIMIT 10', async (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (rows.length === 0) return res.json({ feedback: 'No conversations available for feedback.' });

    const conversationText = rows.map(r => `User: ${r.user_message}\nAI: ${r.ai_response}`).join('\n');

    try {
      const feedbackResult = await model.generateContent({
        contents: [
          { role: 'model', parts: [{ text: SYSTEM_PROMPT + '\nProvide empathetic, constructive feedback to the user based on this conversation.' }] },
          { role: 'user', parts: [{ text: conversationText }] }
        ],
        generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 2048 }
      });
      res.json({ feedback: feedbackResult.response.text() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate feedback' });
    }
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  db.close(() => process.exit(0));
});

app.listen(3000, '0.0.0.0', () => console.log('Server running on port 3000'));
