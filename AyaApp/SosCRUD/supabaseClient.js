import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';


const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://gfrnxqhivmgfgdersflu.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmcm54cWhpdm1nZmdkZXJzZmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDY2NjYsImV4cCI6MjA3NjYyMjY2Nn0._6i4zlwcGDfyYMH5vJQKP_n4LTboPNGegh8f8A8_GIM';

if (
  SUPABASE_URL.includes('your-project-ref') ||
  SUPABASE_ANON_KEY.includes('your-anon-key')
) {

  console.warn(
    '[supabaseClient] SUPABASE_URL or SUPABASE_ANON_KEY are using placeholders. Replace them with your project credentials.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: false,
  },
});


export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('supabase getUser error', error);
      return null;
    }
    return data?.user ?? null;
  } catch (e) {
    console.error('getCurrentUser failed', e);
    return null;
  }
}

export default supabase;
