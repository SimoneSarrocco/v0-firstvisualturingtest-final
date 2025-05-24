"use client"

import type React from "react"
import { useState, useEffect } from "react"
import ReactCompareImage from "react-compare-image"

interface UnifiedImageComparisonProps {
  inputImage: number
  model: string
}

const UnifiedImageComparison: React.FC<UnifiedImageComparisonProps> = ({ inputImage, model }) => {
  const [beforeImage, setBeforeImage] = useState<string | null>(null)
  const [afterImage, setAfterImage] = useState<string | null>(null)

  const getImageSrc = (inputImage: number, model: string) => {
    if (model === "TARGET") {
      return `/targets/${inputImage}.png`
    }

    // For other models, use the existing TIFF logic
    const folderName = `${model}_TIFF`
    return `/${folderName}/${inputImage}.tiff`
  }

  useEffect(() => {
    const beforeSrc = getImageSrc(inputImage, "INPUT")
    const afterSrc = getImageSrc(inputImage, model)

    setBeforeImage(beforeSrc)
    setAfterImage(afterSrc)
  }, [inputImage, model])

  if (!beforeImage || !afterImage) {
    return <div>Loading images...</div>
  }

  return <ReactCompareImage leftImage={beforeImage} rightImage={afterImage} />
}

export default UnifiedImageComparison
