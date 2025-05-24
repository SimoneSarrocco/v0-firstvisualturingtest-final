"use client"

import { useState, useEffect } from "react"
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
import { ImageComparisonRanking } from "@/components/image-comparison-ranking"

// Define model types for practice
const models = ["DDPM_7th_new", "VQGAN", "UNET", "Pix2Pix", "BBDM", "TARGET"]

// Use a fixed practice image
const practiceImage = 42 // Example image number

export default function PracticePage() {
  const router = useRouter()
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Check if we're on client-side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Handle ranking submission for practice
  const handleRankingSubmit = () => {
    setShowCompletionDialog(true)
  }

  // Handle completion of practice
  const handleCompletePractice = () => {
    try {
      // Mark practice as completed in localStorage
      localStorage.setItem("oct_practice_completed", "true")

      // Navigate directly to test page
      router.push("/test")
    } catch (error) {
      console.error("Error completing practice:", error)
    }
  }

  // Don't render anything during SSR
  if (!isMounted) {
    return null
  }

  return (
    <div className="w-full px-4 py-3">
      <Card className="modern-card mb-2 w-full max-w-none">
        <CardHeader className="pb-0 px-4 modern-header">
          <CardTitle className="text-xl font-bold">
            <span className="gradient-text">Practice Question</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 px-4">
          <div className="space-y-2">
            <ImageComparisonRanking
              inputImage={practiceImage}
              models={models}
              onSubmit={handleRankingSubmit}
              initialRanking={null}
            />
          </div>
        </CardContent>
      </Card>

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="modern-dialog p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              <span className="gradient-text">Practice Complete</span>
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              You have completed the practice question. You are now ready to start the actual test.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCompletionDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Review Practice
            </Button>
            <Button onClick={handleCompletePractice} className="button-gradient">
              Start Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
