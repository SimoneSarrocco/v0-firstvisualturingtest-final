"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ImageViewer } from "@/components/image-viewer"

interface MagnifierProps {
  inputImage: number
  models: string[]
  onlyOriginal?: boolean
}

export function SynchronizedMagnifier({ inputImage, models, onlyOriginal = false }: MagnifierProps) {
  // State for magnification
  const [magnifyPosition, setMagnifyPosition] = useState<{ x: number; y: number } | null>(null)
  const [viewingFullImage, setViewingFullImage] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRefs = useRef<(HTMLImageElement | null)[]>([])
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)

  // Get the correct image filename based on model and image number
  const getImageFilename = (model: string): string => {
    if (model === "BBDM") {
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
      return `https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/inputs/${inputImage}.png`
    } else {
      // Model image
      const filename = getImageFilename(model)
      return `https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/${model}/${filename}`
    }
  }

  // Handle image load events safely
  const handleImageLoad = () => {
    setLoadedCount((prev) => prev + 1)
  }

  // Check when all images are loaded
  useEffect(() => {
    // Total number of images (original + models)
    const totalImages = onlyOriginal ? 1 : models.length + 1

    if (loadedCount >= totalImages) {
      setImagesLoaded(true)
    }
  }, [loadedCount, models.length, onlyOriginal])

  // Precise mouse move handler with pixel-perfect accuracy
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>, index: number) => {
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
      } else {
        setMagnifyPosition(null)
      }
    } catch (err) {
      console.error("Error in mouse move handler:", err)
      setMagnifyPosition(null)
    }
  }

  // Handle mouse leave
  const handleMouseLeave = () => {
    setMagnifyPosition(null)
  }

  // View full-size image
  const handleViewFullImage = (src: string) => {
    setViewingFullImage(src)
  }

  // Calculate magnifier size and zoom level
  const magnifierSize = 150 // Size of the magnifier in pixels
  const zoomLevel = 3 // How much to zoom in

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Original image (top) */}
      <div
        className="relative border border-gray-300 rounded-md overflow-hidden mx-auto mb-4"
        style={{ width: "100%", maxWidth: "500px" }}
      >
        {/* Label and zoom button positioned above the image */}
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-1 bg-black/30">
          <div className="px-2 py-1 text-xs font-medium rounded bg-white/80">Original</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-white/80 hover:bg-white"
            onClick={() => handleViewFullImage(getImageSrc(null))}
            type="button"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative w-full" onMouseMove={(e) => handleMouseMove(e, 0)} onMouseLeave={handleMouseLeave}>
          <Image
            src={getImageSrc(null) || "/placeholder.svg"}
            alt={`Original OCT image ${inputImage}`}
            width={500}
            height={300}
            className="w-full h-auto object-contain"
            ref={(el) => {
              imageRefs.current[0] = el
            }}
            onLoad={handleImageLoad}
            unoptimized
            style={{ display: "block" }}
          />

          {/* Magnification indicator on original image */}
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

      {/* Enhanced images (single row) - only if not onlyOriginal */}
      {!onlyOriginal && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {models.map((model, idx) => (
            <div key={model} className="relative border border-gray-300 rounded-md overflow-hidden">
              {/* Label and zoom button positioned above the image */}
              <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-1 bg-black/30">
                <div className="px-2 py-1 text-xs font-medium rounded bg-white/80">{String.fromCharCode(65 + idx)}</div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-white/80 hover:bg-white"
                  onClick={() => handleViewFullImage(getImageSrc(model))}
                  type="button"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              <div
                className="relative w-full"
                onMouseMove={(e) => handleMouseMove(e, idx + 1)}
                onMouseLeave={handleMouseLeave}
              >
                <Image
                  src={getImageSrc(model) || "/placeholder.svg"}
                  alt={`Enhanced image ${String.fromCharCode(65 + idx)}`}
                  width={500}
                  height={300}
                  className="w-full h-auto object-contain"
                  ref={(el) => {
                    imageRefs.current[idx + 1] = el
                  }}
                  onLoad={handleImageLoad}
                  unoptimized
                  style={{ display: "block" }}
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
          ))}
        </div>
      )}

      {/* Magnification row - only show when hovering */}
      {magnifyPosition && imagesLoaded && (
        <div className="grid grid-cols-6 gap-2 mt-4">
          {/* Original image magnification */}
          <div
            className="relative border-2 border-blue-500 rounded-md overflow-hidden bg-black"
            style={{
              width: `${magnifierSize}px`,
              height: `${magnifierSize}px`,
            }}
          >
            {imageRefs.current[0] && (
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
            )}
            <div className="absolute top-1 left-1 bg-white/80 px-1 py-0.5 text-xs font-medium rounded">Original</div>
          </div>

          {/* Enhanced images magnification */}
          {!onlyOriginal &&
            models.map((model, idx) => (
              <div
                key={`mag-${model}`}
                className="relative border-2 border-blue-500 rounded-md overflow-hidden bg-black"
                style={{
                  width: `${magnifierSize}px`,
                  height: `${magnifierSize}px`,
                }}
              >
                {imageRefs.current[idx + 1] && (
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
                      src={getImageSrc(model) || "/placeholder.svg"}
                      alt={`Magnified enhanced image ${String.fromCharCode(65 + idx)}`}
                      width={magnifierSize * zoomLevel}
                      height={magnifierSize * zoomLevel}
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="absolute top-1 left-1 bg-white/80 px-1 py-0.5 text-xs font-medium rounded">
                  {String.fromCharCode(65 + idx)}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Full-size image viewer */}
      {viewingFullImage && (
        <ImageViewer
          src={viewingFullImage || "/placeholder.svg"}
          alt="Full-size OCT image"
          isOpen={!!viewingFullImage}
          onClose={() => setViewingFullImage(null)}
        />
      )}
    </div>
  )
}
