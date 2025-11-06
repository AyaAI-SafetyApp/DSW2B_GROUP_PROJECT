require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { Vonage } = require("@vonage/server-sdk");

const app = express();

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`⏰ ${timestamp}`);
    console.log(`🌐 ${req.method} ${req.url}`);
    console.log(`📍 From IP: ${req.ip}`);
    console.log(`📝 Headers:`, JSON.stringify(req.headers, null, 2));
    next();
});

app.use(cors());
app.use(express.json());

const vonage = new Vonage({
    applicationId: process.env.VONAGE_APPLICATION_ID,
    privateKey: fs.readFileSync(process.env.VONAGE_PRIVATE_KEY_PATH),
});

console.log("🔧 Vonage Configuration:");
console.log(`   Application ID: ${process.env.VONAGE_APPLICATION_ID}`);
console.log(`   Virtual Number: ${process.env.VONAGE_VIRTUAL_NUMBER}`);
console.log(`   Private Key: ${process.env.VONAGE_PRIVATE_KEY_PATH}`);

app.post("/call", async (req, res) => {
    console.log("\n📞 INCOMING CALL REQUEST");
    console.log("━".repeat(60));
    console.log("📋 Request Body:", JSON.stringify(req.body, null, 2));
    console.log("🔍 Request IP:", req.ip);
    console.log("🔍 Request Headers:", JSON.stringify(req.headers, null, 2));

    try {
        let { to } = req.body;

        if (!to) {
            console.error("❌ ERROR: No phone number provided in request");
            console.error("📋 Received body:", req.body);
            return res.status(400).json({ error: "Phone number is required" });
        }

        // Convert local SA number to E.164 if needed
        if (to.startsWith("0") && to.length === 10) {
            to = "+27" + to.slice(1);
        }

        const from = process.env.VONAGE_VIRTUAL_NUMBER;

        console.log(`\n📱 CALL DETAILS:`);
        console.log(`   From: ${from}`);
        console.log(`   To: ${to}`);

        const ncco = [
            {
                action: "talk",
                text: "Emergency SOS alert from Aya AI system. This is an automated emergency call. Natalie triggered an SOS alert less than a second ago inside Auckland Park Bunting Road Campus. I’ve shared more details via WhatsApp. Thank you.",
            },
        ];

        console.log(`📢 NCCO Message:`, JSON.stringify(ncco, null, 2));
        console.log(`\n🚀 Initiating Vonage API call...`);

        const response = await vonage.voice.createOutboundCall({
            to: [{ type: "phone", number: to }],
            from: { type: "phone", number: from },
            ncco,
        });

        console.log("✅ SUCCESS: Call initiated");
        console.log("📞 Vonage Response:", JSON.stringify(response, null, 2));
        console.log(`   Call UUID: ${response.uuid}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Direction: ${response.direction}`);

        res.json({
            success: true,
            message: "Call initiated successfully",
            callId: response.uuid,
            to,
            status: response.status
        });

        console.log("✅ Response sent to client");
        console.log("━".repeat(60));

    } catch (error) {
        console.error("\n❌ ERROR OCCURRED");
        console.error("━".repeat(60));
        console.error("Error Type:", error.constructor.name);
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);

        if (error.response) {
            console.error("API Response Error:", error.response);
        }

        res.status(500).json({
            success: false,
            error: error.message || "Failed to initiate call",
            details: error.toString()
        });

        console.error("❌ Error response sent to client");
        console.error("━".repeat(60));
    }
});

// Health check endpoint
app.get("/health", (req, res) => {
    console.log("💚 Health check from:", req.ip);
    res.json({
        status: "OK",
        message: "Aya Call Agent is running",
        timestamp: new Date().toISOString(),
        vonageConfigured: !!process.env.VONAGE_APPLICATION_ID
    });
});

// Test endpoint
app.get("/test", (req, res) => {
    console.log("🧪 Test endpoint accessed from:", req.ip);
    res.json({
        message: "Backend is reachable!",
        timestamp: new Date().toISOString()
    });
});

const PORT = 3000;
const HOST = '0.0.0.0';

console.log("\n" + "🚀".repeat(30));
console.log("Starting Aya Call Agent Server...");
console.log("🚀".repeat(30));

app.listen(PORT, HOST, () => {
    console.log("\n✅ SERVER STARTED SUCCESSFULLY!");
    console.log("━".repeat(60));
    console.log(`🌐 Server running on http://${HOST}:${PORT}`);
    console.log(`📱 Access from your device: http://10.250.228.96:${PORT}`);
    console.log(`💚 Health check: http://10.250.228.96:${PORT}/health`);
    console.log(`🧪 Test endpoint: http://10.250.228.96:${PORT}/test`);
    console.log(`📞 Call endpoint: http://10.250.228.96:${PORT}/call`);
    console.log("━".repeat(60));
    console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
});
