// Helper function to format rankings data for export
export const formatRankingsForExport = (
  rankings: Record<number, string[]>,
  modelSequences: Record<number, string[]>,
  clinicianId: string,
  clinicianData: Record<string, string>,
) => {
  // Create a combined dataset with clinician info repeated for each ranking
  return Object.entries(rankings).map(([imageId, modelOrder]) => ({
    // Clinician information
    clinician_id: clinicianId,
    clinician_name: clinicianData.name || "Anonymous",
    clinician_institution: clinicianData.institution || "Not specified",
    clinician_experience: clinicianData.experience || "unknown",
    clinician_created_at: clinicianData.created_at || new Date().toISOString(),

    // Ranking information
    image_id: Number.parseInt(imageId),
    model_rankings: modelOrder.join(","),
    model_sequence: (modelSequences[Number.parseInt(imageId)] || modelOrder).join(","),
    submitted_at: new Date().toISOString(),
  }))
}

// Helper function to create CSV content
export const createCSV = (headers: string[], rows: any[]) => {
  let csvContent = headers.join(",") + "\n"

  rows.forEach((row) => {
    const csvRow = headers.map((header) => {
      const value = row[header]
      // Wrap strings with commas in quotes
      return typeof value === "string" && (value.includes(",") || value.includes('"'))
        ? `"${value.replace(/"/g, '""')}"`
        : value
    })
    csvContent += csvRow.join(",") + "\n"
  })

  return csvContent
}

// Helper function to download CSV
export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
