// Supabase client is retained for legacy data queries (projects, stats, etc.).
// Authentication has been migrated to Firebase; do not use Supabase auth methods.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yhiffnqdltreiutqdysv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloaWZmbnFjbHRyZWl1dHFkeXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxODQ1MjAsImV4cCI6MjA4Nzc2MDUyMH0.kjFripuMGlpUlfEbLZdpC7nuslpWvWtvtsVKcb2ojB8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
