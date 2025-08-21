// server.js
require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
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
    'CREATE TABLE IF NOT EXISTS conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, user_message TEXT, ai_response TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)'
  );
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Received ${req.method} request for ${req.url}`);
  next();
});

app.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required and must be a non-empty string' });
  }
  console.log(`[${new Date().toISOString()}] Processing chat message: ${message}`);
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048,
        responseMimeType: 'text/plain',
      },
    });
    const aiReply = result.response.text();
    db.run(
      'INSERT INTO conversations (user_message, ai_response) VALUES (?, ?)',
      [message, aiReply],
      (err) => {
        if (err) {
          console.error(`[${new Date().toISOString()}] Database insert error:`, err.message);
          return res.status(500).json({ error: 'Failed to save conversation' });
        }
        console.log(`[${new Date().toISOString()}] Chat response generated: ${aiReply}`);
        res.json({ reply: aiReply });
      }
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] AI generation error:`, error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/chat-audio', upload.single('audio'), async (req, res) => {
  const audioPath = req.file.path;
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ fileData: { mimeType: 'audio/m4a', fileUri: audioPath } }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048,
        responseMimeType: 'text/plain',
      },
    });
    const transcription = result.response.text();
    const replyResult = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: transcription }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048,
        responseMimeType: 'text/plain',
      },
    });
    const aiReply = replyResult.response.text();
    db.run('INSERT INTO conversations (user_message, ai_response) VALUES (?, ?)', [transcription, aiReply]);
    res.json({ transcription, reply: aiReply });
  } catch (error) {
    console.error('Audio processing error:', error.message);
    res.status(500).json({ error: 'Something went wrong with voice input' });
  }
});

app.get('/summary', (req, res) => {
  db.all('SELECT user_message, ai_response FROM conversations ORDER BY timestamp DESC LIMIT 10', (err, rows) => {
    if (err) {
      console.error(`[${new Date().toISOString()}] Database query error:`, err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (rows.length === 0) {
      console.log(`[${new Date().toISOString()}] No conversations available for summary`);
      return res.json({ summary: 'No conversations available to summarize.' });
    }
    const conversationText = rows.map(row => `User: ${row.user_message}\nAI: ${row.ai_response}`).join('\n');
    console.log(`[${new Date().toISOString()}] Generating summary for: ${conversationText.substring(0, 50)}...`);
    model.generateContent({
      contents: [
        {
          role: 'system',
          parts: [{ text: 'Summarize the key points of this conversation in a concise, empathetic manner.' }],
        },
        {
          role: 'user',
          parts: [{ text: conversationText }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048,
      },
    })
      .then(result => {
        const summary = result.response.text();
        console.log(`[${new Date().toISOString()}] Summary generated: ${summary}`);
        res.json({ summary });
      })
      .catch(error => {
        console.error(`[${new Date().toISOString()}] Summary generation error:`, error.message);
        res.status(500).json({ error: 'Failed to generate summary' });
      });
  });
});

app.get('/feedback', (req, res) => {
  db.all('SELECT user_message, ai_response FROM conversations ORDER BY timestamp DESC LIMIT 10', (err, rows) => {
    if (err) {
      console.error(`[${new Date().toISOString()}] Database query error:`, err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (rows.length === 0) {
      console.log(`[${new Date().toISOString()}] No conversations available for feedback`);
      return res.json({ feedback: 'No conversations available for feedback.' });
    }
    const conversationText = rows.map(row => `User: ${row.user_message}\nAI: ${row.ai_response}`).join('\n');
    console.log(`[${new Date().toISOString()}] Generating feedback for: ${conversationText.substring(0, 50)}...`);
    model.generateContent({
      contents: [
        {
          role: 'system',
          parts: [{ text: 'Provide concise, empathetic feedback notes for the user based on this conversation. Focus on validating feelings and suggesting next steps.' }],
        },
        {
          role: 'user',
          parts: [{ text: conversationText }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048,
      },
    })
      .then(result => {
        const feedback = result.response.text();
        console.log(`[${new Date().toISOString()}] Feedback generated: ${feedback}`);
        res.json({ feedback });
      })
      .catch(error => {
        console.error(`[${new Date().toISOString()}] Feedback generation error:`, error.message);
        res.status(500).json({ error: 'Failed to generate feedback' });
      });
  });
});

process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] Shutting down server...`);
  db.close((err) => {
    if (err) console.error(`[${new Date().toISOString()}] Error closing database:`, err.message);
    console.log(`[${new Date().toISOString()}] Database closed`);
    process.exit(0);
  });
});

app.listen(3000, '0.0.0.0', () => console.log(`[${new Date().toISOString()}] Server running on port 3000`));