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
      <div className="relative max-w-[90vw] max-h-[90vh]">
        <button
          className="absolute top-2 right-2 z-10 flex items-center justify-center w-8 h-8 bg-white rounded-full"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        <Image
          src={src || "/placeholder.svg"}
          alt={alt}
          width={768}
          height={496}
          className="max-w-full max-h-[90vh] object-contain"
          onClick={(e) => e.stopPropagation()}
          unoptimized
        />
      </div>
    </div>
  )
}
