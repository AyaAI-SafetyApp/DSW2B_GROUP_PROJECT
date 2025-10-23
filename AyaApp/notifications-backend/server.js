// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import timeTipsRouter from "./routes/timeTips.js";
import notifyRouter from "./routes/notify.js";
import tokensRouter from "./routes/tokens.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/time-based-safety-tips", timeTipsRouter);
app.use("/api/notify", notifyRouter);
app.use("/api/token", tokensRouter);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

const port = process.env.PORT || 8888;
app.listen(port, () => {
  console.log(`Notifications backend listening on port ${port}`);
});