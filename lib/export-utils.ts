// Helper function to format rankings data for export
export const formatRankingsForExport = (
  rankings: Record<string, string[]>,
  modelSequences: Record<string, string[]>,
  clinicianId: string,
  clinicianData: any,
) => {
  const now = new Date().toISOString()

  return Object.entries(rankings).map(([imageId, modelRanking]) => {
    // Get the original model sequence for this image
    const modelSequence = modelSequences[imageId] || []

    return {
      clinician_id: clinicianId,
      clinician_name: clinicianData.name || "Anonymous",
      clinician_institution: clinicianData.institution || "Not specified",
      clinician_experience: clinicianData.experience || "unknown",
      clinician_created_at: clinicianData.created_at || now,
      image_id: imageId,
      model_rankings: JSON.stringify(modelRanking),
      model_sequence: JSON.stringify(modelSequence),
      submitted_at: now,
    }
  })
}

// Helper function to create CSV content
export const createCSV = (headers: string[], data: any[]) => {
  // Create header row
  let csv = headers.join(",") + "\n"

  // Add data rows
  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header]
      // Handle strings with commas by wrapping in quotes
      if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
    csv += values.join(",") + "\n"
  })

  return csv
}

// Helper function to download CSV
export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
