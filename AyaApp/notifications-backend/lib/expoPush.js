// lib/expoPush.js
import fetch from "node-fetch";

/**
 * Send push notifications via Expo Push API.
 * messages: array of { to, title, body, data }
 */
export async function sendExpoPushNotifications(messages = []) {
  if (!Array.isArray(messages) || messages.length === 0) return [];

  // Expo recommends batching up to 100 messages per request
  const batches = [];
  for (let i = 0; i < messages.length; i += 100) batches.push(messages.slice(i, i + 100));

  const responses = [];
  for (const batch of batches) {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });
    const json = await res.json().catch(() => ({ error: "invalid json" }));
    responses.push(json);
  }
  return responses;
}