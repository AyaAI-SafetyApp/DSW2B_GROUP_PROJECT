// ...existing code...
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

/**
 * Replace these with your real Supabase values.
 * For local development you can use a .env and a library like react-native-dotenv
 * or set them via your build system / CI.
 */
const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://gfrnxqhivmgfgdersflu.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmcm54cWhpdm1nZmdkZXJzZmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDY2NjYsImV4cCI6MjA3NjYyMjY2Nn0._6i4zlwcGDfyYMH5vJQKP_n4LTboPNGegh8f8A8_GIM';

if (
  SUPABASE_URL.includes('your-project-ref') ||
  SUPABASE_ANON_KEY.includes('your-anon-key')
) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabaseClient] SUPABASE_URL or SUPABASE_ANON_KEY are using placeholders. Replace them with your project credentials.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // keep sessions persisted in React Native
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Convenience helpers
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('supabase getUser error', error);
      return null;
    }
    return data?.user ?? null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('getCurrentUser failed', e);
    return null;
  }
}

export default supabase;
// ...existing code...