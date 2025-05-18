"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Minus, Plus, X, MoveHorizontal } from "lucide-react"

interface ImageViewerProps {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
}

export function ImageViewer({ src, alt, isOpen, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isMounted, setIsMounted] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)

  // Check if we're on client-side
  useEffect(() => {
    setIsMounted(true)

    // Add escape key handler
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      window.addEventListener("keydown", handleEscape)
    }

    return () => {
      window.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  // Reset zoom and position when image changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [src, isOpen])

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (!e) return
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      setPosition({ x: newX, y: newY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // Extract just the image identifier without model information
  const getImageIdentifier = () => {
    // Remove any model information from the alt text
    const cleanedAlt = alt.replace(/^(.*?enhanced image|.*?OCT image)\s*/i, "").trim()
    return cleanedAlt
  }

  // Handle click on the overlay to close
  const handleOverlayClick = () => {
    onClose()
  }

  // Don't render anything during SSR or if dialog is not open
  if (!isMounted || !isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-white" onWheel={handleWheel}>
        <div className="flex justify-between items-center p-2 bg-gray-100 text-gray-900">
          <div className="text-gray-900 font-medium">{getImageIdentifier()}</div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              className="h-8 w-8 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <MoveHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="h-8 w-8 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xs px-2">{Math.round(scale * 100)}%</span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              disabled={scale >= 3}
              className="h-8 w-8 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <DialogClose asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </div>

        {/* Image container */}
        <div
          className="relative overflow-hidden w-full h-[calc(95vh-60px)] bg-white"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleOverlayClick}
        >
          {/* Close overlay - only visible when scale is 1 */}
          {scale === 1 && (
            <div className="absolute inset-0 z-10 cursor-pointer" onClick={() => onClose()} aria-label="Close image" />
          )}

          <div
            ref={imageRef}
            className="absolute top-1/2 left-1/2 transform transition-transform duration-100 ease-out"
            style={{
              transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
            }}
          >
            <Image
              src={src || "/placeholder.svg"}
              alt={alt}
              width={768}
              height={496}
              className="pointer-events-none"
              unoptimized
            />
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-md text-sm">
          Click anywhere to close • Scroll to zoom • Drag to move
        </div>
      </DialogContent>
    </Dialog>
  )
}
