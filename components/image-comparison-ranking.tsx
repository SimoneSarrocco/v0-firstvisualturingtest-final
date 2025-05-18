"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ZoomIn } from "lucide-react"
import { cn } from "@/lib/utils"

// Helper function to get border color class based on rank position
const getBorderColorClass = (position: number): string => {
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

interface ImageComparisonRankingProps {
  inputImage: number
  models: string[]
  onSubmit: (ranking: string[]) => void
  initialRanking?: string[] | null
}

export function ImageComparisonRanking({ inputImage, models, onSubmit, initialRanking }: ImageComparisonRankingProps) {
  // State for model order/ranking
  const [modelRanking, setModelRanking] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [draggedModel, setDraggedModel] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [fullSizeImage, setFullSizeImage] = useState<{ src: string; alt: string } | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  // Store the initial order to keep track of original letters
  const [initialOrder, setInitialOrder] = useState<string[]>([])
  // Map to store the letter for each model
  const [modelLetters, setModelLetters] = useState<Record<string, string>>({})

  // Check if we're on client-side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize model ranking and letters
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
    setInitialOrder([...newRanking])

    // Assign letters A-E to models based on initial position
    const letters: Record<string, string> = {}
    newRanking.forEach((model, index) => {
      letters[model] = String.fromCharCode(65 + index) // A, B, C, etc.
    })
    setModelLetters(letters)

    // Set the first model as selected by default
    if (newRanking.length > 0) {
      setSelectedModel(newRanking[0])
    }
  }, [inputImage, models, initialRanking])

  // Get the correct image filename based on model and image number
  const getImageFilename = (model: string | null): string => {
    if (model === null) {
      // Input image
      return `${inputImage}.jpg`
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

  // Handle drag start
  const handleDragStart = (model: string) => {
    setDraggedModel(model)
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  // Handle drop to comparison area
  const handleDropToComparison = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedModel) {
      setSelectedModel(draggedModel)
      setDraggedModel(null)
    }
  }

  // Handle drop to reorder
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()

    if (draggedModel) {
      const draggedIndex = modelRanking.indexOf(draggedModel)
      if (draggedIndex !== -1 && draggedIndex !== index) {
        const newRanking = [...modelRanking]
        newRanking.splice(draggedIndex, 1)
        newRanking.splice(index, 0, draggedModel)
        setModelRanking(newRanking)
      }
      setDraggedModel(null)
      setDragOverIndex(null)
    }
  }

  // Handle click on model image
  const handleModelClick = (model: string) => {
    setSelectedModel(model)
  }

  // View full-size image
  const handleViewFullImage = (model: string | null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setFullSizeImage({
      src: getImageSrc(model),
      alt: model ? `Enhanced Image ${modelLetters[model]}` : "Low-quality OCT image",
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
    <div className="flex flex-col space-y-3">
      {/* Main comparison area */}
      <div className="flex flex-col md:flex-row gap-4 mb-2">
        {/* Original image on the left */}
        <div className="w-full md:w-1/2 space-y-1">
          <h3 className="font-medium">Low-quality OCT Image:</h3>
          <div
            className="relative border border-gray-300 rounded-md overflow-hidden cursor-pointer bg-black"
            onClick={() => handleViewFullImage(null)}
            style={{ height: "496px" }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <Image
                src={getImageSrc(null) || "/placeholder.svg"}
                alt="Low-quality OCT image"
                width={768}
                height={496}
                className="max-h-full w-auto"
                unoptimized
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white"
              onClick={(e) => handleViewFullImage(null, e)}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Selected model image on the right */}
        <div
          className="w-full md:w-1/2 space-y-1 border-2 border-dashed border-gray-300 rounded-md p-2"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropToComparison}
        >
          <h3 className="font-medium">
            {selectedModel
              ? `Selected Enhanced Image (${modelLetters[selectedModel]}):`
              : "Drag an image here to compare:"}
          </h3>
          {selectedModel ? (
            <div
              className="relative border border-gray-300 rounded-md overflow-hidden cursor-pointer bg-black"
              onClick={() => handleViewFullImage(selectedModel)}
              style={{ height: "496px" }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <Image
                  src={getImageSrc(selectedModel) || "/placeholder.svg"}
                  alt={`Enhanced Image ${modelLetters[selectedModel]}`}
                  width={768}
                  height={496}
                  className="max-h-full w-auto"
                  unoptimized
                />
              </div>
              <div className="absolute top-1 left-1 bg-white/80 px-1 py-0.5 text-xs font-medium rounded">
                {modelLetters[selectedModel]}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white"
                onClick={(e) => handleViewFullImage(selectedModel, e)}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[496px] bg-gray-50 rounded-md">
              <p className="text-gray-500">Drag an image here to compare</p>
            </div>
          )}
        </div>
      </div>

      {/* Model ranking area at the bottom */}
      <div className="space-y-1">
        <h3 className="font-medium">Rank AI-generated Enhanced Images:</h3>
        <p className="text-sm text-gray-500 mb-2">
          Drag images to reorder from best (left) to worst (right). Click any image to view it in the comparison area.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {modelRanking.map((model, index) => {
            const borderColorClass = getBorderColorClass(index)
            const bgColorClass = getBgColorClass(index)
            const textColorClass = getTextColorClass(index)
            const isDragging = draggedModel === model
            const isDragOver = dragOverIndex === index

            return (
              <div
                key={model}
                className="flex flex-col w-[calc(20%-8px)]"
                draggable
                onDragStart={() => handleDragStart(model)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={() => {
                  setDraggedModel(null)
                  setDragOverIndex(null)
                }}
              >
                <div className={cn("p-1 text-center text-xs font-medium rounded-t-md", bgColorClass, textColorClass)}>
                  Rank {index + 1}
                </div>
                <div
                  className={cn(
                    "relative border-2 rounded-b-md overflow-hidden cursor-pointer transition-all",
                    borderColorClass,
                    isDragging ? "opacity-50" : "opacity-100",
                    isDragOver ? "border-blue-500 border-dashed" : "",
                    selectedModel === model ? "ring-4 ring-purple-500 ring-offset-1" : "",
                  )}
                  onClick={() => handleModelClick(model)}
                >
                  <div className="aspect-[1.55] relative">
                    <Image
                      src={getImageSrc(model) || "/placeholder.svg"}
                      alt={`Enhanced Image ${modelLetters[model]}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="absolute top-1 left-1 bg-white/80 px-1 py-0.5 text-xs font-medium rounded">
                    {modelLetters[model]}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit}>Submit Ranking</Button>
      </div>

      {/* Full-size image dialog */}
      <Dialog open={!!fullSizeImage} onOpenChange={() => setFullSizeImage(null)}>
        <DialogContent
          className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden flex items-center justify-center bg-black border-0 shadow-none"
          onClick={() => setFullSizeImage(null)}
        >
          {fullSizeImage && (
            <div className="relative flex items-center justify-center">
              <Image
                src={fullSizeImage.src || "/placeholder.svg"}
                alt={fullSizeImage.alt}
                width={768}
                height={496}
                className="max-h-[90vh] w-auto"
                onClick={(e) => e.stopPropagation()}
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
