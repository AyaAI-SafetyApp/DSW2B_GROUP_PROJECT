require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { Vonage } = require("@vonage/server-sdk");

const app = express();
app.use(cors());
app.use(express.json());

const vonage = new Vonage({
    applicationId: process.env.VONAGE_APPLICATION_ID,
    privateKey: fs.readFileSync(process.env.VONAGE_PRIVATE_KEY_PATH),
});

app.post("/call", async (req, res) => {
    try {
        const from = process.env.VONAGE_VIRTUAL_NUMBER;
        const to = process.env.TO_NUMBER;

        const ncco = [
            {
                action: "talk",
                text: "Hello, this is Aya AI system. Your verification call is successful.",
            },
        ];

        const response = await vonage.voice.createOutboundCall({
            to: [{ type: "phone", number: to }],
            from: { type: "phone", number: from },
            ncco,
        });

        res.json({ message: "Call initiated successfully", response });
    } catch (error) {
        console.error("Vonage error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log("Aya server running on port 3000"));
