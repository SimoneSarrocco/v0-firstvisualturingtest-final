import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen py-8 px-4">
      <Card className="card-gradient max-w-3xl w-full">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl sm:text-3xl">Visual Turing Test for Vitreous OCT Image Enhancement</CardTitle>
          <CardDescription className="text-lg mt-2">
            Evaluation of Deep Learning Models for Vitreous OCT Image Enhancement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-medium text-lg mb-3">About This Study:</h3>
            <p className="mb-3">
              We have developed several deep learning models to enhance low-quality vitreous OCT images. Your clinical
              expertise is invaluable in helping us determine which models produce the most clinically relevant results.
            </p>
            <p className="mb-3">
              In this test, you will be shown 10 low-quality vitreous OCT images. For each image, you will see 5
              enhanced versions created by 5 different AI models. Your task is to rank these enhanced images from best
              to worst based on your clinical judgment.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 my-4">
              <div className="flex flex-col items-center">
                <h4 className="font-medium mb-2 text-center">Low-Quality OCT Image:</h4>
                <div
                  className="relative border border-gray-300 rounded-md overflow-hidden"
                  style={{ width: "300px", height: "200px" }}
                >
                  <Image
                    src="https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/inputs/1.jpg"
                    alt="Example of a low-quality vitreous OCT image"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center">
                <h4 className="font-medium mb-2 text-center">Enhanced OCT Image:</h4>
                <div
                  className="relative border border-gray-300 rounded-md overflow-hidden"
                  style={{ width: "300px", height: "200px" }}
                >
                  <Image
                    src="https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/BBDM/x_0_0.png"
                    alt="Example of an enhanced vitreous OCT image"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            <p className="text-center mt-3">
              The test will take approximately 10-15 minutes to complete. Your responses will be anonymized and used
              solely for research purposes.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pt-2 pb-4">
          <Suspense fallback={<Button disabled>Loading...</Button>}>
            <Link href="/login">
              <Button size="lg">Start Evaluation</Button>
            </Link>
          </Suspense>
        </CardFooter>
      </Card>
    </div>
  )
}
