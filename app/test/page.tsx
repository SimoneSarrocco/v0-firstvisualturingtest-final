"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ImageComparisonRanking } from "@/components/image-comparison-ranking"
import { Download, AlertCircle, Mail, Lock, CheckCircle, RefreshCw, Pencil } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatRankingsForExport, createCSV, downloadCSV } from "@/lib/export-utils"
import {
  saveToStorage,
  getFromStorage,
  removeFromStorage,
  getOrCreateDeviceId,
  hasSubmittedInSession,
  markSubmittedInSession,
  CLINICIAN_ID_KEY,
} from "@/lib/storage-utils"
import { testSupabaseConnection, saveRankingsToSupabase, hasSupabaseEnvVars } from "@/lib/supabase-utils"

// Define model types - but don't show their names to users
const models = ["DDPM", "VQGAN", "UNET", "Pix2Pix", "BBDM"]

// Generate test sequence - consistently select 10 random sets out of 17
const generateTestSequence = () => {
  // Use a fixed seed for random selection to ensure consistency
  const fixedSeed = 42
  const pseudoRandom = (seed) => {
    let value = seed
    return () => {
      value = (value * 9301 + 49297) % 233280
      return value / 233280
    }
  }

  const random = pseudoRandom(fixedSeed)

  // Create an array of all possible group indices (0 to 16)
  const allGroups = Array.from({ length: 17 }, (_, i) => i)

  // Shuffle the array using our seeded random function
  for (let i = allGroups.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[allGroups[i], allGroups[j]] = [allGroups[j], allGroups[i]]
  }

  // Take the first 10 groups
  const selectedGroups = allGroups.slice(0, 10)

  // For each selected group, pick one random image
  const sequence = selectedGroups.map((groupIndex) => {
    const baseIndex = groupIndex * 10
    const randomOffset = Math.floor(random() * 10)
    return baseIndex + randomOffset + 1 // +1 because images are 1-indexed
  })

  return sequence
}

// Generate a deterministic random order based on a seed
const getRandomOrder = (array, seed) => {
  const newArray = [...array]
  // Simple deterministic shuffle algorithm
  for (let i = newArray.length - 1; i > 0; i--) {
    // Use a deterministic random number based on seed and current index
    const seededRandom = ((seed * (i + 1)) % 233280) / 233280
    const j = Math.floor(seededRandom * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

export default function TestPage() {
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [testSequence, setTestSequence] = useState([])
  const [rankings, setRankings] = useState({})
  const [modelSequences, setModelSequences] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [clinicianId, setClinicianId] = useState("")
  const [clinicianData, setClinicianData] = useState({})
  const [completedQuestions, setCompletedQuestions] = useState(new Set())
  // New state to track modified questions that haven't been saved
  const [modifiedQuestions, setModifiedQuestions] = useState(new Set())
  const [supabaseError, setSupabaseError] = useState(null)
  const [isMounted, setIsMounted] = useState(false)
  const [showSavedIndicator, setShowSavedIndicator] = useState(false)
  const [retryingConnection, setRetryingConnection] = useState(false)
  const savedIndicatorTimeoutRef = useRef(null)
  // Track current ranking for comparison
  const [currentRanking, setCurrentRanking] = useState(null)
  // Add a key to force re-render of the component
  const [rankingKey, setRankingKey] = useState(0)

  // Modify the initializeTest function to properly handle session state
  // Replace the existing initializeTest function with this updated version
  const initializeTest = useCallback(async () => {
    // Only access localStorage on the client side
    if (typeof window !== "undefined") {
      setLoading(true)

      // Ensure we have a device ID
      getOrCreateDeviceId()

      // Check if coming from practice page
      const isPracticeCompleted = localStorage.getItem("oct_practice_completed") === "true"

      // Get clinician ID and data from localStorage
      const storedClinicianId = getFromStorage(CLINICIAN_ID_KEY, "")
      if (!storedClinicianId && !isPracticeCompleted) {
        // Only redirect to login if not coming from practice
        router.push("/login")
        return
      }

      if (storedClinicianId) {
        setClinicianId(storedClinicianId)

        // Collect all clinician data from localStorage
        setClinicianData({
          id: storedClinicianId,
          name: getFromStorage("oct_clinician_name", "Anonymous"),
          institution: getFromStorage("oct_clinician_institution", "Not specified"),
          experience: getFromStorage("oct_clinician_experience", "unknown"),
          created_at: getFromStorage("oct_clinician_created_at", new Date().toISOString()),
        })
      }

      // Generate a new test sequence
      const sequence = generateTestSequence()
      setTestSequence(sequence)

      // Try to load saved rankings and sequences from localStorage
      try {
        const savedRankings = localStorage.getItem("oct_rankings")
        const savedSequences = localStorage.getItem("oct_model_sequences")

        if (savedRankings && savedSequences) {
          try {
            const parsedRankings = JSON.parse(savedRankings)
            const parsedSequences = JSON.parse(savedSequences)

            // Validate the rankings - check if they match our current test sequence
            let validRankings = false
            for (const imageId of sequence) {
              if (parsedRankings[imageId]) {
                validRankings = true
                break
              }
            }

            if (validRankings) {
              setRankings(parsedRankings)
              setModelSequences(parsedSequences)

              // Mark questions as completed if they have rankings
              const newCompleted = new Set()
              sequence.forEach((imageId, index) => {
                if (parsedRankings[imageId]) {
                  newCompleted.add(index)
                }
              })
              setCompletedQuestions(newCompleted)
            } else {
              // If rankings don't match our sequence, clear them
              console.log("Saved rankings don't match current test sequence, starting fresh")
              localStorage.removeItem("oct_rankings")
              localStorage.removeItem("oct_model_sequences")
              setRankings({})
              setModelSequences({})
              setCompletedQuestions(new Set())
            }
          } catch (error) {
            console.error("Error parsing saved data:", error)
            localStorage.removeItem("oct_rankings")
            localStorage.removeItem("oct_model_sequences")
            setRankings({})
            setModelSequences({})
            setCompletedQuestions(new Set())
          }
        } else {
          // No saved rankings found
          setRankings({})
          setModelSequences({})
          setCompletedQuestions(new Set())
        }
      } catch (error) {
        console.error("Error loading saved data:", error)
        setRankings({})
        setModelSequences({})
        setCompletedQuestions(new Set())
      }

      // Check if Supabase environment variables are available
      if (!hasSupabaseEnvVars()) {
        console.warn("Supabase environment variables not found")
        setSupabaseError("Supabase environment variables not found")
      } else {
        // Test Supabase connection only if environment variables are available
        try {
          const { success, error } = await testSupabaseConnection()
          if (!success) {
            console.warn("Supabase connection test failed:", error)
            setSupabaseError(error || "Could not connect to database")
          }
        } catch (error) {
          console.error("Error testing Supabase connection:", error)
          setSupabaseError("Error testing Supabase connection")
        }
      }

      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    setIsMounted(true)
    initializeTest()

    // Clear any existing timeouts on unmount
    return () => {
      if (savedIndicatorTimeoutRef.current) {
        clearTimeout(savedIndicatorTimeoutRef.current)
      }
    }
  }, [initializeTest])

  // Update current ranking when changing questions
  useEffect(() => {
    if (testSequence.length > 0) {
      const currentImage = testSequence[currentImageIndex]
      const savedRanking = rankings[currentImage] || null
      setCurrentRanking(savedRanking ? [...savedRanking] : null)

      // Force re-render of the component when changing questions
      setRankingKey((prev) => prev + 1)
    }
  }, [currentImageIndex, rankings, testSequence])

  // Save rankings to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(rankings).length > 0) {
      try {
        localStorage.setItem("oct_rankings", JSON.stringify(rankings))
      } catch (error) {
        console.error("Error saving rankings to localStorage:", error)
      }
    }
  }, [rankings])

  // Save model sequences to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(modelSequences).length > 0) {
      try {
        localStorage.setItem("oct_model_sequences", JSON.stringify(modelSequences))
      } catch (error) {
        console.error("Error saving model sequences to localStorage:", error)
      }
    }
  }, [modelSequences])

  // Get the current image from the sequence
  const currentImage = testSequence[currentImageIndex]

  // Get the saved ranking for the current image
  const currentSavedRanking = rankings[currentImage] || null

  // Get the original model sequence for the current image
  const currentModelSequence = modelSequences[currentImage] || null

  const progress = testSequence.length > 0 ? (completedQuestions.size / testSequence.length) * 100 : 0

  // Generate the original model sequence for a question if it doesn't exist
  const getOriginalModelSequence = (imageId) => {
    // If we already have a stored sequence for this image, use it
    if (modelSequences[imageId]) {
      return modelSequences[imageId]
    }

    // Otherwise, generate a deterministic random order based on the image ID
    const seed = imageId * 9301 + 49297
    return getRandomOrder([...models], seed)
  }

  // Retry Supabase connection
  const retrySupabaseConnection = async () => {
    setRetryingConnection(true)
    try {
      // Check if environment variables are available first
      if (!hasSupabaseEnvVars()) {
        setSupabaseError("Supabase environment variables not found")
        toast({
          title: "Connection failed",
          description: "Supabase environment variables are missing. Your answers will be saved locally.",
          variant: "destructive",
        })
        setRetryingConnection(false)
        return
      }

      const { success, error } = await testSupabaseConnection()
      if (success) {
        setSupabaseError(null)
        toast({
          title: "Connection restored",
          description: "Successfully connected to the database.",
          variant: "success",
        })
      } else {
        setSupabaseError(error || "Could not connect to database")
        toast({
          title: "Connection failed",
          description: "Could not connect to the database. Your answers will be saved locally.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error retrying Supabase connection:", error)
      setSupabaseError("Could not connect to database")
    } finally {
      setRetryingConnection(false)
    }
  }

  // Navigate to a specific question
  const navigateToQuestion = (index) => {
    // Check if current question has unsaved changes
    if (modifiedQuestions.has(currentImageIndex)) {
      const confirmNavigation = window.confirm(
        "You have unsaved changes to this question. Navigate away without saving?",
      )
      if (!confirmNavigation) {
        return
      }
    }

    setCurrentImageIndex(index)
  }

  // Check if ranking has changed
  const hasRankingChanged = (newRanking) => {
    if (!currentRanking) return true
    if (newRanking.length !== currentRanking.length) return true

    for (let i = 0; i < newRanking.length; i++) {
      if (newRanking[i] !== currentRanking[i]) return true
    }

    return false
  }

  // Handle ranking changes (without submitting)
  const handleRankingChange = (modelOrder) => {
    if (hasRankingChanged(modelOrder)) {
      // Mark this question as modified
      const newModified = new Set(modifiedQuestions)
      newModified.add(currentImageIndex)
      setModifiedQuestions(newModified)

      // Update current ranking for comparison
      setCurrentRanking([...modelOrder])
    }
  }

  // Handle ranking submission for current image
  const handleRankingSubmit = (modelOrder, originalSequence) => {
    // Store the final ranking (what the user submitted)
    const newRankings = {
      ...rankings,
      [currentImage]: modelOrder,
    }
    setRankings(newRankings)

    // Store the original model sequence that was shown to the user
    // This is crucial - we need to know the original order to interpret the ranking
    const newModelSequences = {
      ...modelSequences,
      [currentImage]: originalSequence || getOriginalModelSequence(currentImage),
    }
    setModelSequences(newModelSequences)

    // Mark this question as completed
    const newCompleted = new Set(completedQuestions)
    newCompleted.add(currentImageIndex)
    setCompletedQuestions(newCompleted)

    // Remove from modified questions since it's now saved
    const newModified = new Set(modifiedQuestions)
    newModified.delete(currentImageIndex)
    setModifiedQuestions(newModified)

    // Update current ranking for comparison
    setCurrentRanking([...modelOrder])

    // Show saved indicator
    setShowSavedIndicator(true)

    // Clear any existing timeout
    if (savedIndicatorTimeoutRef.current) {
      clearTimeout(savedIndicatorTimeoutRef.current)
    }

    // Hide the indicator after 1.5 seconds
    savedIndicatorTimeoutRef.current = setTimeout(() => {
      setShowSavedIndicator(false)
    }, 1500)

    // Check if all questions are now completed
    if (newCompleted.size === testSequence.length) {
      // All questions are completed, show completion dialog
      setShowCompletionDialog(true)
    } else if (currentImageIndex < testSequence.length - 1) {
      // Move to next question if not on the last one
      const nextIndex = currentImageIndex + 1
      setCurrentImageIndex(nextIndex)

      if (typeof window !== "undefined") {
        window.scrollTo(0, 0)
      }
    }
  }

  // Submit all rankings to the database
  const submitAllRankings = async () => {
    // Check if all questions have been answered
    if (completedQuestions.size < testSequence.length) {
      toast({
        title: "Incomplete evaluation",
        description: `Please answer all ${testSequence.length} questions before submitting.`,
        variant: "destructive",
      })
      setShowCompletionDialog(false)
      return
    }

    // Check if there are any unsaved changes
    if (modifiedQuestions.size > 0) {
      toast({
        title: "Unsaved changes",
        description: `You have unsaved changes to ${modifiedQuestions.size} question(s). Please save them before submitting.`,
        variant: "warning",
      })
      setShowCompletionDialog(false)
      return
    }

    // Check if already submitted in this session
    if (hasSubmittedInSession()) {
      toast({
        title: "Already submitted",
        description: "You have already submitted your results in this session.",
        variant: "warning",
      })
      setShowCompletionDialog(false)
      return
    }

    setSubmitting(true)

    // Check if Supabase is available
    if (!hasSupabaseEnvVars() || supabaseError) {
      console.warn("Supabase not available, showing export dialog")
      setSupabaseError(supabaseError || "Supabase environment variables not found")

      // Save data to session storage for the thank you page
      sessionStorage.setItem("rankings", JSON.stringify(rankings))
      sessionStorage.setItem("modelSequences", JSON.stringify(modelSequences))
      sessionStorage.setItem("clinicianId", clinicianData.id)
      sessionStorage.setItem("clinicianName", clinicianData.name)
      sessionStorage.setItem("clinicianInstitution", clinicianData.institution)
      sessionStorage.setItem("clinicianExperience", clinicianData.experience)
      sessionStorage.setItem("clinicianCreatedAt", clinicianData.created_at)
      sessionStorage.setItem("supabaseSaveStatus", "failed")

      // Show export dialog
      setShowExportDialog(true)
      setSubmitting(false)
      setShowCompletionDialog(false)
      return
    }

    try {
      // First, check if we can connect to Supabase
      const { success: connectionSuccess, error: connectionError } = await testSupabaseConnection()

      if (!connectionSuccess) {
        console.error("Connection test failed:", connectionError)
        throw new Error(`Connection test failed: ${connectionError}`)
      }

      console.log("Connection test successful, proceeding with data submission")

      // Save all rankings to Supabase
      const { success, error } = await saveRankingsToSupabase(
        {
          rankings,
          modelSequences,
          testSequence, // Add the test sequence to help with question numbering
        },
        clinicianId,
      )

      if (!success) {
        console.error("Error saving rankings:", error)
        throw new Error(`Error saving rankings: ${error}`)
      }

      console.log("All rankings submitted successfully")

      // Save all data to session storage for the thank you page
      sessionStorage.setItem("rankings", JSON.stringify(rankings))
      sessionStorage.setItem("modelSequences", JSON.stringify(modelSequences))
      sessionStorage.setItem("clinicianId", clinicianData.id)
      sessionStorage.setItem("clinicianName", clinicianData.name)
      sessionStorage.setItem("clinicianInstitution", clinicianData.institution)
      sessionStorage.setItem("clinicianExperience", clinicianData.experience)
      sessionStorage.setItem("clinicianCreatedAt", clinicianData.created_at)
      sessionStorage.setItem("supabaseSaveStatus", "success")

      // Mark as submitted in this session
      markSubmittedInSession()

      // Clear error flag
      removeFromStorage("oct_supabase_error")

      router.push("/thank-you")
    } catch (error) {
      console.error("Error submitting rankings:", error)

      // Store the error message in localStorage
      const errorMessage = error?.message || "Unknown error occurred"
      saveToStorage("oct_supabase_error", errorMessage)
      setSupabaseError(errorMessage)

      // Save data to session storage for the thank you page
      sessionStorage.setItem("rankings", JSON.stringify(rankings))
      sessionStorage.setItem("modelSequences", JSON.stringify(modelSequences))
      sessionStorage.setItem("clinicianId", clinicianData.id)
      sessionStorage.setItem("clinicianName", clinicianData.name)
      sessionStorage.setItem("clinicianInstitution", clinicianData.institution)
      sessionStorage.setItem("clinicianExperience", clinicianData.experience)
      sessionStorage.setItem("clinicianCreatedAt", clinicianData.created_at)
      sessionStorage.setItem("supabaseSaveStatus", "failed")

      // Show export dialog instead of error toast
      setShowExportDialog(true)
      setSubmitting(false)
      setShowCompletionDialog(false)
    }
  }

  // Export data as CSV
  const exportDataAsCSV = () => {
    try {
      // Check if there are any unsaved changes
      if (modifiedQuestions.size > 0) {
        toast({
          title: "Unsaved changes",
          description: `You have unsaved changes to ${modifiedQuestions.size} question(s). Please save them before exporting.`,
          variant: "warning",
        })
        return
      }

      // Format the data for export - combine clinician and ranking data
      const formattedData = formatRankingsForExport(
        rankings,
        modelSequences,
        clinicianId,
        clinicianData,
        testSequence, // Add test sequence here
      )

      // Define headers for the combined CSV
      const headers = [
        "clinician_id",
        "clinician_name",
        "clinician_institution",
        "clinician_experience",
        "clinician_created_at",
        "image_id",
        "model_rankings",
        "model_sequence",
        "submitted_at",
      ]

      // Create and download the CSV
      const csvContent = createCSV(headers, formattedData)
      downloadCSV(csvContent, `oct_evaluation_results_${clinicianId}`)

      // Mark as submitted in this session
      markSubmittedInSession()

      // Navigate to thank you page
      router.push("/thank-you")
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Error",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Clear session data and restart test
  const clearSessionAndRestart = () => {
    if (window.confirm("This will clear all your current progress and restart the test. Are you sure?")) {
      localStorage.removeItem("oct_rankings")
      localStorage.removeItem("oct_model_sequences")
      sessionStorage.removeItem("oct_submission_timestamp")

      setRankings({})
      setModelSequences({})
      setCompletedQuestions(new Set())
      setModifiedQuestions(new Set())
      setCurrentImageIndex(0)

      toast({
        title: "Test reset",
        description: "All progress has been cleared and the test has been restarted.",
        variant: "info",
      })
    }
  }

  // Get question status icon/indicator
  const getQuestionStatusIndicator = (index) => {
    if (modifiedQuestions.has(index)) {
      return (
        <span className="ml-1 text-amber-500">
          <Pencil className="h-3 w-3 inline" />
        </span>
      )
    } else if (completedQuestions.has(index)) {
      return <span className="ml-1 text-green-500">✓</span>
    }
    return null
  }

  // Don't render anything during SSR
  if (!isMounted) {
    return null
  }

  if (loading) {
    return (
      <div className="w-full px-4 py-10 flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4 gradient-text">Loading test...</h2>
          <div className="w-[300px] h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="progress-bar h-full w-0"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-0 py-1 mx-auto">
      <Card className="w-full">
        <CardHeader className="pb-0 pt-2 px-4 modern-header">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="gradient-text">
                Question {currentImageIndex + 1} of {testSequence.length}
              </span>
              <span className="text-sm font-normal text-gray-500">Progress: {Math.round(progress)}%</span>
            </CardTitle>

            {/* Question navigation - moved to header to save vertical space */}
            <div className="flex flex-wrap gap-1 ml-4">
              {testSequence.map((_, index) => (
                <Button
                  key={index}
                  variant={index === currentImageIndex ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    index === currentImageIndex ? "question-button-active" : "question-button",
                    modifiedQuestions.has(index) ? "question-button-modified" : "",
                    completedQuestions.has(index) ? "question-button-completed" : "",
                    "h-7 min-w-7 px-1.5", // Smaller buttons
                  )}
                  onClick={() => navigateToQuestion(index)}
                >
                  {index + 1}
                  {getQuestionStatusIndicator(index)}
                </Button>
              ))}
            </div>

            {/* Reset button */}
            <Button
              variant="outline"
              size="sm"
              onClick={clearSessionAndRestart}
              className="ml-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2 space-y-1 px-4">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
            <div className="progress-bar h-full" style={{ width: `${progress}%` }}></div>
          </div>

          {/* Alerts in a row to save vertical space */}
          <div className="flex flex-wrap gap-1 mb-1">
            {supabaseError && (
              <Alert variant="destructive" className="py-1 bg-red-50 border-red-200 flex-1 min-w-[300px]">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                    <AlertDescription className="text-red-700 text-xs">
                      {supabaseError.includes("environment variables")
                        ? "Database connection not configured. Your answers will be saved locally."
                        : "There was an error connecting to the database. Your answers will be saved locally."}
                    </AlertDescription>
                  </div>
                  {!supabaseError.includes("environment variables") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={retrySupabaseConnection}
                      disabled={retryingConnection}
                      className="ml-2 min-w-[60px] h-6 border-red-200 text-red-700 hover:bg-red-50"
                    >
                      {retryingConnection ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Retry"}
                    </Button>
                  )}
                </div>
              </Alert>
            )}

            {hasSubmittedInSession() && (
              <Alert variant="warning" className="py-1 bg-amber-50 border-amber-200 flex-1 min-w-[300px]">
                <div className="flex items-center">
                  <Lock className="h-4 w-4 mr-2 flex-shrink-0 text-amber-500" />
                  <AlertDescription className="text-xs text-amber-700">
                    You have already submitted your results. You can review your answers, but cannot submit again.
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {modifiedQuestions.has(currentImageIndex) && (
              <Alert className="py-1 bg-amber-50 border-amber-200 flex-1 min-w-[300px]">
                <div className="flex items-center">
                  <Pencil className="h-4 w-4 mr-2 flex-shrink-0 text-amber-500" />
                  <AlertDescription className="text-xs text-amber-700">
                    You have unsaved changes to this question. Click "Submit Ranking" to save your changes.
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>

          {/* Image comparison and ranking */}
          {currentImage && (
            <ImageComparisonRanking
              key={`ranking-${currentImage}-${rankingKey}`}
              inputImage={currentImage}
              models={models}
              onSubmit={handleRankingSubmit}
              onChange={handleRankingChange}
              initialRanking={currentSavedRanking}
              initialSequence={currentModelSequence}
            />
          )}

          {/* Saved indicator */}
          {showSavedIndicator && (
            <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md shadow-lg flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Ranking saved
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="modern-dialog p-6 w-[400px] max-w-[95vw]">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold mb-2 gradient-text">Complete Evaluation</h2>
            <p className="text-sm text-gray-600">
              You have ranked all the images. Would you like to submit your evaluation now?
            </p>
            {modifiedQuestions.size > 0 && (
              <Alert variant="warning" className="mt-4 py-2 bg-amber-50 border-amber-200">
                <div className="flex items-center">
                  <Pencil className="h-4 w-4 mr-2 flex-shrink-0 text-amber-500" />
                  <AlertDescription className="text-xs text-amber-700">
                    You have unsaved changes to {modifiedQuestions.size} question(s). Please save them before
                    submitting.
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCompletionDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Review Answers
            </Button>
            <Button
              onClick={submitAllRankings}
              disabled={submitting || hasSubmittedInSession() || modifiedQuestions.size > 0}
              className="button-gradient"
            >
              {submitting ? "Submitting..." : "Submit Evaluation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="modern-dialog p-6 w-[450px] max-w-[95vw]">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2 gradient-text">Database Connection Error</h2>
            <p className="text-sm text-gray-600 mb-4">
              {supabaseError && supabaseError.includes("environment variables")
                ? "The database connection is not configured. You can export your results as a CSV file."
                : "We couldn't connect to our database to save your results. This could be due to network issues or because the app hasn't been deployed yet."}
            </p>
            <Alert variant="destructive" className="mb-4 py-2 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
              <AlertDescription className="text-xs text-red-700">Error: {supabaseError}</AlertDescription>
            </Alert>
            {modifiedQuestions.size > 0 && (
              <Alert variant="warning" className="mb-4 py-2 bg-amber-50 border-amber-200">
                <div className="flex items-center">
                  <Pencil className="h-4 w-4 mr-2 flex-shrink-0 text-amber-500" />
                  <AlertDescription className="text-xs text-amber-700">
                    You have unsaved changes to {modifiedQuestions.size} question(s). Please save them before exporting.
                  </AlertDescription>
                </div>
              </Alert>
            )}
            <p className="text-sm mb-2 text-gray-600">
              You can export your results as a CSV file, which you can then send to the researchers or upload later.
            </p>
            <p className="text-sm font-medium mb-2 text-gray-700">
              Please send the downloaded CSV file to one of these email addresses:
            </p>
            <div className="flex flex-col gap-1 mb-4">
              <a
                href="mailto:simone.sarrocco@unibas.ch"
                className="text-blue-600 hover:underline flex items-center text-sm"
              >
                <Mail className="h-4 w-4 mr-1" /> simone.sarrocco@unibas.ch
              </a>
              <a
                href="mailto:philippe.valmaggia@unibas.ch"
                className="text-blue-600 hover:underline flex items-center text-sm"
              >
                <Mail className="h-4 w-4 mr-1" /> philippe.valmaggia@unibas.ch
              </a>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Go Back
            </Button>
            <Button onClick={exportDataAsCSV} className="button-gradient" disabled={modifiedQuestions.size > 0}>
              <Download className="mr-2 h-4 w-4" />
              Export Results as CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom positioning for the toaster */}
      <div className="fixed top-4 left-4 z-50 max-w-xs">
        <Toaster />
      </div>
    </div>
  )
}
