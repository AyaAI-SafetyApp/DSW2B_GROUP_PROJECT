const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const passkeyService = require('./passkeyService');
const twilio = require("twilio");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require("multer");
const { initializeScheduler, sendTimeTipNotification, setSupabase, pickTipForHour } = require("./lib/scheduler");
const { sendExpoPushNotifications } = require("./lib/expoPush");

// Load environment variables
dotenv.config();

const upload = multer({ dest: "uploads/" });
const app = express();
const PORT = process.env.PORT || 3001;

// Gemini API setup for emergency chat
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Twilio setup for emergency alerts
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Initialize Google Generative AI for therapist chat
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const therapistModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Emergency alert system
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

// Middleware
app.use(cors({ origin: '*' })); // allow all origins for testing
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Emergency alert functions
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

// Load SAPS data
let sapsData = [];
try {
    sapsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'saps_cleaned.json'), 'utf8'));
    console.log(`Loaded ${sapsData.length} SAPS records`);
} catch (error) {
    console.error('Error loading SAPS data:', error);
    sapsData = [];
}

// Aya Emergency system prompt
const EMERGENCY_SYSTEM_PROMPT = `
You are Aya, an advanced Emergency Responder chatbot developed by The Sabios team.
Your role is to provide immediate, actionable help to users during any emergency.
Do NOT refer users to external services. Instead, guide the user directly on what to do step by step.
You must always try to help the user NOW, using any available advice, safety actions, or self-administered care.

Return JSON ONLY with the following keys:
- triage: category of emergency (critical, moderate, minor, unknown)
- instructions: array of short, actionable steps the user can perform immediately
- confidence: number between 0 and 1 indicating your confidence in the instructions
- escalate: true/false if the situation is life-threatening or requires professional help
- escalate_reason: short reason why escalation is needed

Guidelines:
- Make instructions clear, practical, and concise.
- Format each instruction as a bullet with a bold title (e.g., "*Step 1:* Check responsiveness").
- Focus on what the user can do immediately.
- Include first-aid, safety, or emergency procedures whenever applicable.
- Assume the user has no professional medical knowledge.
- Always prioritize saving life, reducing harm, or stabilizing the situation until professional help arrives.
`;

// Therapist System Prompt
const THERAPIST_SYSTEM_PROMPT = `
You are Aya Therapist, a concise and empathetic virtual therapist for South African users. 
Respond in short sentences, listening attentively. Provide guidance, emotional support, and safety advice.
If user is in danger, advise contacting local emergency services:
- South Africa: 10111 (Police), 0800 12 13 14 (Domestic Violence Helpline), 0800 567 567 (Childline)
Always be calm, supportive, and concise.
`;

// Calculate GPS distance
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 100) / 100; 
}

// PayPal sandbox credentials
const PAYPAL_CLIENT = "AdbWBuyZ4lFfgLA__ilCjdoGOcPOVn7UO6CvSfeXBnHO1aawqyB5YCYp0O1qJY-B5QqyksODsOi5QvFG";
const PAYPAL_SECRET = "EI6U2x4gRe5Xj7EeX8g-TQX1eAAvTBvA-7n_PhjuB7U1_dLwRG9dPTLodWk9KPp4FKPE4Gut_5rCqnIs";
const PAYPAL_BASE = "https://api-m.sandbox.paypal.com";

// Supabase client setup
const SUPABASE_URL = "https://mcjjabajtfodvmixklfj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jamphYmFqdGZvZHZtaXhrbGZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NTg0MywiZXhwIjoyMDcyMDUxODQzfQ.NbVNBTcC3Cr9ili0EFa9o4IiMhdZRREKlthVJjMW0Xg";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Notification Supabase client setup (separate project with notification tables)
const NOTIFICATION_SUPABASE_URL = "https://qbmtujlatijhknacbxyt.supabase.co";
const NOTIFICATION_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFibXR1amxhdGlqaGtuYWNieHl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM5Njk0MiwiZXhwIjoyMDczOTcyOTQyfQ.Z6yN39S0gNqWGEHWDnwGNonQAgk2rUNhM9E5CDypGZs";
const notificationSupabase = createClient(NOTIFICATION_SUPABASE_URL, NOTIFICATION_SUPABASE_KEY);

// Initialize scheduler with notification supabase client
setSupabase(notificationSupabase);

// Supabase Auth client setup (for user management)
const AUTH_SUPABASE_URL = "https://gfrnxqhivmgfgdersflu.supabase.co";
const AUTH_SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmcm54cWhpdm1nZmdkZXJzZmx1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA0NjY2NiwiZXhwIjoyMDc2NjIyNjY2fQ.4rYkTs5G3OLbqBbCxSzZ7pqTHe-AxsPvMqzIUw_rTm0";
const authSupabase = createClient(AUTH_SUPABASE_URL, AUTH_SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Generate PayPal access token
async function generateAccessToken() {
    const response = await axios({
        url: `${PAYPAL_BASE}/v1/oauth2/token`,
        method: "post",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        auth: { username: PAYPAL_CLIENT, password: PAYPAL_SECRET },
        data: "grant_type=client_credentials",
    });
    return response.data.access_token;
}

// Passkey service functions are now imported from passkeyService.js

// Routes

// Get safety status
app.get('/api/safety-status/:area', (req, res) => {
    try {
        const area = req.params.area || 'Johannesburg';
        console.log(`Looking for area: ${area}`);
        
        const areaData = sapsData.find(item => 
            (item.Station && item.Station.toLowerCase().includes(area.toLowerCase())) ||
            (item.Province && item.Province.toLowerCase().includes(area.toLowerCase())) ||
            (item.Display_Name && item.Display_Name.toLowerCase().includes(area.toLowerCase()))
        );
        
        if (!areaData) {
            console.log(`Area not found: ${area}`);
            return res.status(404).json({ error: `Area '${area}' not found` });
        }

        console.log(`Found data for: ${areaData.Station}, ${areaData.Province}`);

        const response = {
            Province: areaData.Province,
            Station: areaData.Station,
            Total_Crimes: areaData.Total_Crimes,
            Danger_Percentage: areaData.Danger_Percentage,
            Danger_Category: areaData.Danger_Category,
            Latitude: areaData.Latitude,
            Longitude: areaData.Longitude,
            Display_Name: areaData.Display_Name,
            safetyStatus: areaData.Danger_Percentage,
            riskLevel: getRiskLevel(areaData.Danger_Percentage),
            safetyTips: generateSafetyTips(areaData)
        };

        res.json(response);
    } catch (error) {
        console.error('Error in /api/safety-status/:area:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get GPS safety
app.get('/api/safety-status/location/:latitude/:longitude', (req, res) => {
    try {
        const userLat = parseFloat(req.params.latitude);
        const userLon = parseFloat(req.params.longitude);
        
        if (isNaN(userLat) || isNaN(userLon)) {
            return res.status(400).json({ error: 'Invalid coordinates' });
        }

        console.log(`Looking for location: ${userLat}, ${userLon}`);

        let closestStation = null;
        let minDistance = Infinity;

        sapsData.forEach(station => {
            if (station.Latitude && station.Longitude) {
                const distance = calculateDistance(userLat, userLon, station.Latitude, station.Longitude);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestStation = station;
                }
            }
        });

        if (!closestStation) {
            return res.status(404).json({ error: 'No nearby stations found' });
        }

        console.log(`Closest station: ${closestStation.Station} at ${minDistance}km`);

        const nearbyStations = sapsData
            .filter(station => {
                if (!station.Latitude || !station.Longitude) return false;
                const distance = calculateDistance(userLat, userLon, station.Latitude, station.Longitude);
                return distance <= 10 && station.Station !== closestStation.Station;
            })
            .map(station => ({
                name: station.Station,
                distance: calculateDistance(userLat, userLon, station.Latitude, station.Longitude),
                dangerLevel: station.Danger_Category,
                dangerPercentage: station.Danger_Percentage
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5);

        const response = {
            Province: closestStation.Province,
            Station: closestStation.Station,
            Total_Crimes: closestStation.Total_Crimes,
            Danger_Percentage: closestStation.Danger_Percentage,
            Danger_Category: closestStation.Danger_Category,
            Latitude: closestStation.Latitude,
            Longitude: closestStation.Longitude,
            Display_Name: closestStation.Display_Name,
            safetyStatus: closestStation.Danger_Percentage,
            riskLevel: getRiskLevel(closestStation.Danger_Percentage),
            safetyTips: generateSafetyTips(closestStation),
            closestStation: {
                name: closestStation.Station,
                distance: minDistance
            },
            statistics: {
                nearbyStations: nearbyStations
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error in /api/safety-status/location:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get news feed
app.get('/api/news-feed', (req, res) => {
    try {
        const news = [
            {
                id: "1",
                title: "New AI safety tools launched for South African communities",
                source: "News 24",
                time: "4h",
                priority: "medium",
                logoUri: "https://journalism.co.za/wp-content/uploads/2019/01/news24-300x300.png"
            },
            {
                id: "2",
                title: "Woman saved by AyaAI emergency alert system in Johannesburg",
                source: "Daily Sun",
                time: "30m",
                priority: "high",
                logoUri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3fhRGgdLERXOyD2nTXHErfs0RZgC86YMRsg&s"
            },
            {
                id: "3",
                title: "SAPS reports 15% decrease in crime rates in monitored areas",
                source: "SAPS Update",
                time: "1d",
                priority: "high",
                logoUri: "https://example.com/saps-logo.png"
            },
            {
                id: "4",
                title: "Weather alert: Heavy rains expected in Gauteng",
                source: "SA Weather Service",
                time: "2h",
                priority: "medium",
                logoUri: "https://example.com/weather-logo.png"
            },
            {
                id: "5",
                title: "Community safety initiative shows promising results",
                source: "Community Safety Forum",
                time: "6h",
                priority: "low",
                logoUri: "https://example.com/community-logo.png"
            }
        ];
        res.json(news);
    } catch (error) {
        console.error('Error in /api/news-feed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get emergency contacts
app.get('/api/emergency-contacts', (req, res) => {
    try {
        res.json({
            police: "10111",
            ambulance: "10177",
            emergency: "112",
            crimeStop: "08600 10111",
            genderBasedViolence: "0800 428 428",
            childLine: "116"
        });
    } catch (error) {
        console.error('Error in /api/emergency-contacts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get available areas
app.get('/api/areas', (req, res) => {
    try {
        const areas = sapsData.map(item => ({
            Station: item.Station,
            Province: item.Province,
            Danger_Category: item.Danger_Category,
            Danger_Percentage: item.Danger_Percentage
        })).sort((a, b) => a.Station.localeCompare(b.Station));

        res.json(areas);
    } catch (error) {
        console.error('Error in /api/areas:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        dataLoaded: sapsData.length > 0,
        recordCount: sapsData.length
    });
});

// Testing endpoint
app.get("/ping", (req, res) => {
    res.send("pong 🏓");
});

// Debug: Test Supabase connection
app.get("/api/debug/supabase", async (req, res) => {
    try {
        console.log('🔍 Testing Notification Supabase connection...');
        console.log('Notification Supabase URL:', NOTIFICATION_SUPABASE_URL);
        console.log('Notification Supabase Key (first 20 chars):', NOTIFICATION_SUPABASE_KEY.substring(0, 20) + '...');
        
        // Try to list tables or get a simple response
        const { data, error } = await notificationSupabase
            .from("time_based_safety_tips")
            .select("id, time_range, awareness")
            .limit(5);
        
        if (error) {
            console.error('❌ Notification Supabase connection failed:', error);
            return res.status(500).json({ 
                success: false, 
                error: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                supabaseUrl: NOTIFICATION_SUPABASE_URL
            });
        }
        
        console.log('✅ Notification Supabase connection successful');
        res.json({ 
            success: true, 
            message: 'Notification Supabase connection OK',
            rowsFound: data?.length || 0,
            sampleData: data,
            supabaseUrl: NOTIFICATION_SUPABASE_URL
        });
    } catch (err) {
        console.error('❌ Exception testing Notification Supabase:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message,
            stack: err.stack
        });
    }
});

// === NOTIFICATION ENDPOINTS ===

// GET /api/time-based-safety-tips - Get all time-based safety tips
app.get('/api/time-based-safety-tips', async (req, res) => {
    try {
        console.log('📡 Fetching time-based safety tips from Notification Supabase...');
        console.log('Notification Supabase URL:', NOTIFICATION_SUPABASE_URL);
        console.log('Table: time_based_safety_tips');
        
        const { data, error } = await notificationSupabase
            .from("time_based_safety_tips")
            .select("*")
            .order("hour_start", { ascending: true });

        if (error) {
            console.error("❌ Notification Supabase error:", error);
            console.error("Error details:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return res.status(500).json({ 
                error: error.message || "Supabase error",
                details: error.details,
                hint: error.hint
            });
        }
        
        console.log(`✓ Successfully fetched ${data?.length || 0} tips`);
        return res.json(Array.isArray(data) ? data : []);
    } catch (err) {
        console.error("❌ Server error:", err);
        return res.status(500).json({ error: "Server error", details: err.message });
    }
});

// POST /api/token - Register push notification token
app.post('/api/token', async (req, res) => {
    try {
        const { token, user_id = null, platform = null } = req.body || {};
        if (!token || typeof token !== "string") {
            return res.status(400).json({ error: "token required" });
        }

        const payload = {
            token,
            user_id,
            platform,
            created_at: new Date().toISOString(),
        };

        const { data, error } = await notificationSupabase
            .from("user_push_tokens")
            .upsert(payload, { onConflict: "token" })
            .select();

        if (error) {
            console.error("Upsert token error:", error);
            return res.status(500).json({ error: "Failed to save token" });
        }

        return res.json({ ok: true, saved: data?.length ? data[0] : payload });
    } catch (err) {
        console.error("Token route error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

// POST /api/notify/time-tip - Send time-based safety tip notification
app.post('/api/notify/time-tip', async (req, res) => {
    try {
        const { data: tips, error: tipsErr } = await notificationSupabase
            .from("time_based_safety_tips")
            .select("*")
            .order("hour_start", { ascending: true });

        if (tipsErr) {
            console.warn("Failed fetching tips:", tipsErr);
            return res.status(500).json({ error: "Failed to fetch tips" });
        }
        if (!tips || tips.length === 0) {
            return res.status(400).json({ error: "No time-based tips available" });
        }

        const hour = new Date().getHours();
        const selected = pickTipForHour(tips, hour);
        if (!selected) return res.status(404).json({ error: "No tip for current hour" });

        const messageBody = `${selected.awareness}: ${selected.tip}`;

        const singleToken = req.body?.token;
        let tokens = [];

        if (singleToken) {
            tokens = [{ token: singleToken }];
        } else {
            const { data: tokenRows, error: tokenErr } = await notificationSupabase
                .from("user_push_tokens")
                .select("token,user_id")
                .neq("token", null);

            if (tokenErr) {
                console.warn("Failed fetching tokens:", tokenErr);
            } else {
                tokens = Array.isArray(tokenRows) ? tokenRows : [];
            }
        }

        if (tokens.length === 0) {
            return res.status(200).json({ ok: true, message: "No tokens to notify" });
        }

        const messages = tokens.map((r) => ({
            to: r.token || r,
            title: "Safety tip",
            body: messageBody,
            data: { tip: selected },
        }));

        const sendResult = await sendExpoPushNotifications(messages);

        if (!req.body?.suppressSendLog) {
            try {
                const { error: logErr } = await notificationSupabase.from("notifications_log").insert([
                    {
                        tip_id: selected.id ?? null,
                        time_range: selected.time_range ?? null,
                        sent_at: new Date().toISOString(),
                        recipients: messages.length,
                    },
                ]);
                if (logErr) {
                    console.warn("Log insert failed:", logErr);
                }
            } catch (e) {
                console.warn("Log insert exception:", e);
            }
        }

        return res.json({ ok: true, sentTo: messages.length, result: sendResult });
    } catch (err) {
        console.error("Notify error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

// === EMERGENCY CHAT ENDPOINTS ===

// Emergency chat endpoint
app.post("/chat", async (req, res) => {
    try {
        const { message, location, user_profile } = req.body;

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ 
                ok: false, 
                error: "Gemini API key not configured" 
            });
        }

        // Combine user message with optional context
        const userContext = JSON.stringify({ message, location, user_profile });

        // Prepare AI request
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: EMERGENCY_SYSTEM_PROMPT }, { text: userContext }],
                },
            ],
        };

        // Call Gemini API
         const response = await axios.post(
         "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent",
         requestBody,
         {
           headers: {
             "Content-Type": "application/json",
             "x-goog-api-key": GEMINI_API_KEY,
           },
         }
       );
        // Extract AI response text
        let rawText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        console.log("Raw AI response:", rawText);

        // Clean formatting if AI wraps JSON in ```json blocks
        rawText = rawText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        console.log("Cleaned AI response:", rawText);

        let parsed;
        try {
            // Parse JSON from AI response
            parsed = JSON.parse(rawText);

            // Format instructions as bullet-style with bolded step titles
            if (parsed.instructions && Array.isArray(parsed.instructions)) {
                parsed.instructions = parsed.instructions.map((step, index) => {
                    // Convert to string if it's not already a string
                    const stepText = typeof step === 'string' ? step : JSON.stringify(step);
                    return `**Step ${index + 1}:** ${stepText.trim().replace(/\n+/g, " ")}`;
                });
            }
        } catch (e) {
            console.error("Failed to parse AI response:", e);
            console.error("Raw AI response:", rawText);
            // Default fallback if AI fails to return valid JSON
            parsed = {
                triage: "unknown",
                instructions: [
                    "**Attention:** Aya could not understand the situation clearly. Ensure safety and seek help immediately.",
                ],
                confidence: 0.3,
                escalate: true,
                escalate_reason: "AI response could not be parsed, treat as urgent emergency.",
            };
        }

        // Return structured response
        res.json({ ok: true, incident: parsed });
    } catch (error) {
        console.error("Emergency chat error:", error.response?.data || error.message);
        res.status(500).json({ 
            ok: false, 
            error: "Emergency chat service temporarily unavailable" 
        });
    }
});

// List available Gemini models (for debugging)
app.get("/models", async (req, res) => {
    try {
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ 
                ok: false, 
                error: "Gemini API key not configured" 
            });
        }

        const response = await axios.get(
            "https://generativelanguage.googleapis.com/v1/models",
            {
                headers: {
                    "x-goog-api-key": GEMINI_API_KEY,
                },
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ ok: false, error: "Failed to fetch models" });
    }
});

// === SOS & EMERGENCY ALERT ENDPOINTS ===

// Send location for emergency alerts
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

// Webhook for emergency responses
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

// Get all alerts
app.get("/api/alerts", (req, res) => {
    res.json(alerts);
});

// === THERAPIST CHAT ENDPOINTS ===

// Therapist text chat endpoint
app.post("/therapist/chat", async (req, res) => {
    const { message } = req.body;
    if (!message || !message.trim()) {
        return res.status(400).json({ error: "Message required" });
    }

    try {
        const aiResult = await therapistModel.generateContent({
            contents: [
                { role: "model", parts: [{ text: THERAPIST_SYSTEM_PROMPT }] },
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
        
        res.json({ reply: aiReply });
    } catch (err) {
        console.error("Therapist AI chat error:", err.message);
        res.status(500).json({ error: "Therapist AI failed to respond" });
    }
});

// Therapist audio chat endpoint
app.post("/therapist/chat-audio", upload.single("audio"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Audio file required" });
    }
    
    const audioPath = req.file.path;

    try {
        // Process audio file and get transcription + response
        const transcriptionResult = await therapistModel.generateContent({
            contents: [
                { role: "model", parts: [{ text: THERAPIST_SYSTEM_PROMPT }] },
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

        // Generate AI reply based on transcription
        const replyResult = await therapistModel.generateContent({
            contents: [
                { role: "model", parts: [{ text: THERAPIST_SYSTEM_PROMPT }] },
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

        // Clean up audio file
        fs.unlink(audioPath, (err) => {
            if (err) console.error("Failed to delete audio file:", err);
        });

        res.json({ transcription, reply: aiReply });
    } catch (err) {
        console.error("Therapist audio processing error:", err.message);
        res.status(500).json({ error: "Failed to process audio" });
    }
});

// Therapist conversation summary endpoint (disabled - no conversation storage)
app.get("/therapist/summary", async (req, res) => {
    res.json({ summary: "Conversation history not available - conversations are not stored" });
});

// Therapist feedback endpoint (disabled - no conversation storage)
app.get("/therapist/feedback", async (req, res) => {
    res.json({ feedback: "Conversation history not available - conversations are not stored" });
});

// === PAYPAL SUBSCRIPTION ENDPOINTS ===

// Create PayPal subscription
app.post("/create-subscription", async (req, res) => {
    try {
        const accessToken = await generateAccessToken();
        const { planId, userId } = req.body;

        const response = await axios.post(
            `${PAYPAL_BASE}/v1/billing/subscriptions`,
            {
                plan_id: planId,
                application_context: {
                    brand_name: "Aya App",
                    return_url: "http://localhost:3001/success",
                    cancel_url: "http://localhost:3001/cancel",
                },
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const approvalUrl = response.data.links.find((link) => link.rel === "approve").href;

        // Skip database recording for now - PayPal handles everything
        console.log(`✅ Subscription created: ${response.data.id} (Database recording skipped)`);
        console.log(`📝 Plan: ${planId}, User: ${userId}, Status: PENDING`);

        res.json({ approvalUrl });
    } catch (error) {
        console.error("Subscription Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to create subscription" });
    }
});

// Handle PayPal webhooks
app.post("/webhook/paypal", async (req, res) => {
    try {
        const event = req.body;
        console.log("📩 Webhook event:", event.event_type);

        if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
            await supabase.from("subscriptions")
                .update({ status: "ACTIVE" })
                .eq("paypal_subscription_id", event.resource.id);
        }
        if (event.event_type === "BILLING.SUBSCRIPTION.CANCELLED") {
            await supabase.from("subscriptions")
                .update({ status: "CANCELLED" })
                .eq("paypal_subscription_id", event.resource.id);
        }
        if (event.event_type === "BILLING.SUBSCRIPTION.EXPIRED") {
            await supabase.from("subscriptions")
                .update({ status: "EXPIRED" })
                .eq("paypal_subscription_id", event.resource.id);
        }
        if (event.event_type === "PAYMENT.SALE.COMPLETED") {
            console.log("💰 Payment received for subscription:", event.resource.billing_agreement_id);
        }
        res.sendStatus(200);
    } catch (error) {
        console.error("Webhook Error:", error.message);
        res.sendStatus(500);
    }
});

// Notify user of successful subscription (optional)
app.get("/success", (req, res) => {
    res.send("Subscription successful! You can close this window.");
});

// Create PayPal plans 
app.post("/create-paypal-plans", async (req, res) => {
    try {
        const accessToken = await generateAccessToken();
        
        // Define plans 
        const plansToCreate = [
            {
                name: "Personal Monthly Plan",
                description: "Individual safety with premium features and priority support",
                type: "INFINITE",
                payment_preferences: {
                    auto_bill_outstanding: true,
                    setup_fee: { currency_code: "USD", value: "0" },
                    setup_fee_failure_action: "CONTINUE",
                    payment_failure_threshold: 3
                },
                taxes: { percentage: "0", inclusive: false },
                billing_cycles: [{
                    frequency: { interval_unit: "MONTH", interval_count: 1 },
                    tenure_type: "REGULAR",
                    sequence: 1,
                    total_cycles: 0,
                    pricing_scheme: {
                        fixed_price: { currency_code: "USD", value: "350" }
                    }
                }],
                merchant_preferences: {
                    return_url: "http://localhost:3001/success",
                    cancel_url: "http://localhost:3001/cancel"
                }
            },
            {
                name: "Family Quarterly Plan", 
                description: "Complete family protection with shared alerts and group features",
                type: "INFINITE",
                payment_preferences: {
                    auto_bill_outstanding: true,
                    setup_fee: { currency_code: "USD", value: "0" },
                    setup_fee_failure_action: "CONTINUE", 
                    payment_failure_threshold: 3
                },
                taxes: { percentage: "0", inclusive: false },
                billing_cycles: [{
                    frequency: { interval_unit: "MONTH", interval_count: 3 },
                    tenure_type: "REGULAR",
                    sequence: 1,
                    total_cycles: 0,
                    pricing_scheme: {
                        fixed_price: { currency_code: "USD", value: "900" }
                    }
                }],
                merchant_preferences: {
                    return_url: "http://localhost:3001/success",
                    cancel_url: "http://localhost:3001/cancel"
                }
            },
            {
                name: "Personal Yearly Plan",
                description: "Annual plan with significant savings and premium features", 
                type: "INFINITE",
                payment_preferences: {
                    auto_bill_outstanding: true,
                    setup_fee: { currency_code: "USD", value: "0" },
                    setup_fee_failure_action: "CONTINUE",
                    payment_failure_threshold: 3
                },
                taxes: { percentage: "0", inclusive: false },
                billing_cycles: [{
                    frequency: { interval_unit: "YEAR", interval_count: 1 },
                    tenure_type: "REGULAR", 
                    sequence: 1,
                    total_cycles: 0,
                    pricing_scheme: {
                        fixed_price: { currency_code: "USD", value: "3500" }
                    }
                }],
                merchant_preferences: {
                    return_url: "http://localhost:3001/success",
                    cancel_url: "http://localhost:3001/cancel"
                }
            },
            {
                name: "Premium Yearly Plan",
                description: "Premium annual plan with maximum savings and premium support",
                type: "INFINITE", 
                payment_preferences: {
                    auto_bill_outstanding: true,
                    setup_fee: { currency_code: "USD", value: "0" },
                    setup_fee_failure_action: "CONTINUE",
                    payment_failure_threshold: 3
                },
                taxes: { percentage: "0", inclusive: false },
                billing_cycles: [{
                    frequency: { interval_unit: "YEAR", interval_count: 1 },
                    tenure_type: "REGULAR",
                    sequence: 1, 
                    total_cycles: 0,
                    pricing_scheme: {
                        fixed_price: { currency_code: "USD", value: "8000" }
                    }
                }],
                merchant_preferences: {
                    return_url: "http://localhost:3001/success",
                    cancel_url: "http://localhost:3001/cancel"
                }
            }
        ];

        const createdPlans = [];
        
        for (const planData of plansToCreate) {
            try {
                const response = await axios.post(
                    `${PAYPAL_BASE}/v1/billing/plans`,
                    planData,
                    { 
                        headers: { 
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        } 
                    }
                );
                
                createdPlans.push({
                    name: planData.name,
                    id: response.data.id,
                    price: planData.billing_cycles[0].pricing_scheme.fixed_price.value,
                    currency: planData.billing_cycles[0].pricing_scheme.fixed_price.currency_code
                });
                
                console.log(`✅ Created plan: ${planData.name} - ${response.data.id}`);
            } catch (planError) {
                console.error(`❌ Failed to create plan ${planData.name}:`, planError.response?.data || planError.message);
            }
        }

        res.json({ 
            message: "PayPal plans created successfully",
            plans: createdPlans 
        });
        
    } catch (error) {
        console.error("Plan Creation Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to create PayPal plans" });
    }
});

// CRUD Endpoints for Community Posts
app.post("/posts", async (req, res) => {
    const { title, content, author } = req.body;
    const { data, error } = await supabase
        .from("community_posts")
        .insert([{ title, content, author }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Get all posts
app.get("/posts", async (req, res) => {
    const { data, error } = await supabase.from("community_posts").select("*");
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Get posts from user
app.get("/posts/:id", async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return res.status(404).json({ error: error.message });
    res.json(data);
});

// Update post
app.put("/posts/:id", async (req, res) => {
    const { id } = req.params;
    const { title, content, author } = req.body;

    const { data, error } = await supabase
        .from("community_posts")
        .update({ title, content, author, updated_at: new Date() })
        .eq("id", id)
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Delete post
app.delete("/posts/:id", async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Post deleted successfully" });
});

// Delete user account
app.delete("/api/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        
        console.log(`🗑️ Attempting to delete user: ${userId}`);

        // Delete user from Supabase Auth
        const { data, error } = await authSupabase.auth.admin.deleteUser(userId);

        if (error) {
            console.error("❌ Error deleting user:", error);
            return res.status(400).json({ 
                success: false, 
                error: error.message 
            });
        }

        console.log("✅ User deleted successfully from Supabase");
        res.json({ 
            success: true, 
            message: "User account deleted successfully" 
        });

    } catch (error) {
        console.error("❌ Server error deleting user:", error);
        res.status(500).json({ 
            success: false, 
            error: "Failed to delete user account" 
        });
    }
});

// Helper functions
function getRiskLevel(dangerPercentage) {
    if (dangerPercentage >= 90) return 'EXTREME';
    if (dangerPercentage >= 70) return 'VERY HIGH';
    if (dangerPercentage >= 50) return 'HIGH';
    if (dangerPercentage >= 30) return 'MODERATE';
    return 'LOW';
}

// Generate safety tips
function generateSafetyTips(areaData) {
    // Get current hour for time-based tips
    const hour = new Date().getHours();
    
    // Time-based safety tip (first tip)
    let timeBasedTip = "";
    
    if (hour >= 0 && hour < 6) {
        // 00:00–06:00
        timeBasedTip = "Be aware: Break-ins, night theft.\nTip: Lock everything and avoid late-night movement.";
    } else if (hour >= 6 && hour < 12) {
        // 06:00–12:00
        timeBasedTip = "Be aware: Phone snatching, muggings.\nTip: Stay alert on commute; keep valuables hidden.";
    } else if (hour >= 12 && hour < 18) {
        // 12:00–18:00
        timeBasedTip = "Be aware: Burglaries, car theft.\nTip: Lock your home and car; don't leave items visible.";
    } else {
        // 18:00–24:00
        timeBasedTip = "Be aware: Hijackings, robberies.\nTip: Stay alert when driving; avoid dark, quiet areas.";
    }
    
    const baseTips = [
        "Stay aware of your surroundings at all times",
        "Keep valuables out of sight and secure",
        "Trust your instincts - if something feels wrong, it probably is",
        "Use well-lit routes and busy areas when possible",
        "Share your location with trusted contacts",
        "Keep emergency contacts readily accessible",
        "Avoid displaying expensive items publicly"
    ];

    // Return time-based tip first, then general base tips
    return [timeBasedTip, ...baseTips].slice(0, 6);
}

// Passkey API endpoints

// Register endpoint - Generate and store passkey
app.post('/register', async (req, res) => {
    try {
        const { userID, credential, provider } = req.body;
        
        if (!userID) {
            return res.status(400).json({ 
                error: 'Missing required field: userID' 
            });
        }

        // Generate a unique passkey
        const generatedPasskey = passkeyService.generatePasskey(userID);
        
        // Store the passkey in Supabase
        const storedPasskey = await passkeyService.storePasskey(
            userID,
            generatedPasskey.credentialId,
            generatedPasskey.rawId,
            provider || 'biometric'
        );
        
        res.status(200).json({ 
            message: 'Passkey registered successfully',
            userId: userID,
            credentialId: generatedPasskey.credentialId,
            passkey: storedPasskey
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            error: 'Failed to register passkey',
            details: error.message 
        });
    }
});

// Login verification endpoint
app.post('/login/verify', async (req, res) => {
    try {
        const { userID, assertion } = req.body;
        
        if (!userID || !assertion) {
            return res.status(400).json({ 
                error: 'Missing required fields: userID, assertion' 
            });
        }

        // Get user's passkeys
        const userPasskeys = await passkeyService.getUserPasskeys(userID);
        
        if (!userPasskeys || userPasskeys.length === 0) {
            return res.status(404).json({ 
                error: 'No passkeys found for this user' 
            });
        }

        // Verify the credential exists
        const credentialId = assertion.id;
        const isValid = await passkeyService.verifyPasskey(userID, credentialId);
        
        if (!isValid) {
            return res.status(401).json({ 
                error: 'Invalid passkey credential' 
            });
        }

        res.status(200).json({ 
            message: 'Login verified successfully',
            userId: userID,
            authenticated: true
        });
    } catch (error) {
        console.error('Login verification error:', error);
        res.status(500).json({ 
            error: 'Failed to verify login',
            details: error.message 
        });
    }
});

// Get user passkeys endpoint
app.get('/api/passkey/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const passkeys = await passkeyService.getUserPasskeys(userId);
        
        res.status(200).json({ 
            passkeys: passkeys,
            count: passkeys.length
        });
    } catch (error) {
        console.error('Get passkeys error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve passkeys',
            details: error.message 
        });
    }
});

// Account endpoint 
app.post('/account', async (req, res) => {
    try {
        const { userID, account } = req.body;
        
        if (!userID) {
            return res.status(400).json({ 
                error: 'Missing required field: userID' 
            });
        }
        
        console.log(`Account data received for user: ${userID}`);
        console.log('Account details:', account);
        
        // Here you could save to database (Supabase, Firebase, etc.)
        // For now, we'll just log and return success
        
        res.status(200).json({ 
            message: 'Account data saved successfully',
            userID: userID
        });
    } catch (error) {
        console.error('Error saving account data:', error);
        res.status(500).json({ 
            error: 'Failed to save account data',
            details: error.message 
        });
    }
});

// Login verify endpoint (used by GetAssertion.js)
app.post('/login/verify', async (req, res) => {
    try {
        const { userID, assertion } = req.body;
        
        if (!userID) {
            return res.status(400).json({ 
                error: 'Missing required field: userID' 
            });
        }
        
        console.log(`Login verification for user: ${userID}`);
        console.log('Assertion:', assertion);
        
        // Here you could verify the assertion against stored passkeys
        // For now, we'll just log and return success
        
        res.status(200).json({ 
            message: 'Login verified successfully',
            userID: userID,
            verified: true
        });
    } catch (error) {
        console.error('Error verifying login:', error);
        res.status(500).json({ 
            error: 'Failed to verify login',
            details: error.message 
        });
    }
});

// Handle subscription success
app.get("/success", async (req, res) => {
    try {
        const { subscription_id, ba_token, token } = req.query;
        console.log("Subscription success:", { subscription_id, ba_token, token });
        
        if (subscription_id) {
            // Skip database operations - PayPal manages the subscription
            console.log(`✅ Subscription ${subscription_id} is now ACTIVE (Database recording skipped)`);
            console.log(`🎉 PayPal is handling the subscription - payment successful!`);
        }
        
        res.send(`
            <html>
                <head><title>Subscription Successful</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px; background: #f8f9fa;">
                    <div style="max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h1 style="color: #de0973; margin-bottom: 20px;">🎉 Success!</h1>
                        <p style="color: #333; margin-bottom: 20px;">Your Aya app subscription has been activated successfully.</p>
                        <p style="color: #666; font-size: 14px;">You can close this window and return to the app.</p>
                    </div>
                </body>
            </html>
        `);
    } catch (error) {
        console.error("Success handler error:", error);
        res.status(500).send(`
            <html>
                <head><title>Error</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1 style="color: #e74c3c;">Error</h1>
                    <p>There was an issue processing your subscription. Please contact support.</p>
                </body>
            </html>
        `);
    }
});

// Handle subscription cancellation
app.get("/cancel", (req, res) => {
    console.log("Subscription cancelled by user");
    res.send(`
        <html>
            <head><title>Subscription Cancelled</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px; background: #f8f9fa;">
                <div style="max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #666; margin-bottom: 20px;">Subscription Cancelled</h1>
                    <p style="color: #333; margin-bottom: 20px;">You cancelled your subscription. No charges were made.</p>
                    <p style="color: #666; font-size: 14px;">You can try subscribing again anytime.</p>
                </div>
            </body>
        </html>
    `);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start retry alerts interval
setInterval(retryAlerts, 60 * 1000);

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`AyaAI Safety Server running on port ${PORT}`);
    console.log(`Loaded ${sapsData.length} SAPS records`);
    console.log(`API available at: http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Emergency alerts: WhatsApp + Retell AI enabled`);
    console.log(`Notification system: Initializing automated safety tips...`);
    
    // Initialize notification scheduler
    initializeScheduler();
});

module.exports = app;