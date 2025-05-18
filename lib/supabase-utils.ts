import { createClient } from "./supabase-client"

// Test Supabase connection
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

// Save clinician data to Supabase
export const saveClinicianToSupabase = async (clinicianData) => {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("clinicians").upsert([clinicianData], { onConflict: "id" })

    if (error) {
      console.error("Error saving clinician data:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in saveClinicianToSupabase:", error)
    return { success: false, error: error.message || "Unknown error" }
  }
}

// Save rankings to Supabase
export const saveRankingsToSupabase = async (rankings, clinicianId) => {
  try {
    const supabase = createClient()
    const timestamp = new Date().toISOString()

    // Format the data for submission
    const formattedRankings = Object.entries(rankings.rankings).map(([imageId, modelOrder]) => ({
      clinician_id: clinicianId,
      image_id: Number.parseInt(imageId),
      model_rankings: modelOrder,
      model_sequence: rankings.modelSequences[imageId] || modelOrder,
      submitted_at: timestamp,
    }))

    // Insert all rankings
    const { error } = await supabase.from("rankings").upsert(formattedRankings, { onConflict: "clinician_id,image_id" })

    if (error) {
      console.error("Error saving rankings:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in saveRankingsToSupabase:", error)
    return { success: false, error: error.message || "Unknown error" }
  }
}
