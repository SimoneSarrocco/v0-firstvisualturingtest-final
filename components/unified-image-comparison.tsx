"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ZoomIn, ArrowUp, ArrowDown } from "lucide-react"
import { ImageViewer } from "@/components/image-viewer"
import { cn } from "@/lib/utils"

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

interface UnifiedImageComparisonProps {
  inputImage: number
  models: string[]
  onSubmit: (ranking: string[]) => void
  initialRanking?: string[] | null
}

export function UnifiedImageComparison({ inputImage, models, onSubmit, initialRanking }: UnifiedImageComparisonProps) {
  // State for model order/ranking
  const [modelRanking, setModelRanking] = useState<string[]>([])
  const [viewingFullImage, setViewingFullImage] = useState<{ src: string; alt: string } | null>(null)
  const [imageLabels, setImageLabels] = useState<Record<string, string>>({})
  const [isMounted, setIsMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // State for synchronized magnification
  const [magnifyPosition, setMagnifyPosition] = useState<{ x: number; y: number } | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null)

  // Refs for all images (original + models)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageContainersRef = useRef<(HTMLDivElement | null)[]>([])
  const imageRefs = useRef<(HTMLImageElement | null)[]>([])

  // Check if we're on client-side and set up window resize listener
  useEffect(() => {
    setIsMounted(true)

    // Check if we're on mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    // Initial check
    checkIfMobile()

    // Set up listener for window resize
    window.addEventListener("resize", checkIfMobile)

    // Clean up
    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
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

    // Create image labels (A, B, C, etc.) for each model
    const labels: Record<string, string> = {}
    models.forEach((model, idx) => {
      labels[model] = String.fromCharCode(65 + idx) // A, B, C, etc.
    })
    setImageLabels(labels)
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

  // Handle mouse move for magnification
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>, index: number) => {
    try {
      const container = imageContainersRef.current[index]
      if (!container) return

      const rect = container.getBoundingClientRect()

      // Calculate position relative to the container
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height

      // Only set position if within bounds (0-1)
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        setMagnifyPosition({ x, y })
        setActiveImageIndex(index)
      } else {
        setMagnifyPosition(null)
        setActiveImageIndex(null)
      }
    } catch (err) {
      console.error("Error in mouse move handler:", err)
      setMagnifyPosition(null)
      setActiveImageIndex(null)
    }
  }

  // Handle mouse leave
  const handleMouseLeave = () => {
    setMagnifyPosition(null)
    setActiveImageIndex(null)
  }

  // View full-size image
  const handleViewFullImage = (model: string | null, label: string) => {
    setViewingFullImage({
      src: getImageSrc(model),
      alt: model === null ? "Original OCT image" : `Enhanced Image ${label}`,
    })
  }

  // Move model up in ranking (better)
  const moveUp = (index: number) => {
    if (index <= 0) return // Already at the top

    const newRanking = [...modelRanking]
    const temp = newRanking[index]
    newRanking[index] = newRanking[index - 1]
    newRanking[index - 1] = temp
    setModelRanking(newRanking)
  }

  // Move model down in ranking (worse)
  const moveDown = (index: number) => {
    if (index >= modelRanking.length - 1) return // Already at the bottom

    const newRanking = [...modelRanking]
    const temp = newRanking[index]
    newRanking[index] = newRanking[index + 1]
    newRanking[index + 1] = temp
    setModelRanking(newRanking)
  }

  // Handle submission
  const handleSubmit = () => {
    onSubmit(modelRanking)
  }

  // Calculate magnifier size and zoom level
  const magnifierSize = 150
  const zoomLevel = 3

  // Don't render anything during SSR
  if (!isMounted) {
    return <div className="min-h-[200px] bg-gray-50 rounded-md flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="space-y-6" ref={containerRef}>
      {/* Original image */}
      <div className="mb-4">
        <h3 className="font-medium mb-2">Original Image:</h3>
        <div
          className="relative border border-gray-300 rounded-md overflow-hidden mx-auto"
          style={{ maxWidth: "500px", height: "400px" }}
          ref={(el) => (imageContainersRef.current[0] = el)}
          onMouseMove={(e) => handleMouseMove(e, 0)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-1 bg-black/30">
            <div className="px-2 py-1 text-xs font-medium rounded bg-white/80">Original</div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-white/80 hover:bg-white"
              onClick={() => handleViewFullImage(null, "Original")}
              type="button"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-full h-full flex items-center justify-center">
            <Image
              src={getImageSrc(null) || "/placeholder.svg"}
              alt="Original OCT image"
              width={500}
              height={300}
              className="w-full h-full object-contain"
              ref={(el) => (imageRefs.current[0] = el)}
              unoptimized
            />
          </div>

          {/* Magnification indicator */}
          {magnifyPosition && activeImageIndex === 0 && (
            <div
              className="absolute border-2 border-blue-500 rounded-full pointer-events-none"
              style={{
                width: `${magnifierSize / zoomLevel}px`,
                height: `${magnifierSize / zoomLevel}px`,
                left: `${magnifyPosition.x * 100}%`,
                top: `${magnifyPosition.y * 100}%`,
                transform: `translate(-50%, -50%)`,
              }}
            />
          )}
        </div>
      </div>

      {/* Enhanced images with ranking */}
      <div>
        <h3 className="font-medium mb-2">Enhanced Images - Rank from Best (1) to Worst (5):</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {modelRanking.map((model, index) => {
            const label = imageLabels[model] || String.fromCharCode(65 + models.indexOf(model))
            const borderColorClass = getBorderColorClass(index)
            const bgColorClass = getBgColorClass(index)
            const textColorClass = getTextColorClass(index)

            return (
              <div key={model} className="flex flex-col">
                <div className={cn("p-2 text-center font-medium rounded-t-md", bgColorClass, textColorClass)}>
                  Rank {index + 1}
                </div>
                <div
                  className={cn("relative border-2 rounded-b-md overflow-hidden", borderColorClass)}
                  style={{ height: "400px" }}
                  ref={(el) => (imageContainersRef.current[index + 1] = el)}
                  onMouseMove={(e) => handleMouseMove(e, index + 1)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-1 bg-black/30">
                    <div className="px-2 py-1 text-xs font-medium rounded bg-white/80">{label}</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white/80 hover:bg-white"
                      onClick={() => handleViewFullImage(model, label)}
                      type="button"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="w-full h-full flex items-center justify-center">
                    <Image
                      src={getImageSrc(model) || "/placeholder.svg"}
                      alt={`Enhanced Image ${label}`}
                      width={500}
                      height={300}
                      className="w-full h-full object-contain"
                      style={{ transform: "scale(1.05)" }} // Slightly increase size to match original
                      ref={(el) => (imageRefs.current[index + 1] = el)}
                      unoptimized
                    />
                  </div>

                  {/* Magnification indicator */}
                  {magnifyPosition && activeImageIndex === index + 1 && (
                    <div
                      className="absolute border-2 border-blue-500 rounded-full pointer-events-none"
                      style={{
                        width: `${magnifierSize / zoomLevel}px`,
                        height: `${magnifierSize / zoomLevel}px`,
                        left: `${magnifyPosition.x * 100}%`,
                        top: `${magnifyPosition.y * 100}%`,
                        transform: `translate(-50%, -50%)`,
                      }}
                    />
                  )}

                  {/* Ranking controls */}
                  <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center items-center p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white/80 hover:bg-white mb-1"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      type="button"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white/80 hover:bg-white"
                      onClick={() => moveDown(index)}
                      disabled={index === modelRanking.length - 1}
                      type="button"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Magnification row - only show when hovering */}
      {magnifyPosition !== null && (
        <div className="grid grid-cols-6 gap-2 mt-4">
          {/* Original image magnification */}
          <div
            className="relative border-2 border-blue-500 rounded-md overflow-hidden bg-black"
            style={{
              width: `${magnifierSize}px`,
              height: `${magnifierSize}px`,
            }}
          >
            <div
              className="absolute"
              style={{
                width: `${magnifierSize * zoomLevel}px`,
                height: `${magnifierSize * zoomLevel}px`,
                left: `${-magnifyPosition.x * magnifierSize * zoomLevel + magnifierSize / 2}px`,
                top: `${-magnifyPosition.y * magnifierSize * zoomLevel + magnifierSize / 2}px`,
              }}
            >
              <Image
                src={getImageSrc(null) || "/placeholder.svg"}
                alt="Magnified original OCT image"
                width={magnifierSize * zoomLevel}
                height={magnifierSize * zoomLevel}
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="absolute top-1 left-1 bg-white/80 px-1 py-0.5 text-xs font-medium rounded">Original</div>
          </div>

          {/* Enhanced images magnification */}
          {modelRanking.map((model, idx) => (
            <div
              key={`mag-${model}`}
              className="relative border-2 border-blue-500 rounded-md overflow-hidden bg-black"
              style={{
                width: `${magnifierSize}px`,
                height: `${magnifierSize}px`,
              }}
            >
              <div
                className="absolute"
                style={{
                  width: `${magnifierSize * zoomLevel}px`,
                  height: `${magnifierSize * zoomLevel}px`,
                  left: `${-magnifyPosition.x * magnifierSize * zoomLevel + magnifierSize / 2}px`,
                  top: `${-magnifyPosition.y * magnifierSize * zoomLevel + magnifierSize / 2}px`,
                  transform: "scale(1.05)", // Apply same scale as main image
                }}
              >
                <Image
                  src={getImageSrc(model) || "/placeholder.svg"}
                  alt={`Magnified enhanced image ${imageLabels[model]}`}
                  width={magnifierSize * zoomLevel}
                  height={magnifierSize * zoomLevel}
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="absolute top-1 left-1 bg-white/80 px-1 py-0.5 text-xs font-medium rounded">
                {imageLabels[model]}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={handleSubmit}>Submit Ranking</Button>
      </div>

      {/* Full-size image viewer */}
      {viewingFullImage && (
        <ImageViewer
          src={viewingFullImage.src || "/placeholder.svg"}
          alt={viewingFullImage.alt}
          isOpen={!!viewingFullImage}
          onClose={() => setViewingFullImage(null)}
        />
      )}
    </div>
  )
}
