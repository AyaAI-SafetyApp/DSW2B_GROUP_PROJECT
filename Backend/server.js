const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const twilio = require("twilio");
require("dotenv").config();
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const alerts = [];
const TRUSTED_NUMBERS = ["+27712233272"];

const users = [
  { userId: "user123", name: "Lethabo", contacts: ["+27712233272"] },
  { userId: "user456", name: "Thabo", contacts: ["+27719876543"] },
];

function getUser(userId) {
  return (
    users.find((u) => u.userId === userId) || {
      name: "Someone",
      contacts: TRUSTED_NUMBERS,
    }
  );
}

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

async function sendWhatsApp(userId, messageBody, contacts = TRUSTED_NUMBERS) {
  try {
    const sendMessages = contacts.map((number) =>
      client.messages.create({
        body: messageBody,
        from: "whatsapp:+14155238886",
        to: `whatsapp:${number}`,
      })
    );
    await Promise.all(sendMessages);
    console.log(`✅ WhatsApp alerts sent for ${userId}`);
    return true;
  } catch (err) {
    console.error("WhatsApp sending failed:", err.message);
    return false;
  }
}

async function makeSOSCall(userId, coords) {
  const user = getUser(userId);
  const locationUrl = `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;

  try {
    const response = await fetch("https://api.retell.ai/v1/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: user.contacts,
        system_prompt: `
You are Aya Emergency Assistant.
Call ${user.name}'s trusted contacts and say:
"${user.name} might be in danger. Last known location: ${locationUrl}. 
Please respond to help them immediately."
Speak clearly and calmly.
`,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Retell API failed: ${text}`);
    }

    console.log(`📞 Retell AI SOS call triggered for ${userId}`);
    return true;
  } catch (err) {
    console.error("Failed to make Retell AI SOS call:", err.message);
    return false;
  }
}

async function retryAlerts() {
  for (const alert of alerts) {
    if (alert.status === "pending" && alert.retries < 5) {
      const message = generateMessage(alert.userId, alert);
      const success = await sendWhatsApp(alert.userId, message, alert.contacts);
      if (success) alert.status = "active";
      else alert.retries++;
    }
  }
}

function generateMessage(userId, alert) {
  const user = getUser(userId);
  const time = new Date(alert.timestamp).toLocaleString();
  const locationUrl = `https://maps.google.com/?q=${alert.coords.latitude},${alert.coords.longitude}`;
  return `⚠️ Emergency Alert ⚠️

Hi there, this is an urgent message regarding ${user.name}.
They might be in trouble as of ${time}.
Last known location: ${locationUrl}

Please check on them immediately!`;
}

app.post("/api/send-location", async (req, res) => {
  const { userId, timestamp, coords } = req.body;
  if (
    !coords ||
    typeof coords.latitude !== "number" ||
    typeof coords.longitude !== "number"
  ) {
    return res.status(400).json({ error: "Invalid coordinates" });
  }

  const user = getUser(userId);
  const messageBody = generateMessage(userId, { timestamp, coords });
  const success = await sendWhatsApp(userId, messageBody, user.contacts);

  alerts.push({
    userId,
    timestamp,
    coords,
    status: success ? "active" : "pending",
    retries: success ? 0 : 1,
    contacts: user.contacts,
  });

  // Trigger Retell AI call automatically
  makeSOSCall(userId, coords);

  res.json({
    status: success
      ? "WhatsApp sent + Retell AI call triggered"
      : "Queued for retry",
    coords,
    contacts: user.contacts,
  });
});

app.post("/api/webhook", (req, res) => {
  const from = req.body.From || "";
  const body = req.body.Body || "";
  console.log(`📩 Incoming message from ${from}: ${body}`);

  if (body.toLowerCase().includes("cancel")) {
    for (const alert of alerts) {
      if (alert.status === "active") {
        alert.status = "cancelled";
        console.log(`❌ Alert for user ${alert.userId} cancelled by ${from}`);
      }
    }
  }

  res.set("Content-Type", "text/xml");
  res.send(`<Response></Response>`);
});

app.get("/api/alerts", (req, res) => {
  res.json(alerts);
});

setInterval(retryAlerts, 60 * 1000);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
