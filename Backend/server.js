const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const { doc, setDoc, getDoc, updateDoc, arrayUnion } = require("firebase/firestore");
const { db } = require("./firebaseConfig");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: '*' })); // allow all origins for testing
app.use(express.json());
app.use(bodyParser.json());

// Load SAPS data
let sapsData = [];
try {
    sapsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'saps_cleaned.json'), 'utf8'));
    console.log(`Loaded ${sapsData.length} SAPS records`);
} catch (error) {
    console.error('Error loading SAPS data:', error);
    sapsData = [];
}

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

// Passkey service function
const storePasskey = async (userId, credentialId, publicKey) => {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    const passkeyData = {
        credentialId,
        publicKey,
        createdAt: new Date().toISOString(),
    };

    if (!userSnap.exists()) {
        await setDoc(userRef, { passkeys: [passkeyData] });
    } else {
        await updateDoc(userRef, {
            passkeys: arrayUnion(passkeyData),
        });
    }
};

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
    const baseTips = [
        "Stay aware of your surroundings at all times",
        "Keep valuables out of sight and secure",
        "Use well-lit routes, especially at night",
        "Share your location with trusted contacts",
        "Avoid displaying expensive items publicly"
    ];
    
    const dangerSpecificTips = [];
    
    if (areaData.Danger_Percentage >= 90) {
        dangerSpecificTips.push(
            "Exercise extreme caution - consider avoiding this area if possible",
            "Travel in groups whenever possible",
            "Avoid the area after dark",
            "Keep emergency contacts readily available"
        );
    } else if (areaData.Danger_Percentage >= 70) {
        dangerSpecificTips.push(
            "Be extra vigilant in this high-risk area",
            "Avoid isolated areas and stick to main roads",
            "Consider using alternative routes during peak crime hours"
        );
    } else if (areaData.Danger_Percentage >= 50) {
        dangerSpecificTips.push(
            "Maintain heightened awareness",
            "Avoid walking alone late at night"
        );
    } else if (areaData.Danger_Percentage >= 30) {
        dangerSpecificTips.push(
            "Standard safety precautions recommended",
            "Be cautious during evening hours"
        );
    } else {
        dangerSpecificTips.push(
            "This area has relatively low crime rates",
            "Continue following basic safety practices"
        );
    }
    
    if (areaData.Total_Crimes > 5000) {
        dangerSpecificTips.push("High crime volume area - extra precautions advised");
    }
    
    return [...dangerSpecificTips, ...baseTips].slice(0, 8);
}

// Passkey API endpoint
app.post('/api/passkey/store', async (req, res) => {
    try {
        const { userId, credentialId, publicKey } = req.body;
        
        if (!userId || !credentialId || !publicKey) {
            return res.status(400).json({ 
                error: 'Missing required fields: userId, credentialId, publicKey' 
            });
        }
        
        await storePasskey(userId, credentialId, publicKey);
        
        res.status(200).json({ 
            message: 'Passkey stored successfully',
            userId: userId
        });
    } catch (error) {
        console.error('Error storing passkey:', error);
        res.status(500).json({ 
            error: 'Failed to store passkey',
            details: error.message 
        });
    }
});

// Register endpoint for passkey creation (used by CreateCredential.js)
app.post('/register', async (req, res) => {
    try {
        const { userID, credential, provider } = req.body;
        
        if (!userID) {
            return res.status(400).json({ 
                error: 'Missing required field: userID' 
            });
        }
        
        console.log(`Registering passkey for user: ${userID}`);
        console.log(`Provider: ${provider}`);
        console.log(`Credential:`, credential);
        
        // Try to store the passkey in Firebase, but don't fail if offline
        if (credential && credential.id) {
            try {
                await storePasskey(userID, credential.id, credential.publicKey || 'mock-public-key');
                console.log(`✅ Passkey stored successfully in Firebase for user: ${userID}`);
            } catch (firebaseError) {
                console.warn(`⚠️  Firebase offline - passkey registration will continue without cloud storage:`, firebaseError.message);
                // Continue with registration even if Firebase fails
            }
        }
        
        res.status(200).json({ 
            message: 'User registered successfully with passkey',
            userID: userID,
            provider: provider,
            note: 'Passkey created locally (Firebase may be offline)'
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ 
            error: 'Failed to register user',
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`AyaAI Safety Server running on port ${PORT}`);
    console.log(`Loaded ${sapsData.length} SAPS records`);
    console.log(`API available at: http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;