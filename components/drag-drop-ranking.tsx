"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ZoomIn } from "lucide-react"
import { ImageViewer } from "@/components/image-viewer"
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

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

// Component for a single sortable image with integrated magnification
function SortableImage({
  model,
  imageNumber,
  index,
  position,
  id,
  onViewFullSize,
  imageLabel,
  onTapToSwap,
  isSelected,
  onMouseMove,
  onMouseLeave,
  magnifyPosition,
  setImageRef,
  onImageLoad,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  const borderColorClass = getBorderColorClass(position)

  // Get the correct image filename based on model and image number
  const getImageFilename = (model, imageNumber) => {
    if (model === "BBDM") {
      // BBDM uses x_{index}_0.png format (0-indexed)
      return `x_${imageNumber - 1}_0.png`
    } else {
      // Other models use output_{number}.png format (1-indexed)
      return `output_${imageNumber}.png`
    }
  }

  const filename = getImageFilename(model, imageNumber)
  const imageSrc = `https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/${model}/${filename}`

  // Calculate magnifier size for indicator
  const magnifierSize = 150
  const zoomLevel = 3

  // Combine the node refs
  const setRefs = (el) => {
    setNodeRef(el)
    setImageRef(index, el)
  }

  return (
    <div
      ref={setRefs}
      style={style}
      className={cn(
        "transition-all border-2 rounded-md overflow-hidden",
        borderColorClass,
        isDragging ? "opacity-80 scale-105 shadow-lg" : "",
        isSelected ? "ring-2 ring-blue-500 ring-offset-2" : "",
        "cursor-pointer", // Make it look clickable for mobile users
      )}
      onClick={() => onTapToSwap()}
      {...attributes}
      {...listeners}
    >
      {/* Label and zoom button positioned above the image */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-1 bg-black/30">
        <div className="px-2 py-1 text-xs font-medium rounded bg-white/80">{imageLabel}</div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-white/80 hover:bg-white"
          onClick={(e) => {
            e.stopPropagation()
            onViewFullSize()
          }}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative" onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
        <Image
          src={imageSrc || "/placeholder.svg"}
          alt={`Enhanced Image ${imageLabel}`}
          width={500}
          height={300}
          className="w-full h-auto block"
          onLoad={onImageLoad}
          unoptimized
        />

        {/* Magnification indicator */}
        {magnifyPosition && (
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
  )
}

// Fixed rank slot component
function RankSlot({ position, children, isEmpty }) {
  const borderColorClass = getBorderColorClass(position)
  const textColorClass = getTextColorClass(position)
  const bgColorClass = getBgColorClass(position)

  return (
    <div className="flex flex-col space-y-0">
      <div className={cn("p-2 text-center font-medium rounded-t-md", bgColorClass, textColorClass)}>
        Rank {position + 1}
      </div>
      <div
        className={cn(
          "border-2 border-dashed rounded-b-md transition-all",
          isEmpty ? "bg-transparent" : "bg-transparent",
          isEmpty ? "border-gray-300" : borderColorClass,
          isEmpty ? "min-h-[200px]" : "",
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function DragDropRanking({ inputImage, models, onSubmit, initialRanking }) {
  // State for model order
  const [modelOrder, setModelOrder] = useState([])
  const [viewingImage, setViewingImage] = useState(null)
  // Map to keep track of original image labels (A, B, C, etc.)
  const [imageLabels, setImageLabels] = useState({})
  // State for tap-to-swap functionality
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  // State to track if component is mounted (client-side)
  const [isMounted, setIsMounted] = useState(false)
  // State to track if we're on mobile
  const [isMobile, setIsMobile] = useState(false)
  // State for magnification
  const [magnifyPosition, setMagnifyPosition] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState(null)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)

  // Refs for images
  const imageRefs = useRef(new Array(5).fill(null))

  const { toast } = useToast()

  // Initialize sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

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

  // Initialize or randomize models when input image changes
  useEffect(() => {
    let newModelOrder = []

    // If no WIP, check for initial ranking
    if (initialRanking) {
      newModelOrder = initialRanking
    }

    // If still no order, randomize
    if (newModelOrder.length === 0) {
      newModelOrder = [...models].sort(() => 0.5 - Math.random())
    }

    setModelOrder(newModelOrder)

    // Create image labels (A, B, C, etc.) for each model
    const labels = {}
    newModelOrder.forEach((model, idx) => {
      labels[model] = String.fromCharCode(65 + idx) // A, B, C, etc.
    })
    setImageLabels(labels)
  }, [inputImage, models, initialRanking])

  // Handle image load
  const handleImageLoad = () => {
    setLoadedCount((prev) => {
      const newCount = prev + 1
      if (newCount >= 5) {
        setImagesLoaded(true)
      }
      return newCount
    })
  }

  // Set image ref safely
  const setImageRef = (index, el) => {
    imageRefs.current[index] = el
  }

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      // Get the old and new indices
      const oldIndex = modelOrder.findIndex((id) => id === active.id)
      const newIndex = modelOrder.findIndex((id) => id === over.id)

      // Update model order
      setModelOrder(arrayMove(modelOrder, oldIndex, newIndex))
    }
  }

  // Handle tap-to-swap functionality
  const handleTapToSwap = (index) => {
    if (selectedImageIndex === null) {
      // First image selected
      setSelectedImageIndex(index)
    } else if (selectedImageIndex === index) {
      // Same image tapped twice, deselect it
      setSelectedImageIndex(null)
    } else {
      // Second image selected, swap them
      const newOrder = [...modelOrder]
      const temp = newOrder[selectedImageIndex]
      newOrder[selectedImageIndex] = newOrder[index]
      newOrder[index] = temp
      setModelOrder(newOrder)
      setSelectedImageIndex(null) // Clear selection after swap
    }
  }

  // Handle submission
  const handleSubmit = () => {
    onSubmit(modelOrder)
  }

  // Handle full-size image view
  const handleViewFullImage = (model, index) => {
    let filename
    if (model === "BBDM") {
      // BBDM uses x_{index}_0.png format (0-indexed)
      filename = `x_${inputImage - 1}_0.png`
    } else {
      // Other models use output_{number}.png format (1-indexed)
      filename = `output_${inputImage}.png`
    }

    setViewingImage({
      src: `https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/${model}/${filename}`,
      alt: `Enhanced Image ${imageLabels[model]}`,
    })
  }

  // Precise mouse move handler with pixel-perfect accuracy
  const handleMouseMove = (event, index) => {
    try {
      const img = imageRefs.current[index]
      if (!img) return

      const rect = img.getBoundingClientRect()

      // Calculate position relative to the image element
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Convert to normalized coordinates (0-1)
      const normalizedX = x / rect.width
      const normalizedY = y / rect.height

      // Only set position if within bounds (0-1)
      if (normalizedX >= 0 && normalizedX <= 1 && normalizedY >= 0 && normalizedY <= 1) {
        setMagnifyPosition({ x: normalizedX, y: normalizedY })
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

  // Calculate magnifier size and zoom level
  const magnifierSize = 150
  const zoomLevel = 3

  // Don't render anything during SSR
  if (!isMounted) {
    return <div className="min-h-[200px] bg-gray-50 rounded-md flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={modelOrder}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, slotIndex) => {
              const model = modelOrder[slotIndex]

              return (
                <RankSlot key={slotIndex} position={slotIndex} isEmpty={!model}>
                  {model && (
                    <SortableImage
                      id={model}
                      model={model}
                      imageNumber={inputImage}
                      index={slotIndex}
                      position={slotIndex}
                      onViewFullSize={() => handleViewFullImage(model, slotIndex)}
                      imageLabel={imageLabels[model]}
                      onTapToSwap={() => handleTapToSwap(slotIndex)}
                      isSelected={selectedImageIndex === slotIndex}
                      onMouseMove={(e) => handleMouseMove(e, slotIndex)}
                      onMouseLeave={handleMouseLeave}
                      magnifyPosition={activeImageIndex === slotIndex ? magnifyPosition : null}
                      setImageRef={setImageRef}
                      onImageLoad={handleImageLoad}
                    />
                  )}
                </RankSlot>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      {selectedImageIndex !== null && (
        <div className="text-center p-2 bg-blue-50 rounded-md text-blue-700 text-sm">
          Now tap another image to swap positions, or tap the same image again to cancel.
        </div>
      )}

      {/* Magnification row - only show when hovering */}
      {magnifyPosition && imagesLoaded && (
        <div className="grid grid-cols-5 gap-2 mt-4">
          {modelOrder.map((model, idx) => {
            // Get the correct image filename based on model and image number
            const getImageFilename = (model) => {
              if (model === "BBDM") {
                // BBDM uses x_{index}_0.png format (0-indexed)
                return `x_${inputImage - 1}_0.png`
              } else {
                // Other models use output_{number}.png format (1-indexed)
                return `output_${inputImage}.png`
              }
            }

            const filename = getImageFilename(model)
            const imageSrc = `https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/${model}/${filename}`

            return (
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
                  }}
                >
                  <Image
                    src={imageSrc || "/placeholder.svg"}
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
            )
          })}
        </div>
      )}

      <div className="flex justify-between items-center pt-2">
        <div className="text-sm text-muted-foreground">
          {isMobile
            ? "Tap images to select and swap positions"
            : "Drag to reorder images from best (left) to worst (right)"}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit}>Submit Ranking</Button>
        </div>
      </div>

      {viewingImage && (
        <ImageViewer
          src={viewingImage.src || "/placeholder.svg"}
          alt={viewingImage.alt}
          isOpen={!!viewingImage}
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  )
}
