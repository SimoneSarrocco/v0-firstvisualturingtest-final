"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface ImageViewerProps {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
}

export function ImageViewer({ src, alt, isOpen, onClose }: ImageViewerProps) {
  const [isMounted, setIsMounted] = useState(false)

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

  // Don't render anything during SSR or if dialog is not open
  if (!isMounted || !isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90" onClick={onClose}>
      <div className="relative max-w-[90vw] max-h-[90vh]">
        <button
          className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 bg-white rounded-full"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>

        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain"
          style={{
            display: "block",
            margin: "0 auto",
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}
