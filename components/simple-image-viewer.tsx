"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X } from "lucide-react"

interface SimpleImageViewerProps {
  src: string
  alt: string
  onClose: () => void
}

export function SimpleImageViewer({ src, alt, onClose }: SimpleImageViewerProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Check if we're on client-side
  useEffect(() => {
    setIsMounted(true)

    // Add escape key handler
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [onClose])

  if (!isMounted) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={onClose}>
      <div className="relative">
        <button
          className="absolute top-2 right-2 z-10 flex items-center justify-center w-8 h-8 bg-white rounded-full"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-[768px] h-[496px] relative">
          <Image
            src={src || "/placeholder.svg"}
            alt={alt}
            fill
            className="object-contain"
            onClick={(e) => e.stopPropagation()}
            unoptimized
          />
        </div>
      </div>
    </div>
  )
}
