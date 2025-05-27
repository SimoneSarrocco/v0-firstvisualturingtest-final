"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, ArrowLeftRight, Smartphone, Send } from "lucide-react"
import Image from "next/image"

export default function InstructionsPage() {
  const router = useRouter()

  // Ranking position labels
  const rankLabels = ["Best", "2nd Best", "3rd Best", "4th Best", "5th Best", "Worst"]

  return (
    <div className="flex justify-center items-center min-h-screen px-4 py-12">
      <div className="w-full max-w-3xl">
        <Card className="modern-card card-hover">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold">
              <span className="gradient-text">Quick Instructions</span>
            </CardTitle>
            <CardDescription className="text-gray-500">2 main sections in each question • Takes 10-15 minutes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Steps with Visual Previews - Vertical Layout */}
            <div className="space-y-6">
              {/* Compare Section */}
              <div className="flex flex-col space-y-4 p-6 bg-blue-50 rounded-lg border-2 border-blue-200 hover:border-blue-300 transition-all">
                <div className="flex items-start space-x-3">
                  <Eye className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-lg">1. Compare</h4>
                    <p className="text-sm text-blue-700">
                      By clicking on an AI-generated image from the section below, you can display it in full resolution
                      side-by-side with the low-quality counterpart for an easier comparison.
                    </p>
                  </div>
                </div>
                {/* Visual Preview with Example Images */}
                <div className="relative rounded-md overflow-hidden border border-blue-300 bg-white p-4">
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <div className="text-xs text-gray-600 mb-2 text-center">Low Quality (ART10)</div>
                      <div className="relative">
                        <Image
                          src="https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/inputs/2.png"
                          alt="Low quality OCT image preview"
                          width={200}
                          height={130}
                          className="w-full h-auto rounded border border-gray-300"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.currentTarget.src = "/placeholder.svg?height=130&width=200&text=Low+Quality+OCT"
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-blue-600 mb-2 text-center">Enhanced Version</div>
                      <div className="relative">
                        <Image
                          src="https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/DDPM_7th_new/output_2.png"
                          alt="Enhanced OCT image preview"
                          width={200}
                          height={130}
                          className="w-full h-auto rounded border border-blue-300"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.currentTarget.src = "/placeholder.svg?height=130&width=200&text=Enhanced+OCT"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-xs font-medium text-blue-800 bg-blue-50 px-2 py-1 rounded">
                      Side-by-side comparison area
                    </span>
                  </div>
                </div>
              </div>

              {/* Ranking Section - with horizontal arrow icon */}
              <div className="flex flex-col space-y-4 p-6 bg-green-50 rounded-lg border-2 border-green-200 hover:border-green-300 transition-all">
                <div className="flex items-start space-x-3">
                  <ArrowLeftRight className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-900 text-lg">2. Rank</h4>
                    <p className="text-sm text-green-700">
                      Drag & drop to rank the 6 enhanced images from best (left) to worst (right)
                    </p>
                  </div>
                </div>
                {/* Visual Preview with Example Images */}
                <div className="relative rounded-md overflow-hidden border border-green-300 bg-white p-4">
                  {/* Rank labels row */}
                  <div className="grid grid-cols-6 gap-2 mb-2">
                    {rankLabels.map((label, index) => (
                      <div key={label} className="flex justify-center">
                        <span className="text-[10px] font-medium text-green-700 bg-green-50 px-1 py-0.5 rounded">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Images row */}
                  <div className="grid grid-cols-6 gap-2">
                    {["A", "B", "C", "D", "E", "F"].map((letter, index) => (
                      <div key={letter} className="flex flex-col items-center">
                        <div className="relative">
                          <Image
                            src={`https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/Example_Preview/Example_${letter}.png`}
                            alt={`Enhanced OCT image ${letter}`}
                            width={60}
                            height={40}
                            className="w-full h-auto rounded border border-green-300"
                            onError={(e) => {
                              // Fallback to placeholder if image fails to load
                              e.currentTarget.src = `/placeholder.svg?height=40&width=60&text=${letter}`
                            }}
                          />
                          <div className="absolute -top-1 -left-1 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {letter}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-xs font-medium text-green-800 bg-green-50 px-2 py-1 rounded">
                      Drag & drop to reorder from best to worst
                    </span>
                  </div>
                </div>
              </div>
            </div>


            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Additional Notes:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                  <Monitor className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                 <div>
                  <h5 className="font-medium text-red-900">Use a PC Screen</h5>
                  <p className="text-sm text-red-700">
                  Please use a desktop or laptop screen to take the test. Mobile or tablet screens may not display OCT images properly, leading to inaccurate evaluations.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-amber-50 rounded-lg">
                <Send className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-amber-900">Submission</h5>
                  <p className="text-sm text-amber-700">Save each ranking, complete all 10 questions</p>
                </div>
              </div>
            </div>
      </div>

            {/* What to Look For - Vertical Layout */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                What Makes a Good Enhanced Image?
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-blue-800">Removal of speckle noise w.r.t. the ART10</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-blue-800">Reduction of motion artifacts w.r.t. the ART10</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-blue-800">Preservation of anatomical structures visible in the ART10</span>
                </div>
              </div>
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
