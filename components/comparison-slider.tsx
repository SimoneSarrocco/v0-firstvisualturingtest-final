"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ComparisonSliderProps {
  beforeImage: string
  afterImage: string
  beforeAlt: string
  afterAlt: string
  className?: string
}

export function ComparisonSlider({ beforeImage, afterImage, beforeAlt, afterAlt, className }: ComparisonSliderProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle mouse down on slider
  const handleMouseDown = () => {
    setIsResizing(true)
  }

  // Handle mouse move
  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100))

    setSliderPosition(percent)
  }

  // Handle touch move
  const handleTouchMove = (e: TouchEvent) => {
    if (!isResizing || !containerRef.current || !e.touches[0]) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width))
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100))

    setSliderPosition(percent)
  }

  // Handle mouse up
  const handleMouseUp = () => {
    setIsResizing(false)
  }

  // Add event listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("touchmove", handleTouchMove as any)
      window.addEventListener("mouseup", handleMouseUp)
      window.addEventListener("touchend", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("touchmove", handleTouchMove as any)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchend", handleMouseUp)
    }
  }, [isResizing])

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden rounded-md", className)}
      style={{ aspectRatio: "1/1" }}
    >
      {/* After image (enhanced) - full width */}
      <div className="absolute inset-0 w-full h-full bg-black">
        <Image src={afterImage || "/placeholder.svg"} alt={afterAlt} fill className="object-contain" unoptimized />
      </div>

      {/* Before image (original) - clipped by slider */}
      <div className="absolute inset-0 h-full overflow-hidden bg-black" style={{ width: `${sliderPosition}%` }}>
        <Image
          src={beforeImage || "/placeholder.svg"}
          alt={beforeAlt}
          fill
          className="object-contain"
          style={{ width: `${100 / (sliderPosition / 100)}%` }}
          unoptimized
        />
      </div>

      {/* Slider control */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10"
        style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">Original</div>
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">Enhanced</div>
    </div>
  )
}
