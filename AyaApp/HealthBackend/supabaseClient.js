import { createClient } from '@supabase/supabase-js';

// Replace with your project values or load from env in production
const SUPABASE_URL = 'https://qbmtujlatijhknacbxyt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGci...PVb7G...'; // use your anon key or env var

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;