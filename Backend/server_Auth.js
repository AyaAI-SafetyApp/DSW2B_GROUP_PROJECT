const express = require("express");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("node:crypto");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(
  session({ secret: "demo-secret", resave: false, saveUninitialized: true })
);

const userDB = {}; // { userID: { credentials: [], account: {} } }

// --- Register Credential ---
app.post("/register", (req, res) => {
  const { userID, credential } = req.body;
  if (!userDB[userID]) userDB[userID] = { credentials: [], account: {} };

  const fakeID = crypto.randomBytes(8).toString("hex");
  userDB[userID].credentials.push({ credentialID: fakeID, ...credential });

  console.log(`User ${userID} registered with credential:`, fakeID);
  res.json({ verified: true });
});

// --- Fill Account Form ---
app.post("/account", (req, res) => {
  const { userID, account } = req.body;
  if (!userDB[userID]) return res.status(404).json({ error: "User not found" });
  userDB[userID].account = account;
  console.log(`User ${userID} account saved:`, account);
  res.json({ success: true });
});

// --- Login / Assertion ---
app.post("/login", (req, res) => {
  const { userID } = req.body;
  if (!userDB[userID]) return res.status(404).json({ error: "User not found" });

  // Generate fake challenge
  const challenge = crypto.randomBytes(16).toString("hex");
  req.session.challenge = challenge;
  res.json({ challenge });
});

app.post("/login/verify", (req, res) => {
  const { userID, assertion } = req.body;
  const user = userDB[userID];
  if (!user) return res.status(404).json({ error: "User not found" });

  console.log(`User ${userID} login attempt with credential:`, assertion.id);
  res.json({ verified: true }); // always true for demo
});

app.listen(3000, () => console.log("🚀 Demo server running on port 3000"));
