"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ZoomIn, FlipVerticalIcon as SwapVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { ImageViewer } from "./image-viewer"

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

interface MobileImageComparisonRankingProps {
  inputImage: number
  models: string[]
  onSubmit: (ranking: string[], originalSequence: string[]) => void
  onChange?: (ranking: string[]) => void
  initialRanking?: string[] | null
  initialSequence?: string[] | null
}

export function MobileImageComparisonRanking({
  inputImage,
  models,
  onSubmit,
  onChange,
  initialRanking,
  initialSequence,
}: MobileImageComparisonRankingProps) {
  // State for model order/ranking
  const [modelRanking, setModelRanking] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [fullSizeImage, setFullSizeImage] = useState<{ src: string; alt: string } | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // State for swap functionality
  const [swapSource, setSwapSource] = useState<number | null>(null)
  const [swapMode, setSwapMode] = useState(false)

  // Store the original sequence of models for this question
  const [originalSequence, setOriginalSequence] = useState<string[]>([])

  // Map to store the letter for each model
  const [modelLetters, setModelLetters] = useState<Record<string, string>>({})

  // Track the question id to reset when question changes
  const lastInputImageRef = useRef<number | null>(null)
  const initialRankingRef = useRef<string[] | null>(null)
  const initialSequenceRef = useRef<string[] | null>(null)
  const isInitializedRef = useRef(false)

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

  // Handle click on model image for comparison
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

  // Handle click on letter label for swapping
  const handleLetterClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the parent click handler

    if (swapMode) {
      // If already in swap mode, perform the swap
      if (swapSource !== null && swapSource !== index) {
        const newRanking = [...modelRanking]
        const temp = newRanking[swapSource]
        newRanking[swapSource] = newRanking[index]
        newRanking[index] = temp
        setModelRanking(newRanking)

        // Notify parent of ranking change
        if (onChange) {
          onChange(newRanking)
        }

        // Reset swap mode
        setSwapSource(null)
        setSwapMode(false)
      } else {
        // Clicked on the same item or no source selected
        setSwapSource(null)
        setSwapMode(false)
      }
    } else {
      // Enter swap mode and set this as the source
      setSwapSource(index)
      setSwapMode(true)
    }
  }

  // Cancel swap mode
  const cancelSwap = () => {
    setSwapSource(null)
    setSwapMode(false)
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
    <div className="flex flex-col space-y-3 w-full px-2">
      {/* Instructions - Made more prominent but compact */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-2">
        <p className="text-blue-800 font-medium text-sm">
          Tap an AI-enhanced image to compare it with the low-quality original. Rank the enhanced images from best (1)
          to worst (6) by tapping the letter labels to swap their positions.
        </p>
      </div>

      {/* Main comparison area with dotted border and label - more compact */}
      <div className="relative border-2 border-dashed border-blue-300 rounded-lg p-3 pb-4">
        {/* Comparison Area Label */}
        <div className="absolute -top-3 left-4 bg-white px-2 text-blue-600 font-medium text-sm">Comparison Area</div>

        <div className="flex flex-col gap-3">
          {/* Original image on the top */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Low-quality OCT Image:</h3>
            <div
              className="relative border border-gray-300 rounded-md overflow-hidden cursor-pointer bg-black w-full"
              onClick={() => handleViewFullImage(null)}
              style={{ aspectRatio: "1.55/1" }}
            >
              <Image
                src={getImageSrc(null) || "/placeholder.svg"}
                alt="Low-quality OCT image"
                fill
                style={{ objectFit: "contain" }}
                unoptimized
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation()
                  handleViewFullImage(null, e)
                }}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selected model image on the bottom */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">
              {selectedModel
                ? `Selected Enhanced Image (${modelLetters[selectedModel]}):`
                : "Tap an image below to compare:"}
            </h3>
            {selectedModel ? (
              <div
                className={cn(
                  "relative border-6 rounded-md overflow-hidden cursor-pointer bg-black w-full", // Changed from border-4 to border-6
                  "border-purple-500", // Purple border to match selection
                )}
                onClick={() => handleViewFullImage(selectedModel)}
                style={{ aspectRatio: "1.55/1" }}
              >
                <Image
                  src={getImageSrc(selectedModel) || "/placeholder.svg"}
                  alt={`Enhanced Image ${modelLetters[selectedModel]}`}
                  fill
                  style={{ objectFit: "contain" }}
                  unoptimized
                />
                <div className="absolute top-1 left-1 bg-white/80 px-2 py-1 text-sm font-bold rounded">
                  {modelLetters[selectedModel]}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewFullImage(selectedModel, e)
                  }}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="flex items-center justify-center border border-dashed border-gray-300 rounded-md bg-gray-50 w-full"
                style={{ height: "200px" }}
              >
                <p className="text-gray-500 text-sm">Tap an image below to compare</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Swap mode indicator */}
      {swapMode && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-md p-3 flex items-center justify-between">
          <p className="text-yellow-800 font-medium text-sm">Now tap another letter to swap positions</p>
          <Button variant="outline" size="sm" onClick={cancelSwap}>
            Cancel
          </Button>
        </div>
      )}

      {/* Model ranking area - vertical list for mobile */}
      <div className="space-y-2 mt-2 w-full">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-base">Rank Enhanced Images:</h3>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
          <p className="text-amber-800 font-medium text-sm">
            Tap any image to view it in the comparison area above. Tap one letter and then another to swap their
            positions.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {modelRanking.map((model, index) => {
            const borderColorClass = getBorderColorClass(index)
            const bgColorClass = getBgColorClass(index)
            const textColorClass = getTextColorClass(index)
            const letter = modelLetters[model] || "?"
            const isSelected = swapSource === index

            return (
              <div key={model} className="flex flex-col w-full">
                <div className="p-2 text-center font-semibold rounded-t-md bg-gray-50 text-gray-700 text-sm">
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
                <div
                  className={cn(
                    "border-2 rounded-b-md overflow-hidden",
                    "border-gray-300", // Simple gray border instead of colored ones
                    isSelected ? "ring-4 ring-purple-500 ring-offset-2" : "", // Swap mode selection
                    swapMode && !isSelected ? "opacity-70" : "",
                  )}
                >
                  <div className="flex items-center">
                    {/* Image */}
                    <div
                      className={cn(
                        "relative overflow-hidden flex-grow bg-white",
                        selectedModel === model
                          ? "ring-6 ring-purple-500 ring-offset-2 ring-inset border-4 border-purple-500"
                          : "border border-gray-200", // Much more prominent selection
                      )}
                      style={{ height: "140px" }}
                      onClick={() => handleModelClick(model)}
                    >
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <img
                          src={getImageSrc(model) || "/placeholder.svg"}
                          alt={`Enhanced Image ${letter}`}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>

                      {/* Letter label - primary click target for swapping */}
                      <div
                        className={cn(
                          "absolute top-2 left-2 px-3 py-2 text-sm font-bold rounded cursor-pointer transition-all",
                          isSelected
                            ? "bg-purple-500 text-white scale-110"
                            : "bg-white/90 hover:bg-white hover:scale-105",
                        )}
                        onClick={(e) => handleLetterClick(index, e)}
                      >
                        {letter}
                        {isSelected && <SwapVertical className="h-3 w-3 ml-1 inline" />}
                      </div>

                      {/* Zoom button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 bg-white/80 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewFullImage(model, e)
                        }}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end pt-3 pb-4">
        <Button onClick={handleSubmit} className="w-full py-3 text-base">
          Submit Ranking
        </Button>
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
