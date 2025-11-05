import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qbmtujlatijhknacbxyt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFibXR1amxhdGlqaGtuYWNieHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzOTY5NDIsImV4cCI6MjA3Mzk3Mjk0Mn0.PVb7Gj4fLdDJJD28no8GPVBOugXgOPKawGS6_BBot8Y'; // <-- paste yours here

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);