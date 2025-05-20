"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface ImageComparisonSliderProps {
  beforeImage: string
  afterImage: string
  sliderPosition?: number
}

const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  beforeImage,
  afterImage,
  sliderPosition: initialSliderPosition = 50,
}) => {
  const [sliderPosition, setSliderPosition] = useState(initialSliderPosition)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSliderPosition(initialSliderPosition)
  }, [initialSliderPosition])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = container.offsetWidth
    let newPosition = (x / width) * 100

    if (newPosition < 0) newPosition = 0
    if (newPosition > 100) newPosition = 100

    setSliderPosition(newPosition)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    handleMouseMove(e) // Update position immediately on mouse down
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: "ew-resize" }}
    >
      <div className="absolute top-0 left-0 w-full h-full">
        <img
          src={beforeImage.replace(".png", "_TIFF.tiff") || "/placeholder.svg"}
          alt="Before"
          className="w-full h-full object-cover"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        />
      </div>
      <div className="absolute top-0 left-0 w-full h-full">
        <img
          src={afterImage.replace(".png", "_TIFF.tiff") || "/placeholder.svg"}
          alt="After"
          className="w-full h-full object-cover"
          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
        />
      </div>
      <div
        className="absolute top-0 h-full bg-white w-[2px] transform -translate-x-1/2"
        style={{ left: `${sliderPosition}%` }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-md cursor-ew-resize z-10"
        style={{ left: `${sliderPosition}%` }}
      ></div>
    </div>
  )
}

export default ImageComparisonSlider
