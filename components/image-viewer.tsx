"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { useDeviceType } from "@/hooks/use-device-type"

interface ImageViewerProps {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
}

export function ImageViewer({ src, alt, isOpen, onClose }: ImageViewerProps) {
  const [loaded, setLoaded] = useState(false)
  const { isMobile, isTablet } = useDeviceType()

  // Handle escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleEsc)
    }

    return () => {
      window.removeEventListener("keydown", handleEsc)
    }
  }, [isOpen, onClose])

  // Handle click outside to close
  const handleBackdropClick = () => {
    onClose()
  }

  // Prevent click on image from closing
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]">
        {/* Close button */}
        <button
          className="absolute top-2 right-2 z-10 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </button>

        {/* Loading indicator */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Image */}
        <div
          className={`relative ${isMobile || isTablet ? "w-[90vw] h-auto" : "w-auto h-auto max-w-[90vw] max-h-[90vh]"}`}
          onClick={handleImageClick}
        >
          <Image
            src={src || "/placeholder.svg"}
            alt={alt}
            width={isMobile || isTablet ? 800 : 1200}
            height={isMobile || isTablet ? 600 : 800}
            className={`object-contain ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
            onLoad={() => setLoaded(true)}
            unoptimized
          />
        </div>
      </div>
    </div>
  )
}
