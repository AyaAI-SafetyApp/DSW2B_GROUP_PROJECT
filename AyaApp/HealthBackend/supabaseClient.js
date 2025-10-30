import { createClient } from '@supabase/supabase-js';

// Replace with your project values or load from env in production
const SUPABASE_URL = 'https://gfrnxqhivmgfgdersflu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmcm54cWhpdm1nZmdkZXJzZmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDY2NjYsImV4cCI6MjA3NjYyMjY2Nn0._6i4zlwcGDfyYMH5vJQKP_n4LTboPNGegh8f8A8_GIM'; // use your anon key or env var

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;