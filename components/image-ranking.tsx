"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ZoomIn } from "lucide-react"
import { ImageViewer } from "@/components/image-viewer"
import { cn } from "@/lib/utils"

// Helper function to get the correct image filename based on model and image number
const getImageFilename = (model: string, imageNumber: number): string => {
  if (model === "BBDM") {
    // BBDM uses x_{index}_0.png format (0-indexed)
    return `x_${imageNumber - 1}_0.png`
  } else {
    // Other models use output_{number}.png format (1-indexed)
    return `output_${imageNumber}.png`
  }
}

interface ModelImageProps {
  model: string
  imageNumber: number
  index: number
  rank: number | null
  onRankChange: (modelIndex: number, rank: number) => void
  onViewFullSize: () => void
  usedRanks: number[]
}

// Component for a single model image with ranking buttons
const ModelImage = ({ model, imageNumber, index, rank, onRankChange, onViewFullSize, usedRanks }: ModelImageProps) => {
  const filename = getImageFilename(model, imageNumber)

  return (
    <Card className="overflow-hidden mb-4">
      <div className="p-3 flex justify-between items-center bg-muted">
        <div className="font-medium">Image {String.fromCharCode(65 + index)}</div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((rankValue) => {
            const isSelected = rank === rankValue
            const isDisabled = usedRanks.includes(rankValue) && !isSelected

            return (
              <Button
                key={rankValue}
                size="sm"
                variant="outline"
                className={cn(
                  "w-9 h-9 rounded-full p-0",
                  isDisabled && "opacity-50 cursor-not-allowed",
                  !isSelected && !isDisabled && `rank-button-${rankValue}`,
                  isSelected && `rank-button-selected-${rankValue}`,
                )}
                onClick={() => !isDisabled && onRankChange(index, rankValue)}
                disabled={isDisabled}
              >
                {rankValue}
                {isSelected && <span className="sr-only">(Selected)</span>}
              </Button>
            )
          })}
        </div>
      </div>
      <div className="relative group">
        <div className="relative w-full" style={{ aspectRatio: "768/496" }}>
          <Image
            src={`https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/${model}/${filename}`}
            alt={`Enhanced Vitreous OCT Image ${String.fromCharCode(65 + index)}`}
            fill
            className="object-contain"
            onDoubleClick={onViewFullSize}
          />
        </div>
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 bg-black/50 hover:bg-black/70"
          onClick={onViewFullSize}
        >
          <ZoomIn className="h-4 w-4 text-white" />
        </Button>
      </div>
    </Card>
  )
}

interface ImageRankingProps {
  inputImage: number
  models: string[]
  onSubmit: (modelOrder: string[]) => void
  initialRanking: string[] | null
}

export function ImageRanking({ inputImage, models, onSubmit, initialRanking }: ImageRankingProps) {
  // Randomize model order for each question
  const [modelOrder, setModelOrder] = useState<string[]>([])
  const [modelRanks, setModelRanks] = useState<(number | null)[]>([])
  const [viewingImage, setViewingImage] = useState<{ src: string; alt: string } | null>(null)
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false)

  // Initialize or randomize models when input image changes
  useEffect(() => {
    if (initialRanking) {
      // If we have initial rankings, use those
      setModelOrder(initialRanking)
      setModelRanks(initialRanking.map((_, i) => i + 1))
      setIsSubmitEnabled(true)
    } else {
      // Otherwise randomize
      const shuffled = [...models].sort(() => 0.5 - Math.random())
      setModelOrder(shuffled)
      setModelRanks(Array(shuffled.length).fill(null))
      setIsSubmitEnabled(false)
    }
  }, [inputImage, models, initialRanking])

  // Get array of ranks that are already used
  const usedRanks = modelRanks.filter((rank) => rank !== null) as number[]

  // Handle rank change for a model
  const handleRankChange = (modelIndex: number, rank: number) => {
    const newRanks = [...modelRanks]

    // If this rank is already assigned to another model, clear that assignment
    const existingIndex = newRanks.findIndex((r) => r === rank)
    if (existingIndex !== -1 && existingIndex !== modelIndex) {
      newRanks[existingIndex] = null
    }

    newRanks[modelIndex] = rank
    setModelRanks(newRanks)

    // Enable submit if all models have ranks
    setIsSubmitEnabled(!newRanks.includes(null))
  }

  // Handle submission
  const handleSubmit = () => {
    // Create an array of model names ordered by rank
    const rankedModels = modelRanks
      .map((rank, index) => ({ model: modelOrder[index], rank }))
      .sort((a, b) => (a.rank || 999) - (b.rank || 999))
      .map((item) => item.model)

    onSubmit(rankedModels)
  }

  // Handle full-size image view
  const handleViewFullSize = (model: string, index: number) => {
    const filename = getImageFilename(model, inputImage)
    setViewingImage({
      src: `https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/${model}/${filename}`,
      alt: `Enhanced Vitreous OCT Image ${String.fromCharCode(65 + index)}`,
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {modelOrder.map((model, index) => (
          <ModelImage
            key={model}
            model={model}
            imageNumber={inputImage}
            index={index}
            rank={modelRanks[index]}
            onRankChange={handleRankChange}
            onViewFullSize={() => handleViewFullSize(model, index)}
            usedRanks={usedRanks}
          />
        ))}
      </div>

      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-muted-foreground">
          Assign a rank from 1 (best) to 5 (worst) for each enhanced image
        </div>
        <Button onClick={handleSubmit} disabled={!isSubmitEnabled}>
          Submit Ranking
        </Button>
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
