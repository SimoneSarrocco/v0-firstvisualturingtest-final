import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-6 px-4">
      {/* Header with logos */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <div className="relative h-18 w-auto max-w-[220px]">
              <img
                src="https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/Logo_Universita%CC%88tsspital_Basel.svg.png"
                alt="Universitätsspital Basel Logo"
                className="h-18 w-auto object-contain"
              />
            </div>
          </div>

          <div className="flex items-center">
            <div className="relative h-28 w-auto max-w-[400px]">
              <img
                src="https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/UniBasel.png"
                alt="University of Basel - Department of Biomedical Engineering Logo"
                className="h-28 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-4">
              Visual Turing Test
            </h1>
            <p className="text-lg sm:text-xl text-gray-700">Regular OCT vs AI-Enhanced OCT Images</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white border-gray-200 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-2 bg-gray-50">
                <CardTitle className="text-xl text-center text-blue-600">About This Study</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-justify text-gray-700">
                <p>
                  We have developed several deep learning models to enhance low-quality vitreous OCT images. Your clinical
                  expertise is invaluable in helping us determine which models produce the most clinically relevant
                  results.
                </p>
                <p>
                  In this test, you will be shown 10 low-quality vitreous OCT images. For each image, you will see 6
                  enhanced versions created by different AI models. Your task is to
                  rank these enhanced images from best to worst based on your clinical judgment.
                </p>
                <p className="text-center text-sm text-gray-500 italic">
                  The test will take approximately 10-15 minutes to complete. Your responses will be anonymized and used
                  solely for research purposes.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-2 bg-gray-50">
                <CardTitle className="text-xl text-center text-blue-600">Image Enhancement Example</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="relative w-full">
                  <div className="grid grid-cols-2 gap-2 items-start">
                    <div className="flex flex-col items-center">
                      <span className="text-sm text-gray-600 mb-1">Original Low-Quality Image</span>
                      <div className="relative border border-gray-200 rounded-md overflow-hidden w-full aspect-[3/2]">
                        <img
                          src="https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/inputs/1.png"
                          alt="Example of a low-quality vitreous OCT image (ART10)"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm text-gray-600 mb-1">Enhanced Image</span>
                      <div className="relative border border-gray-200 rounded-md overflow-hidden w-full aspect-[3/2]">
                        <img
                          src="https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/BBDM/x_0_0.png"
                          alt="Example of an AI-generated enhanced version"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-justify text-sm text-gray-700 mt-2">
                  <p>On the left, the true low-quality OCT image (ART10) acquired with the Heidelberg OCT Spectralis.</p>
                  <p>On the right, one of the enhanced versions obtained from one of our AI models.</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* PC screen warning box */}
          <div className="mb-6 px-4 py-3 border-l-4 border-blue-500 bg-blue-50 text-blue800 rounded-md shadow-sm">
            <p className="font-medium"><strong>Important Notice</strong>:</p>
            <p className="text-sm mt-1">
              Please take this test using a <strong>desktop/laptop computer with high brightness</strong>. Mobile or tablet screens may not properly display the OCT images, which could result in inaccurate evaluations.
            </p>
          </div>
          
          <div className="flex justify-center">
            <Suspense
              fallback={
                <Button disabled className="bg-gray-200">
                  Loading...
                </Button>
              }
            >
              <a href="/login">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
                >
                  Next
                </Button>
              </a>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
