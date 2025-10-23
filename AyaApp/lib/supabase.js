import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wpjjvoeulmdryrjbintp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwamp2b2V1bG1kcnlyamJpbnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzYyNzYsImV4cCI6MjA3NjcxMjI3Nn0.V9goGHsWBiNbmmzlMojBz3ggDzaB_fbK5QHeb7EDnNU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
