const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors({ origin: "*" })); // allow all origins for testing
app.use(bodyParser.json());

// paypal sandbox credentials
const PAYPAL_CLIENT =
  "AdbWBuyZ4lFfgLA__ilCjdoGOcPOVn7UO6CvSfeXBnHO1aawqyB5YCYp0O1qJY-B5QqyksODsOi5QvFG";
const PAYPAL_SECRET =
  "EI6U2x4gRe5Xj7EeX8g-TQX1eAAvTBvA-7n_PhjuB7U1_dLwRG9dPTLodWk9KPp4FKPE4Gut_5rCqnIs";
const base = "https://api-m.sandbox.paypal.com";

// supebase client setup
const SUPABASE_URL = "https://mcjjabajtfodvmixklfj.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jamphYmFqdGZvZHZtaXhrbGZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NTg0MywiZXhwIjoyMDcyMDUxODQzfQ.NbVNBTcC3Cr9ili0EFa9o4IiMhdZRREKlthVJjMW0Xg";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// testing
app.get("/ping", (req, res) => {
  res.send("pong 🏓");
});

// generate paypal access token
async function generateAccessToken() {
  const response = await axios({
    url: `${base}/v1/oauth2/token`,
    method: "post",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    auth: { username: PAYPAL_CLIENT, password: PAYPAL_SECRET },
    data: "grant_type=client_credentials",
  });
  return response.data.access_token;
}

// create subscription
app.post("/create-subscription", async (req, res) => {
  try {
    const accessToken = await generateAccessToken();
    const { planId, userId } = req.body;

    const response = await axios.post(
      `${base}/v1/billing/subscriptions`,
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

    const approvalUrl = response.data.links.find(
      (link) => link.rel === "approve"
    ).href;

    // save all transaction details in Supabase
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

// webhook to handle paypal events
app.post("/webhook/paypal", async (req, res) => {
  try {
    const event = req.body;

    console.log("📩 Webhook event:", event.event_type);

    if (event.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
      await supabase
        .from("subscriptions")
        .update({ status: "ACTIVE" })
        .eq("paypal_subscription_id", event.resource.id);
    }

    if (event.event_type === "BILLING.SUBSCRIPTION.CANCELLED") {
      await supabase
        .from("subscriptions")
        .update({ status: "CANCELLED" })
        .eq("paypal_subscription_id", event.resource.id);
    }

    if (event.event_type === "BILLING.SUBSCRIPTION.EXPIRED") {
      await supabase
        .from("subscriptions")
        .update({ status: "EXPIRED" })
        .eq("paypal_subscription_id", event.resource.id);
    }

    if (event.event_type === "PAYMENT.SALE.COMPLETED") {
      console.log(
        "💰 Payment received for subscription:",
        event.resource.billing_agreement_id
      );
    }

    res.sendStatus(200); // acknowledge receipt
  } catch (error) {
    console.error("Webhook Error:", error.message);
    res.sendStatus(500);
  }
});

// notify user of successful subscription - optional
app.get("/success", (req, res) => {
  res.send("Subscription successful! You can close this window.");
});
app.listen(3000, () =>
  console.log("✅ Backend running on http://localhost:3000")
);
