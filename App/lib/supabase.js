import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Supabase project configuration
const supabaseUrl = 'https://krcjtrepkmhxiayttjua.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyY2p0cmVwa21oeGlheXR0anVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNzcwMDQsImV4cCI6MjA2OTY1MzAwNH0.DoDlwqpcnEC558D1aBlOJVrEsl-BLoEvR-8rS7RlBNc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
