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

// Check if clinician exists in Supabase
export const checkClinicianExists = async (clinicianId: string): Promise<boolean> => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("clinicians").select("id").eq("id", clinicianId).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - clinician doesn't exist
        return false
      }
      console.error("Error checking if clinician exists:", error)
      throw error
    }

    return !!data
  } catch (error) {
    console.error("Error in checkClinicianExists:", error)
    return false
  }
}

// Save clinician data to Supabase
export const saveClinicianToSupabase = async (
  clinicianData: {
    id: string
    name: string
    institution: string
    experience: string
    sex: string
    age: number
    created_at: string
  },
  markAsSubmitted = false,
): Promise<{ success: boolean; error?: string; id?: string }> => {
  try {
    const supabase = createClient()

    console.log("Attempting to save clinician data:", clinicianData)

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

    const now = new Date().toISOString()

    if (existingClinician) {
      console.log("Updating existing clinician:", clinicianData.id)

      // Update existing clinician
      const updateData = {
        name: clinicianData.name,
        institution: clinicianData.institution,
        experience: clinicianData.experience,
        sex: clinicianData.sex,
        age: clinicianData.age,
        updated_at: now,
        ...(markAsSubmitted && { submitted_test: true }),
      }

      console.log("Update data:", updateData)

      const { error: updateError } = await supabase.from("clinicians").update(updateData).eq("id", clinicianData.id)

      if (updateError) {
        console.error("Error updating clinician:", updateError)
        return { success: false, error: updateError.message }
      }

      console.log("Successfully updated clinician")
      return { success: true, id: clinicianData.id }
    } else {
      console.log("Creating new clinician:", clinicianData.id)

      // Insert new clinician
      const insertData = {
        id: clinicianData.id,
        name: clinicianData.name,
        institution: clinicianData.institution,
        experience: clinicianData.experience,
        sex: clinicianData.sex,
        age: clinicianData.age,
        created_at: clinicianData.created_at,
        updated_at: now,
        ...(markAsSubmitted && { submitted_test: true }),
      }

      console.log("Insert data:", insertData)

      const { data, error: insertError } = await supabase.from("clinicians").insert([insertData]).select()

      if (insertError) {
        console.error("Error inserting clinician:", insertError)
        return { success: false, error: insertError.message }
      }

      console.log("Successfully created clinician:", data)
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
  clinicianData?: any,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = createClient()
    const now = new Date().toISOString()

    // First, ensure the clinician exists in the database
    const clinicianExists = await checkClinicianExists(clinicianId)

    if (!clinicianExists) {
      console.log("Clinician does not exist in database, creating record first")

      if (!clinicianData) {
        // If no clinician data was provided, we can't create the record
        return {
          success: false,
          error: "Clinician does not exist in database and no clinician data was provided to create it",
        }
      }

      // Create the clinician record with submitted_test = true
      const { success, error } = await saveClinicianToSupabase(
        {
          id: clinicianId,
          name: clinicianData.name || "Anonymous",
          institution: clinicianData.institution || "Not specified",
          experience: clinicianData.experience || "unknown",
          sex: clinicianData.sex || "Not specified",
          age: clinicianData.age || null,
          created_at: clinicianData.created_at || now,
        },
        true,
      ) // Mark as submitted

      if (!success) {
        console.error("Error creating clinician record:", error)
        return { success: false, error: `Failed to create clinician record: ${error}` }
      }
    } else {
      // Explicitly update the clinician to mark as having submitted the test
      console.log("Clinician exists, updating submitted_test flag to true")

      const { error: updateError } = await supabase
        .from("clinicians")
        .update({
          submitted_test: true,
          updated_at: now,
        })
        .eq("id", clinicianId)

      if (updateError) {
        console.error("Error updating clinician submitted_test flag:", updateError)
        // Continue anyway to try to save the rankings
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

    // Double-check that the submitted_test flag is set to true
    const { error: finalUpdateError } = await supabase
      .from("clinicians")
      .update({ submitted_test: true })
      .eq("id", clinicianId)

    if (finalUpdateError) {
      console.error("Error in final update of submitted_test flag:", finalUpdateError)
      // Continue anyway since the rankings were saved successfully
    }

    console.log(`Successfully saved ${rankingsToInsert.length} rankings for clinician ${clinicianId}`)
    return { success: true }
  } catch (error) {
    console.error("Error in saveRankingsToSupabase:", error)
    return { success: false, error: error.message || "Unknown error" }
  }
}
