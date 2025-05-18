import { createClient } from "./supabase-client"
import { getOrCreateDeviceId, getOrCreateSessionId } from "./storage-utils"

// Create or retrieve a session in Supabase
export const getOrCreateSession = async (clinicianId: string) => {
  try {
    const supabase = createClient()
    const sessionId = getOrCreateSessionId()
    const deviceId = getOrCreateDeviceId()

    // Check if session exists
    const { data: existingSession, error: checkError } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Error checking for existing session:", checkError)
      throw checkError
    }

    // If session exists, return it
    if (existingSession) {
      console.log("Found existing session:", existingSession)
      return { sessionId, isNew: false }
    }

    // Create new session
    const { error: insertError } = await supabase.from("sessions").insert([
      {
        id: sessionId,
        clinician_id: clinicianId,
        device_id: deviceId,
        started_at: new Date().toISOString(),
      },
    ])

    if (insertError) {
      console.error("Error creating session:", insertError)
      throw insertError
    }

    console.log("Created new session:", sessionId)
    return { sessionId, isNew: true }
  } catch (error) {
    console.error("Error in getOrCreateSession:", error)
    // Return the session ID anyway, so the app can continue to function
    return { sessionId: getOrCreateSessionId(), isNew: false, error }
  }
}

// Save progress to Supabase
export const saveProgressToSupabase = async (sessionId: string, currentIndex: number, completedQuestions: number[]) => {
  try {
    const supabase = createClient()

    // Check if progress exists
    const { data: existingProgress, error: checkError } = await supabase
      .from("progress")
      .select("*")
      .eq("session_id", sessionId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking for existing progress:", checkError)
      throw checkError
    }

    const now = new Date().toISOString()

    if (existingProgress) {
      // Update existing progress
      const { error: updateError } = await supabase
        .from("progress")
        .update({
          current_index: currentIndex,
          completed_questions: completedQuestions,
          last_updated: now,
        })
        .eq("session_id", sessionId)

      if (updateError) {
        console.error("Error updating progress:", updateError)
        throw updateError
      }
    } else {
      // Insert new progress
      const { error: insertError } = await supabase.from("progress").insert([
        {
          session_id: sessionId,
          current_index: currentIndex,
          completed_questions: completedQuestions,
          last_updated: now,
        },
      ])

      if (insertError) {
        console.error("Error inserting progress:", insertError)
        throw insertError
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error saving progress to Supabase:", error)
    return { success: false, error }
  }
}

// Get progress from Supabase
export const getProgressFromSupabase = async (sessionId: string) => {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("progress").select("*").eq("session_id", sessionId).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return { success: true, progress: null }
      }
      console.error("Error getting progress from Supabase:", error)
      throw error
    }

    return { success: true, progress: data }
  } catch (error) {
    console.error("Error in getProgressFromSupabase:", error)
    return { success: false, error, progress: null }
  }
}

// Save ranking to Supabase
export const saveRankingToSupabase = async (
  sessionId: string,
  clinicianId: string,
  imageId: number,
  modelRankings: string[],
  modelSequence: string[],
) => {
  try {
    const supabase = createClient()

    // Check if ranking exists
    const { data: existingRanking, error: checkError } = await supabase
      .from("rankings")
      .select("*")
      .eq("session_id", sessionId)
      .eq("image_id", imageId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking for existing ranking:", checkError)
      throw checkError
    }

    const now = new Date().toISOString()

    if (existingRanking) {
      // Update existing ranking
      const { error: updateError } = await supabase
        .from("rankings")
        .update({
          model_rankings: modelRankings,
          model_sequence: modelSequence,
          submitted_at: now,
        })
        .eq("session_id", sessionId)
        .eq("image_id", imageId)

      if (updateError) {
        console.error("Error updating ranking:", updateError)
        throw updateError
      }
    } else {
      // Insert new ranking
      const { error: insertError } = await supabase.from("rankings").insert([
        {
          session_id: sessionId,
          clinician_id: clinicianId,
          image_id: imageId,
          model_rankings: modelRankings,
          model_sequence: modelSequence,
          submitted_at: now,
        },
      ])

      if (insertError) {
        console.error("Error inserting ranking:", insertError)
        throw insertError
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error saving ranking to Supabase:", error)
    return { success: false, error }
  }
}

// Mark session as completed
export const completeSession = async (sessionId: string) => {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from("sessions")
      .update({
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId)

    if (error) {
      console.error("Error completing session:", error)
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("Error in completeSession:", error)
    return { success: false, error }
  }
}

// Get all rankings for a session
export const getSessionRankings = async (sessionId: string) => {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("rankings").select("*").eq("session_id", sessionId)

    if (error) {
      console.error("Error getting session rankings:", error)
      throw error
    }

    return { success: true, rankings: data || [] }
  } catch (error) {
    console.error("Error in getSessionRankings:", error)
    return { success: false, error, rankings: [] }
  }
}
