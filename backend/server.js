const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

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
                    return_url: "http://localhost:3000/success",
                    cancel_url: "http://localhost:3000/cancel",
                },
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const approvalUrl = response.data.links.find((link) => link.rel === "approve").href;

        // Save all transaction details in Supabase
        await supabase.from("subscriptions").insert([
            {
                user_id: userId,
                plan_id: planId,
                paypal_subscription_id: response.data.id,
                status: "PENDING",
            },
        ]);

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