const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const twilio = require("twilio");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

const TRUSTED_NUMBERS = ["+27712233272"];

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const alerts = {};

app.post("/api/send-location", async (req, res) => {
  const { userId, timestamp, coords } = req.body;

  if (
    !coords ||
    typeof coords.latitude !== "number" ||
    typeof coords.longitude !== "number"
  ) {
    return res.status(400).json({ error: "Invalid coordinates" });
  }

  const formattedTime = new Date(timestamp).toLocaleString();
  const locationUrl = `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;

  const messageBody = 
`Hey, I just got an alert that ${userId || "someone"} might be in trouble. It looks like something serious happened around ${formattedTime}. Here’s where they were last located:
${locationUrl}

Please check on them as soon as you can. This could be an emergency. Thanks for helping out.`;

  try {
    const sendMessages = TRUSTED_NUMBERS.map((number) =>
      client.messages.create({
        body: messageBody,
        from: "whatsapp:+14155238886",
        to: `whatsapp:${number}`,
      })
    );

    await Promise.all(sendMessages);

    alerts[userId] = {
      timestamp,
      coords,
      status: "active",
    };

    res.json({ status: "WhatsApp messages sent successfully" });
  } catch (error) {
    console.error("Twilio error:", error);
    res.status(500).json({ error: "Failed to send WhatsApp message" });
  }
});

app.post("/api/webhook", (req, res) => {
  const from = req.body.From || "";
  const body = req.body.Body || "";

  console.log("Incoming message from:", from);
  console.log("Message body:", body);

  if (body.toLowerCase().includes("cancel")) {
    for (const userId in alerts) {
      if (alerts[userId].status === "active") {
        alerts[userId].status = "cancelled";
        console.log(`Alert for user ${userId} cancelled by ${from}`);
      }
    }
  }

  res.set("Content-Type", "text/xml");
  res.send(`<Response></Response>`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
