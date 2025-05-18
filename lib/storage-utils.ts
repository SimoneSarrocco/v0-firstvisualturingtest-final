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
const SUBMISSION_TIMESTAMP_KEY = "oct_submission_timestamp"
const SESSION_ID_KEY = "oct_session_id"

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

// Generate a unique session ID
export function getOrCreateSessionId(): string {
  try {
    const storageKey = SESSION_ID_KEY
    let sessionId = sessionStorage.getItem(storageKey)

    if (!sessionId) {
      // Generate a new session ID
      sessionId = "session_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem(storageKey, sessionId)
    }

    return sessionId
  } catch (error) {
    console.error("Error accessing sessionStorage:", error)
    return "fallback_session_id"
  }
}

// Generate a unique clinician ID in the format clinician_{random_text}
export function generateClinicianId(): string {
  const randomStr = Math.random().toString(36).substring(2, 10)
  return `clinician_${randomStr}`
}

// Check if results have been submitted in this session
export function hasSubmittedInSession(): boolean {
  try {
    return sessionStorage.getItem(SUBMISSION_TIMESTAMP_KEY) !== null
  } catch (error) {
    console.error("Error checking submission status:", error)
    return false
  }
}

// Mark results as submitted in this session
export function markSubmittedInSession(): void {
  try {
    sessionStorage.setItem(SUBMISSION_TIMESTAMP_KEY, new Date().toISOString())
  } catch (error) {
    console.error("Error marking submission:", error)
  }
}

// Clear submission status
export function clearSubmissionStatus(): void {
  try {
    sessionStorage.removeItem(SUBMISSION_TIMESTAMP_KEY)
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

// Export storage keys for use in other files
export {
  DEVICE_ID_KEY,
  CLINICIAN_ID_KEY,
  CLINICIAN_NAME_KEY,
  CLINICIAN_INSTITUTION_KEY,
  CLINICIAN_EXPERIENCE_KEY,
  CLINICIAN_CREATED_AT_KEY,
  SUBMISSION_TIMESTAMP_KEY,
  SESSION_ID_KEY,
}
