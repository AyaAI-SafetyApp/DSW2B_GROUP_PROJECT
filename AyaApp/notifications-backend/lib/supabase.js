// lib/supabase.js
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Resolve notifications-backend/.env relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set values in notifications-backend/.env"
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});