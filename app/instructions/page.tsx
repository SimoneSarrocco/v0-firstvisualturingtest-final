"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function InstructionsPage() {
  const router = useRouter()

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "650px",
          padding: "16px",
          margin: "0 auto",
        }}
      >
        <Card style={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Instructions</CardTitle>
            <CardDescription>Please read carefully before proceeding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">How the Test Works:</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>You will evaluate 10 low-quality OCT images.</li>
                <li>For each image, rank 5 AI-enhanced versions from best (1) to worst (5).</li>
                <li>Drag and drop images to rank them or use the numbered buttons.</li>
                <li>Submit each ranking to proceed to the next image.</li>
                <li>You must complete all 10 questions before final submission.</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Evaluation Criteria:</h3>
              <p className="mb-2">When ranking the enhanced images, please consider:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Reduction of speckle noise</li>
                <li>Removal of motion artifacts</li>
                <li>
                  Preservation of anatomical features and structures (no introduction of new features or obscuration of
                  existing ones)
                </li>
                <li>Overall clinical usefulness</li>
              </ul>
            </div>

            <div className="bg-gray-100 p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-2">Comparison Tools:</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Use the "Comparison Mode" button to activate synchronized magnification across all images</li>
                <li>Double-click any image to view it in full size</li>
                <li>Use the zoom controls to examine image details more closely</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/practice")} size="lg">
              Try Practice Question
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
