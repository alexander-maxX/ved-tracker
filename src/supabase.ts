import { createClient } from "@supabase/supabase-js";

// Вставьте сюда URL и ключ из настроек вашего проекта Supabase
// (Settings -> API -> Project URL / anon public)
const supabaseUrl = "https://oumnnvbrhjlbixhxkwf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bW1ubnZicmhqbGJpeGh4a3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjM2NzQsImV4cCI6MjA5NDY5OTY3NH0.Pg2oMtvbumq4MEp1RYVOHJfjhQdQ8uuYn1OHtNIBuJ8";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseUrl.startsWith("http") && !supabaseUrl.includes("YOUR_")
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
