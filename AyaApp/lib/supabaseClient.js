import { createClient } from "@supabase/supabase-js";

// Get these from your Supabase dashboard → Settings → API
const SUPABASE_URL = "https://mcjjabajtfodvmixklfj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jamphYmFqdGZvZHZtaXhrbGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzU4NDMsImV4cCI6MjA3MjA1MTg0M30.NmLpez9bbuQcZVuzpvUo86h_Xs_ERI6CMk3N121ZIDs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

