// lib/export-utils.ts

/**
 * Utility functions for exporting data, specifically handling image paths and extensions.
 */

/**
 * Updates an image path to use the _TIFF suffix and .tiff extension.
 *
 * @param imagePath The original image path (e.g., "images/my_image.png").
 * @returns The updated image path (e.g., "images_TIFF/my_image.tiff").
 */
export function updateImagePathForTiff(imagePath: string): string {
  // Replace .png with .tiff
  let updatedPath = imagePath.replace(/\.png$/i, ".tiff")

  // Add _TIFF suffix to the directory
  updatedPath = updatedPath.replace(/(images)\//i, "$1_TIFF/")

  return updatedPath
}

/**
 * Updates a URL containing an image path to use the _TIFF suffix and .tiff extension.
 *
 * @param imageUrl The original image URL (e.g., "https://example.com/images/my_image.png").
 * @returns The updated image URL (e.g., "https://example.com/images_TIFF/my_image.tiff").
 */
export function updateImageUrlForTiff(imageUrl: string): string {
  // Replace .png with .tiff
  let updatedUrl = imageUrl.replace(/\.png$/i, ".tiff")

  // Add _TIFF suffix to the directory
  updatedUrl = updatedUrl.replace(/(images)\//i, "$1_TIFF/")

  return updatedUrl
}

// Helper function to format rankings data for export
export const formatRankingsForExport = (
  rankings: Record<string, string[]>,
  modelSequences: Record<string, string[]>,
  clinicianId: string,
  clinicianData: any,
  testSequence: number[] = [],
) => {
  // Create a mapping of imageId to question number (1-based index)
  const questionNumberMap: Record<number, number> = {}
  testSequence.forEach((imageId, index) => {
    questionNumberMap[imageId] = index + 1
  })

  const timestamp = new Date().toISOString()

  return Object.entries(rankings).map(([imageId, modelRanking]) => {
    // Get the question number from our mapping (1-based index)
    const questionNumber = questionNumberMap[Number.parseInt(imageId)] || 0

    return {
      clinician_id: clinicianId,
      clinician_name: clinicianData.name || "Anonymous",
      clinician_institution: clinicianData.institution || "Not specified",
      clinician_experience: clinicianData.experience || "unknown",
      clinician_created_at: clinicianData.created_at || timestamp,
      image_id: imageId,
      model_rankings: JSON.stringify(modelRanking),
      model_sequence: JSON.stringify(modelSequences[imageId] || []),
      question_number: questionNumber,
      submitted_at: timestamp,
    }
  })
}

// Helper function to create CSV content
export const createCSVContent = (headers: string[], data: any[]) => {
  // Add question_number to headers if not already present
  if (!headers.includes("question_number")) {
    headers.push("question_number")
  }

  const headerRow = headers.join(",")
  const rows = data.map((item) => {
    return headers
      .map((header) => {
        const value = item[header]
        // Handle strings that might contain commas
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
      .join(",")
  })

  return [headerRow, ...rows].join("\n")
}

// Add this line after the createCSVContent function definition to provide backward compatibility
export const createCSV = createCSVContent

// Helper function to download CSV
export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  // Create a URL for the blob
  const url = URL.createObjectURL(blob)

  // Set link properties
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
  link.style.visibility = "hidden"

  // Append to the document, click, and remove
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Example usage (can be removed in production).
 */
if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest

  it("updateImagePathForTiff should update the image path", () => {
    const originalPath = "images/my_image.png"
    const updatedPath = updateImagePathForTiff(originalPath)
    expect(updatedPath).toBe("images_TIFF/my_image.tiff")

    const originalPath2 = "images/another_image.PNG"
    const updatedPath2 = updateImagePathForTiff(originalPath2)
    expect(updatedPath2).toBe("images_TIFF/another_image.tiff")
  })

  it("updateImageUrlForTiff should update the image URL", () => {
    const originalUrl = "https://example.com/images/my_image.png"
    const updatedUrl = updateImageUrlForTiff(originalUrl)
    expect(updatedUrl).toBe("https://example.com/images_TIFF/my_image.tiff")

    const originalUrl2 = "https://example.com/images/another_image.PNG"
    const updatedUrl2 = updateImageUrlForTiff(originalUrl2)
    expect(updatedUrl2).toBe("https://example.com/images_TIFF/another_image.tiff")
  })
}
