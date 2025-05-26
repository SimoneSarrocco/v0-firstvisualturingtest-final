import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

// Updated credentials
const SUPABASE_URL = "https://zhkliryjczvvebihksbu.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpoa2xpcnlqY3p2dmViaWhrc2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDgxNDEsImV4cCI6MjA2Mzc4NDE0MX0.HgsD3eSqEaJerblIfSA0Jt4QG3lvBNJT7kEFuUHBg4M"

export const createClient = () => {
  // Don't create a client during SSR
  if (typeof window === "undefined") {
    throw new Error("Supabase client cannot be created during server-side rendering")
  }

  if (supabaseInstance) {
    return supabaseInstance
  }

  try {
    console.log("Creating Supabase client with URL:", SUPABASE_URL)
    supabaseInstance = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false, // Don't persist auth state to avoid issues
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          "Content-Type": "application/json",
        },
      },
    })
    return supabaseInstance
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    throw new Error(`Failed to initialize Supabase client: ${error}`)
  }
}

// Check if Supabase credentials are available
export const hasSupabaseCredentials = () => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY)
}
