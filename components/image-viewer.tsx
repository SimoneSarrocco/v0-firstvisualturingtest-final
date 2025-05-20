"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X } from "lucide-react"

interface ImageViewerProps {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
}

export function ImageViewer({ src, alt, isOpen, onClose }: ImageViewerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle direct click on the image to close
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  if (!mounted) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black border-0"
        onClick={handleImageClick}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <button
            className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
          <div className="w-full h-full flex items-center justify-center">
            <Image
              src={src || "/placeholder.svg"}
              alt={alt}
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain"
              unoptimized
              priority
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
