require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // <-- updated package name
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // Use a suitable Gemini model
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, user_message TEXT, ai_response TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)');
});

app.post('/chat', async (req, res) => {
  const { message } = req.body;
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
    db.run('INSERT INTO conversations (user_message, ai_response) VALUES (?, ?)', [message, aiReply]);
    res.json({ reply: aiReply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/summary', async (req, res) => {
  db.all('SELECT user_message, ai_response FROM conversations ORDER BY timestamp DESC LIMIT 10', async (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    const conversationText = rows.map(row => `User: ${row.user_message}\nAI: ${row.ai_response}`).join('\n');
    try {
      const result = await model.generateContent({
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
      });
      res.json({ summary: result.response.text() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate summary' });
    }
  });
});

app.get('/feedback', async (req, res) => {
  db.all('SELECT user_message, ai_response FROM conversations ORDER BY timestamp DESC LIMIT 10', async (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    const conversationText = rows.map(row => `User: ${row.user_message}\nAI: ${row.ai_response}`).join('\n');
    try {
      const result = await model.generateContent({
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
      });
      res.json({ feedback: result.response.text() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate feedback' });
    }
  });
});

app.listen(3000, () => console.log('Server running on port 3000'));