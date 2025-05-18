import { createClient } from "./supabase-client"

// Check if Supabase credentials are available
export const hasSupabaseEnvVars = () => {
  return true // We're now using hardcoded credentials
}

// Test Supabase connection with improved error handling
export const testSupabaseConnection = async () => {
  try {
    const supabase = createClient()

    // Use the ping function to test connection
    const { data, error } = await supabase.rpc("ping")

    if (error) {
      console.error("Supabase ping error:", error)

      // Try a simpler query as fallback
      const { data: tableData, error: tableError } = await supabase.from("clinicians").select("id").limit(1)

      if (tableError) {
        console.error("Supabase table query error:", tableError)
        return {
          success: false,
          error: tableError.message || "Database query failed",
        }
      }
    }

    return { success: true }
  } catch (error) {
    // Log the full error for debugging
    console.error("Supabase connection error:", error)

    // Extract a meaningful error message
    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === "string") {
      errorMessage = error
    } else if (error && typeof error === "object") {
      errorMessage = JSON.stringify(error)
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

// Save clinician data to Supabase
export const saveClinicianToSupabase = async (clinicianData) => {
  try {
    const supabase = createClient()

    // First check if we can connect
    const { success, error: connectionError } = await testSupabaseConnection()
    if (!success) {
      return { success: false, error: connectionError }
    }

    // Insert or update clinician data
    const { error } = await supabase.from("clinicians").upsert([clinicianData], { onConflict: "id" })

    if (error) {
      console.error("Error saving clinician data:", error)
      return {
        success: false,
        error: error.message || "Failed to save clinician data",
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in saveClinicianToSupabase:", error)

    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === "string") {
      errorMessage = error
    } else if (error && typeof error === "object") {
      errorMessage = JSON.stringify(error)
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

// Save rankings to Supabase
export const saveRankingsToSupabase = async (rankings, clinicianId) => {
  try {
    const supabase = createClient()

    // First check if we can connect
    const { success, error: connectionError } = await testSupabaseConnection()
    if (!success) {
      return { success: false, error: connectionError }
    }

    const timestamp = new Date().toISOString()

    // Format the data for submission
    const formattedRankings = Object.entries(rankings.rankings).map(([imageId, modelOrder]) => ({
      clinician_id: clinicianId,
      image_id: Number.parseInt(imageId),
      model_rankings: modelOrder,
      model_sequence: rankings.modelSequences[imageId] || modelOrder,
      submitted_at: timestamp,
    }))

    console.log("Saving rankings:", formattedRankings)

    // Insert rankings one by one to avoid potential issues
    for (const ranking of formattedRankings) {
      console.log("Inserting ranking:", ranking)

      const { error } = await supabase.from("rankings").upsert([ranking], { onConflict: "clinician_id,image_id" })

      if (error) {
        console.error("Error saving ranking:", error, ranking)
        return {
          success: false,
          error: error.message || "Failed to save rankings",
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in saveRankingsToSupabase:", error)

    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === "string") {
      errorMessage = error
    } else if (error && typeof error === "object") {
      errorMessage = JSON.stringify(error)
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
