"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageViewer } from "@/components/image-viewer"

export default function InstructionsPage() {
  const router = useRouter()
  const [viewingImage, setViewingImage] = useState<{ src: string; alt: string } | null>(null)

  const handleViewImage = (src: string, alt: string) => {
    setViewingImage({ src, alt })
  }

  const handleStartPractice = () => {
    router.push("/practice")
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Instructions</CardTitle>
          <CardDescription>Please read carefully before proceeding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">How the Test Works:</h3>
            <ol className="list-decimal list-inside space-y-2 pl-4">
              <li>You will evaluate 10 low-quality OCT images.</li>
              <li>For each image, rank 5 AI-enhanced versions from best (1) to worst (5).</li>
              <li>Drag and drop images to rank them or use the numbered buttons.</li>
              <li>Submit each ranking to proceed to the next image.</li>
              <li>You must complete all 10 questions before final submission.</li>
            </ol>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Evaluation Criteria:</h3>
            <p>When ranking the enhanced images, please consider:</p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Reduction of speckle noise</li>
              <li>Removal of motion artifacts</li>
              <li>
                Preservation of anatomical features and structures (no introduction of new features or obscuration of
                existing ones)
              </li>
              <li>Overall clinical usefulness</li>
            </ul>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Comparison Tools:</h3>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Use the "Comparison Mode" button to activate synchronized magnification across all images</li>
              <li>Double-click any image to view it in full size</li>
              <li>Use the zoom controls to examine image details more closely</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button size="lg" onClick={handleStartPractice}>
            Try Practice Question
          </Button>
        </CardFooter>
      </Card>

      {viewingImage && (
        <ImageViewer
          src={viewingImage.src || "/placeholder.svg"}
          alt={viewingImage.alt}
          isOpen={!!viewingImage}
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  )
}
