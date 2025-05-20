// Helper function to format rankings data for export
export const formatRankingsForExport = (
  rankings: Record<string, string[]>,
  modelSequences: Record<string, string[]>,
  clinicianId: string,
  clinicianData: any,
  testSequence: number[] = [],
) => {
  // Create a mapping of imageId to question number (1-based index)
  const questionNumberMap = {}
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
export const createCSV = (headers: string[], data: any[]) => {
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
