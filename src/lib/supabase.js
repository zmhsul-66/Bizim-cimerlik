import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Ehtiyatlı yoxlama: Əgər konfiqurasiya yoxdursa və ya hələ standart şablon dəyərlərindədirsə
const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== "https://your-project-id.supabase.co" && 
  supabaseAnonKey !== "your-anon-key-here" &&
  supabaseUrl.trim() !== "" &&
  supabaseAnonKey.trim() !== "";

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Konfiqurasiyanın olub-olmadığını tez yoxlamaq üçün köməkçi dəyişən
export const isDbReady = !!isConfigured;
