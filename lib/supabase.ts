import { createClient } from "@supabase/supabase-js"

// Updated credentials
const SUPABASE_URL = "https://foicozgezyjrbebpvbid.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaWNvemdlenlqcmJlYnB2YmlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MTE4ODMsImV4cCI6MjA2Mjk4Nzg4M30.TuI3sRRaRFfjDy8WpBdvkvwK-T_UeFviIKxpmHuF0ZA"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
