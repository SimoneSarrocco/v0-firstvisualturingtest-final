import { createClient } from "./supabase-client"

// Check if Supabase environment variables are available
export const hasSupabaseEnvVars = (): boolean => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Test connection to Supabase
export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("clinicians").select("id").limit(1)

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
export const saveClinicianToSupabase = async (
  clinicianData: any,
): Promise<{ success: boolean; error?: string; id?: string }> => {
  try {
    const supabase = createClient()

    // Check if clinician already exists
    const { data: existingClinician, error: checkError } = await supabase
      .from("clinicians")
      .select("*")
      .eq("id", clinicianData.id)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Error checking for existing clinician:", checkError)
      return { success: false, error: checkError.message }
    }

    if (existingClinician) {
      // Update existing clinician
      const { error: updateError } = await supabase
        .from("clinicians")
        .update({
          name: clinicianData.name,
          institution: clinicianData.institution,
          experience: clinicianData.experience,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clinicianData.id)

      if (updateError) {
        console.error("Error updating clinician:", updateError)
        return { success: false, error: updateError.message }
      }

      return { success: true, id: clinicianData.id }
    } else {
      // Insert new clinician
      const { data, error: insertError } = await supabase.from("clinicians").insert([
        {
          id: clinicianData.id,
          name: clinicianData.name,
          institution: clinicianData.institution,
          experience: clinicianData.experience,
          created_at: clinicianData.created_at || new Date().toISOString(),
        },
      ])

      if (insertError) {
        console.error("Error inserting clinician:", insertError)
        return { success: false, error: insertError.message }
      }

      return { success: true, id: clinicianData.id }
    }
  } catch (error) {
    console.error("Error in saveClinicianToSupabase:", error)
    return { success: false, error: error.message || "Unknown error" }
  }
}

// Save rankings to Supabase
export const saveRankingsToSupabase = async (
  data: {
    rankings: Record<string, string[]>
    modelSequences: Record<string, string[]>
    testSequence: number[] // The actual test sequence
  },
  clinicianId: string,
  clinicianData?: {
    name: string
    institution: string
    experience: string
    created_at: string
  },
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = createClient()
    const now = new Date().toISOString()

    // First, ensure the clinician exists in the database
    if (clinicianData) {
      console.log("Saving clinician data to Supabase as part of test submission")

      // Check if clinician already exists
      const { data: existingClinician, error: checkError } = await supabase
        .from("clinicians")
        .select("*")
        .eq("id", clinicianId)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking for existing clinician:", checkError)
        // Continue anyway to try to save the rankings
      } else if (!existingClinician) {
        // Insert new clinician
        const { error: insertError } = await supabase.from("clinicians").insert([
          {
            id: clinicianId,
            name: clinicianData.name,
            institution: clinicianData.institution,
            experience: clinicianData.experience,
            created_at: clinicianData.created_at || now,
            submitted_test: true, // Mark as having submitted the test
          },
        ])

        if (insertError) {
          console.error("Error inserting clinician:", insertError)
          // Continue anyway to try to save the rankings
        }
      } else {
        // Update existing clinician to mark as having submitted the test
        const { error: updateError } = await supabase
          .from("clinicians")
          .update({
            name: clinicianData.name,
            institution: clinicianData.institution,
            experience: clinicianData.experience,
            updated_at: now,
            submitted_test: true, // Mark as having submitted the test
          })
          .eq("id", clinicianId)

        if (updateError) {
          console.error("Error updating clinician:", updateError)
          // Continue anyway to try to save the rankings
        }
      }
    }

    // Create a mapping of imageId to question number (1-based index)
    const questionNumberMap = {}
    data.testSequence.forEach((imageId, index) => {
      questionNumberMap[imageId] = index + 1
    })

    console.log("Question number mapping:", questionNumberMap)

    // Prepare the data for insertion
    const rankingsToInsert = Object.entries(data.rankings).map(([imageId, modelRanking]) => {
      // Get the original model sequence for this image
      const modelSequence = data.modelSequences[imageId] || []

      // Get the question number from our mapping (1-based index)
      const questionNumber = questionNumberMap[Number.parseInt(imageId)] || 0

      console.log(`Image ID ${imageId} is question number ${questionNumber}`)

      return {
        clinician_id: clinicianId,
        image_id: Number.parseInt(imageId),
        model_rankings: modelRanking,
        model_sequence: modelSequence,
        question_number: questionNumber,
        submitted_at: now,
      }
    })

    // First, delete any existing rankings for this clinician
    const { error: deleteError } = await supabase.from("rankings").delete().eq("clinician_id", clinicianId)

    if (deleteError) {
      console.error("Error deleting existing rankings:", deleteError)
      return { success: false, error: deleteError.message }
    }

    // Insert the new rankings
    const { error: insertError } = await supabase.from("rankings").insert(rankingsToInsert)

    if (insertError) {
      console.error("Error inserting rankings:", insertError)
      return { success: false, error: insertError.message }
    }

    console.log(`Successfully saved ${rankingsToInsert.length} rankings for clinician ${clinicianId}`)
    return { success: true }
  } catch (error) {
    console.error("Error in saveRankingsToSupabase:", error)
    return { success: false, error: error.message || "Unknown error" }
  }
}
