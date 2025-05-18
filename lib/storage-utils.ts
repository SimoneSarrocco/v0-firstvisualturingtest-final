/**
 * Utility functions for working with localStorage and sessionStorage
 */

// Storage keys
const DEVICE_ID_KEY = "oct_device_id"
const CLINICIAN_ID_KEY = "oct_clinician_id"
const CLINICIAN_NAME_KEY = "oct_clinician_name"
const CLINICIAN_INSTITUTION_KEY = "oct_clinician_institution"
const CLINICIAN_EXPERIENCE_KEY = "oct_clinician_experience"
const CLINICIAN_CREATED_AT_KEY = "oct_clinician_created_at"
const RANKINGS_KEY = "oct_rankings"
const MODEL_SEQUENCES_KEY = "oct_model_sequences"
const COMPLETED_QUESTIONS_KEY = "oct_completed_questions"
const CURRENT_IMAGE_INDEX_KEY = "oct_current_image_index"
const SESSION_ID_KEY = "oct_session_id"
const SUBMISSION_TIMESTAMP_KEY = "oct_submission_timestamp"
const TEST_SEQUENCE_KEY = "oct_test_sequence"

// Generate a unique device ID
export function getOrCreateDeviceId(): string {
  try {
    const storageKey = DEVICE_ID_KEY
    let deviceId = localStorage.getItem(storageKey)

    if (!deviceId) {
      // Generate a new device ID
      deviceId = "device_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      localStorage.setItem(storageKey, deviceId)
    }

    return deviceId
  } catch (error) {
    console.error("Error accessing localStorage:", error)
    return "fallback_device_id"
  }
}

// Generate a unique clinician ID in the format clinician_{random_text}
export function generateClinicianId(): string {
  const randomStr = Math.random().toString(36).substring(2, 10)
  return `clinician_${randomStr}`
}

// Generate a unique session ID
export function getOrCreateSessionId(): string {
  try {
    let sessionId = localStorage.getItem(SESSION_ID_KEY) // Changed from sessionStorage to localStorage for persistence

    if (!sessionId) {
      sessionId = "session_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
      localStorage.setItem(SESSION_ID_KEY, sessionId)
    }

    return sessionId
  } catch (error) {
    console.error("Error accessing localStorage:", error)
    return "fallback_session_id"
  }
}

// Check if results have been submitted in this session
export function hasSubmittedInSession(): boolean {
  try {
    return localStorage.getItem(SUBMISSION_TIMESTAMP_KEY) !== null // Changed from sessionStorage to localStorage
  } catch (error) {
    console.error("Error checking submission status:", error)
    return false
  }
}

// Mark results as submitted in this session
export function markSubmittedInSession(): void {
  try {
    localStorage.setItem(SUBMISSION_TIMESTAMP_KEY, new Date().toISOString()) // Changed from sessionStorage to localStorage
  } catch (error) {
    console.error("Error marking submission:", error)
  }
}

// Clear submission status
export function clearSubmissionStatus(): void {
  try {
    localStorage.removeItem(SUBMISSION_TIMESTAMP_KEY) // Changed from sessionStorage to localStorage
  } catch (error) {
    console.error("Error clearing submission status:", error)
  }
}

// Save data to localStorage
export function saveToStorage(key: string, value: any): boolean {
  try {
    const serializedValue = typeof value === "string" ? value : JSON.stringify(value)
    localStorage.setItem(key, serializedValue)
    return true
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error)
    return false
  }
}

// Save data to sessionStorage
export function saveToSession(key: string, value: any): boolean {
  try {
    const serializedValue = typeof value === "string" ? value : JSON.stringify(value)
    sessionStorage.setItem(key, serializedValue)
    return true
  } catch (error) {
    console.error(`Error saving to sessionStorage (${key}):`, error)
    return false
  }
}

// Get data from localStorage with fallback
export function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key)
    if (item === null) return fallback

    try {
      // Try to parse as JSON
      return JSON.parse(item) as T
    } catch {
      // If not valid JSON, return as is
      return item as unknown as T
    }
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error)
    return fallback
  }
}

// Get data from sessionStorage with fallback
export function getFromSession<T>(key: string, fallback: T): T {
  try {
    const item = sessionStorage.getItem(key)
    if (item === null) return fallback

    try {
      // Try to parse as JSON
      return JSON.parse(item) as T
    } catch {
      // If not valid JSON, return as is
      return item as unknown as T
    }
  } catch (error) {
    console.error(`Error reading from sessionStorage (${key}):`, error)
    return fallback
  }
}

// Remove item from localStorage
export function removeFromStorage(key: string): boolean {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error)
    return false
  }
}

// Remove item from sessionStorage
export function removeFromSession(key: string): boolean {
  try {
    sessionStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Error removing from sessionStorage (${key}):`, error)
    return false
  }
}

// Save progress to both localStorage and Supabase
export function saveProgress(currentIndex: number, rankings: any, modelSequences: any, completedQuestions: any): void {
  try {
    // Ensure completedQuestions is an array
    const completedQuestionsArray = Array.isArray(completedQuestions)
      ? completedQuestions
      : Array.from(completedQuestions)

    // Save to localStorage for persistence across sessions
    saveToStorage(CURRENT_IMAGE_INDEX_KEY, currentIndex)
    saveToStorage(RANKINGS_KEY, rankings)
    saveToStorage(MODEL_SEQUENCES_KEY, modelSequences)
    saveToStorage(COMPLETED_QUESTIONS_KEY, completedQuestionsArray)

    console.log("Progress saved to localStorage:", {
      currentIndex,
      rankingsCount: Object.keys(rankings).length,
      modelSequencesCount: Object.keys(modelSequences).length,
      completedQuestionsCount: completedQuestionsArray.length,
    })
  } catch (error) {
    console.error("Error saving progress:", error)
  }
}

// Get saved progress from localStorage
export function getSavedProgress(): {
  currentIndex: number
  rankings: any
  modelSequences: any
  completedQuestions: any
  testSequence: any
} | null {
  try {
    // Get from localStorage
    const currentIndex = getFromStorage(CURRENT_IMAGE_INDEX_KEY, -1)
    const rankings = getFromStorage(RANKINGS_KEY, null)
    const modelSequences = getFromStorage(MODEL_SEQUENCES_KEY, null)
    const completedQuestions = getFromStorage(COMPLETED_QUESTIONS_KEY, null)
    const testSequence = getFromStorage(TEST_SEQUENCE_KEY, null)

    if (currentIndex !== -1 && rankings) {
      // Ensure completedQuestions is an array
      const completedQuestionsArray = completedQuestions || []

      return {
        currentIndex,
        rankings,
        modelSequences: modelSequences || {},
        completedQuestions: completedQuestionsArray,
        testSequence,
      }
    }

    return null
  } catch (error) {
    console.error("Error getting saved progress:", error)
    return null
  }
}

// Save test sequence to localStorage
export function saveTestSequence(sequence: number[]): void {
  try {
    saveToStorage(TEST_SEQUENCE_KEY, sequence)
  } catch (error) {
    console.error("Error saving test sequence:", error)
  }
}

// Clear saved progress from localStorage
export function clearSavedProgress(): void {
  try {
    // Clear from localStorage
    removeFromStorage(CURRENT_IMAGE_INDEX_KEY)
    removeFromStorage(RANKINGS_KEY)
    removeFromStorage(MODEL_SEQUENCES_KEY)
    removeFromStorage(COMPLETED_QUESTIONS_KEY)
    // Don't clear the test sequence
  } catch (error) {
    console.error("Error clearing saved progress:", error)
  }
}

// Clear all app-related data from localStorage
export function clearAppStorage(): boolean {
  try {
    const appPrefix = "oct_"
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(appPrefix)) {
        localStorage.removeItem(key)
      }
    })
    return true
  } catch (error) {
    console.error("Error clearing app storage:", error)
    return false
  }
}

// Export storage keys for use in other files
export {
  DEVICE_ID_KEY,
  CLINICIAN_ID_KEY,
  CLINICIAN_NAME_KEY,
  CLINICIAN_INSTITUTION_KEY,
  CLINICIAN_EXPERIENCE_KEY,
  CLINICIAN_CREATED_AT_KEY,
  RANKINGS_KEY,
  MODEL_SEQUENCES_KEY,
  COMPLETED_QUESTIONS_KEY,
  CURRENT_IMAGE_INDEX_KEY,
  SESSION_ID_KEY,
  SUBMISSION_TIMESTAMP_KEY,
  TEST_SEQUENCE_KEY,
}
