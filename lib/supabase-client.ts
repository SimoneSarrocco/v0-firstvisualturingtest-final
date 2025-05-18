import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

export const createClient = () => {
  // Don't create a client during SSR
  if (typeof window === "undefined") {
    throw new Error("Supabase client cannot be created during server-side rendering")
  }

  if (supabaseInstance) {
    return supabaseInstance
  }

  // Use the environment variables that are available in the Vercel project
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
    })
    throw new Error("Missing Supabase environment variables")
  }

  try {
    console.log("Creating Supabase client with URL:", supabaseUrl)
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey, {
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

// Test the Supabase connection
export const testSupabaseConnection = async () => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("clinicians").select("count(*)", { count: "exact", head: true })

    if (error) {
      console.error("Supabase connection test failed:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error testing Supabase connection:", error)
    return { success: false, error: error.message || "Unknown error" }
  }
}
