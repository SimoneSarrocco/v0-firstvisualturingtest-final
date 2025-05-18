"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function InstructionsPage() {
  const router = useRouter()

  return (
    <div className="flex justify-center items-center min-h-screen px-4 py-12">
      <div className="w-full max-w-2xl">
        <Card className="modern-card card-hover">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold">
              <span className="gradient-text">Instructions</span>
            </CardTitle>
            <CardDescription className="text-gray-500">Please read carefully before proceeding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-blue-600">How the Test Works:</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>You will see 10 low-quality OCT images.</li>
                <li>For each image, 5 AI-generated enhanced versions will be shown.</li>
                <li>Rank the 5 AI-generated enhanced versions from best (1) to worst (5) based on the criteria shown below.</li>
                <li>Drag and drop images to rank them.</li>
                <li>Submit each ranking to proceed to the next image.</li>
                <li>You must complete all 10 questions before final submission.</li>
              </ol>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-blue-600">Evaluation Criteria:</h3>
              <p className="mb-2 text-gray-700">When ranking the enhanced images, please consider:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Reduction of speckle noise</li>
                <li>Removal of motion artifacts</li>
                <li>
                  Preservation of anatomical features and structures (no introduction of new artifacts or obscuration of
                  anatomical features)
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-600 mb-2">Comparison Tools:</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Click on any of the enhanced images to visualize it in full resolution next to the low-quality OCT image.</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-2">
            <Button onClick={() => router.push("/practice")} size="lg" className="button-gradient">
              Try Practice Question
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
