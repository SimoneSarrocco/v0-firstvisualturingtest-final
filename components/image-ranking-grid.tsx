"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ImageComparisonSlider } from "@/components/image-comparison-slider"
import { ZoomIn, ArrowLeftRightIcon as ArrowsLeftRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { SimpleImageViewer } from "./simple-image-viewer"

// Helper function to get border color based on rank position
const getBorderColorClass = (position: number): string => {
  // More balanced color scheme - gradient from positive to neutral to negative
  switch (position) {
    case 0: // Rank 1 (Best)
      return "border-blue-500"
    case 1: // Rank 2
      return "border-cyan-500"
    case 2: // Rank 3 (Neutral)
      return "border-gray-400"
    case 3: // Rank 4
      return "border-amber-500"
    case 4: // Rank 5 (Worst)
      return "border-red-500"
    default:
      return "border-gray-200"
  }
}

// Helper function to get text color based on rank position
const getTextColorClass = (position: number): string => {
  // More balanced color scheme - gradient from positive to neutral to negative
  switch (position) {
    case 0: // Rank 1 (Best)
      return "text-blue-600"
    case 1: // Rank 2
      return "text-cyan-600"
    case 2: // Rank 3 (Neutral)
      return "text-gray-600"
    case 3: // Rank 4
      return "text-amber-600"
    case 4: // Rank 5 (Worst)
      return "text-red-600"
    default:
      return "text-gray-600"
  }
}

// Helper function to get background color based on rank position
const getBgColorClass = (position: number): string => {
  // More balanced color scheme - gradient from positive to neutral to negative
  switch (position) {
    case 0: // Rank 1 (Best)
      return "bg-blue-50"
    case 1: // Rank 2
      return "bg-cyan-50"
    case 2: // Rank 3 (Neutral)
      return "bg-gray-50"
    case 3: // Rank 4
      return "bg-amber-50"
    case 4: // Rank 5 (Worst)
      return "bg-red-50"
    default:
      return "bg-gray-50"
  }
}

interface ImageRankingGridProps {
  inputImage: number
  models: string[]
  onSubmit: (ranking: string[]) => void
  initialRanking?: string[] | null
}

export function ImageRankingGrid({ inputImage, models, onSubmit, initialRanking }: ImageRankingGridProps) {
  // State for model order/ranking
  const [modelRanking, setModelRanking] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [fullSizeImage, setFullSizeImage] = useState<{ src: string; alt: string } | null>(null)
  const [comparisonMode, setComparisonMode] = useState<number | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Instead of storing labels in a state, we'll generate them on the fly based on current position
  const getImageLabel = (index: number) => {
    return String.fromCharCode(65 + index) // A, B, C, etc. based on current position
  }

  // Check if we're on client-side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize model ranking
  useEffect(() => {
    let newRanking = []

    // If initial ranking provided, use it
    if (initialRanking && initialRanking.length === models.length) {
      newRanking = [...initialRanking]
    } else {
      // Otherwise randomize
      newRanking = [...models].sort(() => 0.5 - Math.random())
    }

    setModelRanking(newRanking)
  }, [inputImage, models, initialRanking])

  // Get the correct image filename based on model and image number
  const getImageFilename = (model: string | null): string => {
    if (model === null) {
      // Input image
      return `${inputImage}.png`
    } else if (model === "BBDM") {
      // BBDM uses x_{index}_0.png format (0-indexed)
      return `x_${inputImage - 1}_0.png`
    } else {
      // Other models use output_{number}.png format (1-indexed)
      return `output_${inputImage}.png`
    }
  }

  // Get image source URL
  const getImageSrc = (model: string | null): string => {
    if (model === null) {
      // Input image
      return `https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/inputs/${getImageFilename(null)}`
    } else {
      // Model image
      return `https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/${model}/${getImageFilename(model)}`
    }
  }

  // Handle image click for ranking
  const handleImageClick = (index: number) => {
    if (selectedImageIndex === null) {
      // First image selected
      setSelectedImageIndex(index)
    } else if (selectedImageIndex === index) {
      // Same image clicked twice, show full size
      const model = modelRanking[index]
      setFullSizeImage({
        src: getImageSrc(model),
        alt: `Enhanced Image ${getImageLabel(index)}`,
      })
      setSelectedImageIndex(null)
    } else {
      // Second image selected, swap them
      const newRanking = [...modelRanking]
      const temp = newRanking[selectedImageIndex]
      newRanking[selectedImageIndex] = newRanking[index]
      newRanking[index] = temp
      setModelRanking(newRanking)
      setSelectedImageIndex(null)
    }
  }

  // Toggle comparison mode for an image
  const toggleComparisonMode = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setComparisonMode(comparisonMode === index ? null : index)
  }

  // View full-size image
  const handleViewFullImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const model = modelRanking[index]
    setFullSizeImage({
      src: getImageSrc(model),
      alt: `Enhanced Image ${getImageLabel(index)}`,
    })
  }

  // Handle submission
  const handleSubmit = () => {
    onSubmit(modelRanking)
  }

  // Don't render anything during SSR
  if (!isMounted) {
    return <div className="min-h-[200px] bg-gray-50 rounded-md flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Original image on the left */}
      <div className="space-y-2">
        <h3 className="font-medium">Original Image:</h3>
        <div className="relative border border-gray-300 rounded-md overflow-hidden flex justify-center">
          <div className="w-full h-[496px] relative">
            <Image
              src={getImageSrc(null) || "/placeholder.svg"}
              alt="Original OCT image"
              fill
              className="object-contain cursor-pointer"
              onClick={() =>
                setFullSizeImage({
                  src: getImageSrc(null),
                  alt: "Original OCT image",
                })
              }
              unoptimized
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              setFullSizeImage({
                src: getImageSrc(null),
                alt: "Original OCT image",
              })
            }}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Enhanced images on the right */}
      <div className="space-y-2">
        <h3 className="font-medium">Enhanced Images - Rank from Best (1) to Worst (5):</h3>
        <div className="grid grid-cols-3 gap-2">
          {modelRanking.map((model, index) => {
            const label = getImageLabel(index) // Get label based on current position
            const borderColorClass = getBorderColorClass(index)
            const bgColorClass = getBgColorClass(index)
            const textColorClass = getTextColorClass(index)

            // For the layout, we want 3 images in the first row, 2 in the second
            const gridColSpan = index >= 3 ? "col-span-3 md:col-span-1" : ""
            const marginLeft = index === 3 ? "md:ml-[16.666%]" : ""

            return (
              <div
                key={model}
                className={cn("flex flex-col", gridColSpan, marginLeft)}
                style={{ gridColumn: index === 3 ? "span 1 / span 1" : "" }}
              >
                <div className={cn("p-1 text-center text-xs font-medium rounded-t-md", bgColorClass, textColorClass)}>
                  Rank {index + 1}
                </div>
                <div
                  className={cn(
                    "relative border-2 rounded-b-md overflow-hidden cursor-pointer",
                    borderColorClass,
                    selectedImageIndex === index ? "ring-2 ring-blue-500 ring-offset-1" : "",
                  )}
                  onClick={() => handleImageClick(index)}
                >
                  {/* If in comparison mode, show slider */}
                  {comparisonMode === index ? (
                    <ImageComparisonSlider
                      beforeImage={getImageSrc(null)}
                      afterImage={getImageSrc(model)}
                      beforeLabel="Original"
                      afterLabel={label}
                    />
                  ) : (
                    <>
                      <div className="w-full aspect-[1.55] relative">
                        <Image
                          src={getImageSrc(model) || "/placeholder.svg"}
                          alt={`Enhanced Image ${label}`}
                          fill
                          className="object-cover cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFullSizeImage({
                              src: getImageSrc(model),
                              alt: `Enhanced Image ${label}`,
                            })
                          }}
                          unoptimized
                        />
                      </div>
                      <div className="absolute top-1 left-1 bg-white/80 px-1 py-0.5 text-xs font-medium rounded">
                        {label}
                      </div>
                      <div className="absolute top-1 right-1 flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 bg-white/80 hover:bg-white"
                          onClick={(e) => toggleComparisonMode(index, e)}
                        >
                          <ArrowsLeftRight className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 bg-white/80 hover:bg-white"
                          onClick={(e) => handleViewFullImage(index, e)}
                        >
                          <ZoomIn className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {selectedImageIndex !== null && (
          <div className="text-center p-2 bg-blue-50 rounded-md text-blue-700 text-xs">
            Now click another image to swap positions, or click the same image again to view it in full size.
          </div>
        )}
      </div>

      {/* Submit button */}
      <div className="col-span-1 lg:col-span-2 flex justify-end mt-2">
        <Button onClick={handleSubmit}>Submit Ranking</Button>
      </div>

      {/* Full-size image viewer */}
      {fullSizeImage && (
        <SimpleImageViewer src={fullSizeImage.src} alt={fullSizeImage.alt} onClose={() => setFullSizeImage(null)} />
      )}
    </div>
  )
}
