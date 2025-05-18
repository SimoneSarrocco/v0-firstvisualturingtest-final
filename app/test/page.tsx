"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ImageComparisonRanking } from "@/components/image-comparison-ranking"
import { Download, AlertCircle, Mail, Lock, CheckCircle, RefreshCw } from "lucide-react"
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
import { testSupabaseConnection, saveRankingsToSupabase } from "@/lib/supabase-utils"

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
  const [supabaseError, setSupabaseError] = useState(null)
  const [isMounted, setIsMounted] = useState(false)
  const [showSavedIndicator, setShowSavedIndicator] = useState(false)
  const [retryingConnection, setRetryingConnection] = useState(false)
  const savedIndicatorTimeoutRef = useRef(null)

  // Initialize test sequence on component mount
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

      // Test Supabase connection
      const { success, error } = await testSupabaseConnection()
      if (!success) {
        console.warn("Supabase connection test failed:", error)
        setSupabaseError(error || "Could not connect to database")
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

  const currentImage = testSequence[currentImageIndex]
  const progress = testSequence.length > 0 ? (completedQuestions.size / testSequence.length) * 100 : 0

  // Retry Supabase connection
  const retrySupabaseConnection = async () => {
    setRetryingConnection(true)
    try {
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
    setCurrentImageIndex(index)
  }

  // Handle ranking submission for current image
  const handleRankingSubmit = (modelOrder) => {
    // Store both the rankings and the original model sequence for this image
    const newRankings = {
      ...rankings,
      [currentImage]: modelOrder,
    }

    setRankings(newRankings)

    // Store the model sequence that was shown to the user
    const newModelSequences = {
      ...modelSequences,
      [currentImage]: modelOrder,
    }

    setModelSequences(newModelSequences)

    // Mark this question as completed
    const newCompleted = new Set(completedQuestions)
    newCompleted.add(currentImageIndex)
    setCompletedQuestions(newCompleted)

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
    try {
      // First, check if we can connect to Supabase
      const { success: connectionSuccess, error: connectionError } = await testSupabaseConnection()

      if (!connectionSuccess) {
        console.error("Connection test failed:", connectionError)
        throw new Error(`Connection test failed: ${connectionError}`)
      }

      console.log("Connection test successful, proceeding with data submission")

      // Save all rankings to Supabase
      const { success, error } = await saveRankingsToSupabase({ rankings, modelSequences }, clinicianId)

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
      // Format the data for export - combine clinician and ranking data
      const formattedData = formatRankingsForExport(rankings, modelSequences, clinicianId, clinicianData)

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

  // Don't render anything during SSR
  if (!isMounted) {
    return null
  }

  if (loading) {
    return (
      <div className="w-full px-4 py-10 flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading test...</h2>
          <Progress value={0} className="w-[300px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 py-1 max-w-[1400px] mx-auto">
      <Card className="mb-2">
        <CardHeader className="pb-1 pt-2">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>
              Question {currentImageIndex + 1} of {testSequence.length}
            </span>
            <span className="text-sm font-normal text-muted-foreground">Progress: {Math.round(progress)}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <Progress value={progress} className="mb-1" />

          {supabaseError && (
            <Alert variant="destructive" className="mb-1 py-1">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    There was an error connecting to the database. Your answers will be saved locally.
                  </AlertDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retrySupabaseConnection}
                  disabled={retryingConnection}
                  className="ml-2 min-w-[80px]"
                >
                  {retryingConnection ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Retry"}
                </Button>
              </div>
            </Alert>
          )}

          {hasSubmittedInSession() && (
            <Alert variant="warning" className="mb-1 py-1 bg-amber-50 border-amber-200">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                You have already submitted your results in this session. You can review your answers, but you cannot
                submit again.
              </AlertDescription>
            </Alert>
          )}

          {/* Question navigation */}
          <div className="mb-1 flex flex-wrap gap-1">
            {testSequence.map((_, index) => (
              <Button
                key={index}
                variant={
                  index === currentImageIndex ? "default" : completedQuestions.has(index) ? "outline" : "secondary"
                }
                size="sm"
                className={completedQuestions.has(index) ? "border-green-500" : ""}
                onClick={() => navigateToQuestion(index)}
              >
                {index + 1}
                {completedQuestions.has(index) && <span className="ml-1 text-green-500">✓</span>}
              </Button>
            ))}
          </div>

          {/* Image comparison and ranking */}
          {currentImage && (
            <ImageComparisonRanking
              inputImage={currentImage}
              models={models}
              onSubmit={handleRankingSubmit}
              initialRanking={rankings[currentImage] || null}
            />
          )}

          {/* Saved indicator */}
          {showSavedIndicator && (
            <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md shadow-md flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Ranking saved
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Evaluation</DialogTitle>
            <DialogDescription>
              You have ranked all the images. Would you like to submit your evaluation now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompletionDialog(false)}>
              Review Answers
            </Button>
            <Button onClick={submitAllRankings} disabled={submitting || hasSubmittedInSession()}>
              {submitting ? "Submitting..." : "Submit Evaluation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Database Connection Error</DialogTitle>
            <DialogDescription>
              We couldn't connect to our database to save your results. This could be due to network issues or because
              the app hasn't been deployed yet.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Error: {supabaseError}</AlertDescription>
            </Alert>
            <p className="mb-4">
              You can export your results as a CSV file, which you can then send to the researchers or upload later.
            </p>
            <p className="mb-4">Please send the downloaded CSV file to one of these email addresses:</p>
            <div className="flex flex-col gap-1 mb-4">
              <a href="mailto:simone.sarrocco@unibas.ch" className="text-blue-600 hover:underline flex items-center">
                <Mail className="h-4 w-4 mr-1" /> simone.sarrocco@unibas.ch
              </a>
              <a href="mailto:philippe.valmaggia@unibas.ch" className="text-blue-600 hover:underline flex items-center">
                <Mail className="h-4 w-4 mr-1" /> philippe.valmaggia@unibas.ch
              </a>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Go Back
            </Button>
            <Button onClick={exportDataAsCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export Results as CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom positioning for the toaster */}
      <div className="fixed top-4 left-4 z-50 max-w-xs">
        <Toaster />
      </div>
    </div>
  )
}
