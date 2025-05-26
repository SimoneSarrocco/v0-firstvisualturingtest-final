"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, InfoIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { ImageViewer } from "./image-viewer"
import { useDeviceType } from "@/hooks/use-device-type"
import { MobileImageComparisonRanking } from "./mobile-image-comparison-ranking"

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
    case 5: // Rank 6 (Worst)
      return "border-red-600"
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
    case 5: // Rank 6 (Worst)
      return "text-red-700"
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
    case 5: // Rank 6 (Worst)
      return "bg-red-100"
    default:
      return "bg-gray-50"
  }
}

// Generate a deterministic random order based on a seed
const getRandomOrder = (array: string[], seed: number): string[] => {
  const newArray = [...array]
  // Simple deterministic shuffle algorithm
  for (let i = newArray.length - 1; i > 0; i--) {
    // Use a deterministic random number based on seed and current index
    const seededRandom = ((seed * (i + 1)) % 233280) / 233280
    const j = Math.floor(seededRandom * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

interface ImageComparisonRankingProps {
  inputImage: number
  models: string[]
  onSubmit: (ranking: string[], originalSequence: string[]) => void
  onChange?: (ranking: string[]) => void
  initialRanking?: string[] | null
  initialSequence?: string[] | null
}

export function ImageComparisonRanking({
  inputImage,
  models,
  onSubmit,
  onChange,
  initialRanking,
  initialSequence,
}: ImageComparisonRankingProps) {
  // State for model order/ranking
  const [modelRanking, setModelRanking] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [draggedModel, setDraggedModel] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [fullSizeImage, setFullSizeImage] = useState<{ src: string; alt: string } | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Store the original sequence of models for this question
  const [originalSequence, setOriginalSequence] = useState<string[]>([])

  // Map to store the letter for each model
  const [modelLetters, setModelLetters] = useState<Record<string, string>>({})

  // Track the question id to reset when question changes
  const lastInputImageRef = useRef<number | null>(null)
  const initialRankingRef = useRef<string[] | null>(null)
  const initialSequenceRef = useRef<string[] | null>(null)
  const isInitializedRef = useRef(false)

  const { isMobile, isTablet, isTouchDevice } = useDeviceType()

  // Check if we're on client-side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Reset when question changes or initialRanking changes
  useEffect(() => {
    if (
      lastInputImageRef.current !== inputImage ||
      JSON.stringify(initialRankingRef.current) !== JSON.stringify(initialRanking) ||
      JSON.stringify(initialSequenceRef.current) !== JSON.stringify(initialSequence)
    ) {
      lastInputImageRef.current = inputImage
      initialRankingRef.current = initialRanking ? [...initialRanking] : null
      initialSequenceRef.current = initialSequence ? [...initialSequence] : null
      isInitializedRef.current = false
    }
  }, [inputImage, initialRanking, initialSequence])

  // Initialize model ranking and letters
  useEffect(() => {
    if (!isInitializedRef.current) {
      let sequence: string[]

      // If we have a saved original sequence, use it
      if (initialSequence && initialSequence.length === models.length) {
        sequence = [...initialSequence]
      } else {
        // Otherwise generate a deterministic random order for this question
        const seed = inputImage * 9301 + 49297
        sequence = getRandomOrder(models, seed)
      }

      // Store the original sequence
      setOriginalSequence(sequence)

      // Assign letters A-F to models based on their position in the original sequence
      const letters: Record<string, string> = {}
      sequence.forEach((model, index) => {
        letters[model] = String.fromCharCode(65 + index) // A, B, C, D, E, F
      })
      setModelLetters(letters)

      // If we have a saved ranking, use it
      if (initialRanking && initialRanking.length === models.length) {
        setModelRanking([...initialRanking])
      } else {
        // Otherwise use the original sequence as the initial ranking
        setModelRanking([...sequence])
      }

      // Set the first model as selected by default
      setSelectedModel(initialRanking ? initialRanking[0] : sequence[0])

      isInitializedRef.current = true
    }
  }, [inputImage, models, initialRanking, initialSequence])

  // Use mobile version for mobile devices or touch devices
  if (isMobile || isTablet || isTouchDevice) {
    return (
      <MobileImageComparisonRanking
        inputImage={inputImage}
        models={models}
        onSubmit={onSubmit}
        onChange={onChange}
        initialRanking={initialRanking}
        initialSequence={initialSequence}
      />
    )
  }

  // Get the correct image filename based on model and image number
  const getImageFilename = (model: string | null): string => {
    if (model === null) {
      // Input image
      return `${inputImage}.png`
    } else if (model === "TARGET") {
      // Target image
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
    } else if (model === "TARGET") {
      // Target image
      return `https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/targets/${getImageFilename(model)}`
    } else {
      // Model image
      return `https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/${model}/${getImageFilename(model)}`
    }
  }

  // Handle drag start - only for the image itself
  const handleDragStart = (e: React.DragEvent, model: string) => {
    // Only allow dragging the image itself, not the container
    if ((e.target as HTMLElement).tagName === "IMG") {
      setDraggedModel(model)
    } else {
      // Prevent dragging if not the image
      e.preventDefault()
    }
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

  // Handle drop to reorder - using direct swap
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()

    if (draggedModel) {
      const sourceIndex = modelRanking.indexOf(draggedModel)

      if (sourceIndex !== -1 && sourceIndex !== targetIndex) {
        // Create a new array with the same items
        const newRanking = [...modelRanking]

        // Get the model at the target position
        const targetModel = newRanking[targetIndex]

        // Perform a direct swap - this ensures only the two items change positions
        newRanking[targetIndex] = draggedModel
        newRanking[sourceIndex] = targetModel

        setModelRanking(newRanking)

        // Notify parent of ranking change
        if (onChange) {
          onChange(newRanking)
        }
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

  // Handle submission - pass both the ranking and original sequence
  const handleSubmit = () => {
    onSubmit(modelRanking, originalSequence)
  }

  // Don't render anything during SSR
  if (!isMounted) {
    return <div className="min-h-[200px] bg-gray-50 rounded-md flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex flex-col space-y-3 w-full">
      {/* Collapsible Instructions - More compact and less intrusive */}
      <div className="mb-3">
        <details className="bg-blue-50 border border-blue-200 rounded-md overflow-hidden">
          <summary className="p-2 font-medium text-blue-700 cursor-pointer hover:bg-blue-100 transition-colors flex items-center">
            <InfoIcon className="h-4 w-4 mr-2" /> Instructions (click to expand)
          </summary>
          <div className="p-3 pt-1 text-sm border-t border-blue-200">
            <ul className="text-blue-800 space-y-2 list-disc list-inside">
              <li>
                Click or drag an AI-enhanced image (from the section below) into the comparison area to compare it with the
                low-quality image.
              </li>
              <li>Rank the enhanced images from best (left) to worst (right) by dragging them into order</li>
              <li>Click "Submit Ranking" when you're satisfied with your ordering</li>
            </ul>
          </div>
        </details>
      </div>

      {/* Main comparison area with dotted border and label - more compact */}
      <div className="relative border-2 border-dashed border-blue-300 rounded-lg p-3 pb-4">
        {/* Comparison Area Label */}
        <div className="absolute -top-3 left-4 bg-white px-2 text-blue-600 font-medium">Comparison Area</div>

        <div className="flex flex-col xl:flex-row justify-center items-center xl:items-start gap-3">
          {/* Original image on the left */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Low-quality OCT Image:</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-gray-100 hover:bg-gray-200"
                onClick={(e) => handleViewFullImage(null, e)}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <div
              className="relative border border-gray-300 rounded-md overflow-hidden cursor-pointer bg-black"
              onClick={() => handleViewFullImage(null)}
              style={{ width: "768px", height: "496px" }}
            >
              {/* Using a regular img tag with fixed dimensions to ensure exact size */}
              <img
                src={getImageSrc(null) || "/placeholder.svg"}
                alt="Low-quality OCT image"
                width="768"
                height="496"
                style={{ width: "768px", height: "496px", objectFit: "none" }}
              />
            </div>
          </div>

          {/* Selected model image on the right */}
          <div className="space-y-1" onDragOver={(e) => e.preventDefault()} onDrop={handleDropToComparison}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">
                {selectedModel
                  ? `Selected Enhanced Image (${modelLetters[selectedModel]}):`
                  : "Drag an image here to compare:"}
              </h3>
              {selectedModel && (
                <div className="flex items-center gap-2">
                  <span className="bg-white px-2 py-1 text-sm font-bold rounded border border-gray-300">
                    {modelLetters[selectedModel]}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-gray-100 hover:bg-gray-200"
                    onClick={(e) => handleViewFullImage(selectedModel, e)}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {selectedModel ? (
              <div
                className="relative rounded-md cursor-pointer bg-black p-1"
                onClick={() => handleViewFullImage(selectedModel)}
                style={{ width: "776px", height: "504px" }}
              >
                {/* Purple highlight border - positioned at the edge of the padding */}
                <div className="absolute inset-0 border-4 border-purple-500 rounded-md pointer-events-none z-10"></div>

                {/* Using a regular img tag with fixed dimensions to ensure exact size */}
                <img
                  src={getImageSrc(selectedModel) || "/placeholder.svg"}
                  alt={`Enhanced Image ${modelLetters[selectedModel]}`}
                  width="768"
                  height="496"
                  className="rounded-sm"
                  style={{ width: "768px", height: "496px", objectFit: "none" }}
                />
              </div>
            ) : (
              <div
                className="flex items-center justify-center border border-dashed border-gray-300 rounded-md bg-gray-50"
                style={{ width: "768px", height: "496px" }}
              >
                <p className="text-gray-500">Drag an image here to compare</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Model ranking area - more compact with less vertical space */}
      <div className="space-y-1 mt-2 w-full">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-base">Rank AI-generated Enhanced Images:</h3>
          {/* Submit button moved to the right side to save vertical space */}
          <Button onClick={handleSubmit} size="sm">
            Submit Ranking
          </Button>
        </div>

        {/* Changed from amber to blue to match instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-2">
          <p className="text-blue-800 font-medium text-sm">
            Drag and drop images to reorder them from best (left) to worst (right). Click any image to view it in full resolution in
            the Comparison Area above. If you are using a touchscreen, just click on the letters of the two images
            you want to swap instead of drag & drop.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {modelRanking.map((model, index) => {
            const borderColorClass = getBorderColorClass(index)
            const bgColorClass = getBgColorClass(index)
            const textColorClass = getTextColorClass(index)
            const isDragging = draggedModel === model
            const isDragOver = dragOverIndex === index
            const letter = modelLetters[model] || "?"
            const isSelected = selectedModel === model

            return (
              <div
                key={model}
                className="flex flex-col w-[calc(16.666%-8px)]" // Changed from 20% to 16.666% for 6 columns
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className="p-1 text-center font-semibold rounded-t-md text-base bg-gray-50 text-gray-700">
                  {index === 0
                    ? "Best"
                    : index === 1
                      ? "2nd Best"
                      : index === 2
                        ? "3rd Best"
                        : index === 3
                          ? "4th Best"
                          : index === 4
                            ? "5th Best"
                            : "Worst"}
                </div>
                <div className="text-center mb-1">
                  <span className="bg-white px-2 py-1 text-sm font-bold rounded border border-gray-300">{letter}</span>
                </div>
                <div
                  className={cn(
                    "relative border-2 rounded-md cursor-pointer transition-all p-1",
                    "border-gray-300", // Simple gray border instead of colored ones
                    isDragging ? "opacity-50" : "opacity-100",
                    isDragOver ? "border-blue-500 border-dashed" : "",
                  )}
                  onClick={() => handleModelClick(model)}
                >
                  <div className="aspect-[1.55] relative">
                    {/* Purple highlight border for selected image - positioned at the edge of the padding */}
                    {isSelected && (
                      <div className="absolute inset-0 border-4 border-purple-500 rounded-md pointer-events-none z-10"></div>
                    )}

                    {/* Make only the image draggable, not the container */}
                    <img
                      src={getImageSrc(model) || "/placeholder.svg"}
                      alt={`Enhanced Image ${letter}`}
                      className="w-full h-full object-cover rounded-sm"
                      draggable
                      onDragStart={(e) => handleDragStart(e, model)}
                      onDragEnd={() => {
                        setDraggedModel(null)
                        setDragOverIndex(null)
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Full-size image viewer */}
      {fullSizeImage && (
        <ImageViewer
          src={fullSizeImage.src || "/placeholder.svg"}
          alt={fullSizeImage.alt}
          isOpen={!!fullSizeImage}
          onClose={() => setFullSizeImage(null)}
        />
      )}
    </div>
  )
}
