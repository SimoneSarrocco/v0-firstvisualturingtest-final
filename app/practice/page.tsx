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
const models = ["DDPM", "VQGAN", "UNET", "Pix2Pix", "BBDM"]

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
    <div className="w-full px-4 py-2 max-w-[1400px] mx-auto">
      <Card className="mb-4">
        <CardHeader className="pb-1">
          <CardTitle>Practice Question</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Click or drag an AI-enhanced image to compare it with the low-quality original. Rank the enhanced images
              from best (leftmost) to worst (rightmost) by dragging them into order.
            </p>

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Practice Complete</DialogTitle>
            <DialogDescription>
              You have completed the practice question. You are now ready to start the actual test.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompletionDialog(false)}>
              Review Practice
            </Button>
            <Button onClick={handleCompletePractice}>Start Test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
