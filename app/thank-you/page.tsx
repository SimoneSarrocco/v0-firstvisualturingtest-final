"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle, Download, Mail, Trophy, Medal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatRankingsForExport, createCSV, downloadCSV } from "@/lib/export-utils"
import { createClient } from "@/lib/supabase-client"

// Define full model names with abbreviations
const MODEL_FULL_NAMES: Record<string, string> = {
  DDPM: "Denoising Diffusion Probabilistic Model",
  VQGAN: "Vector-Quantized GAN",
  UNET: "U-Net",
  Pix2Pix: "Pix2Pix",
  BBDM: "Brownian-Bridge Diffusion Model",
}

interface ModelRanking {
  model: string
  averageRank: number
  count: number
}

export default function ThankYouPage() {
  const [hasLocalData, setHasLocalData] = useState(false)
  const [saveToSupabaseFailed, setSaveToSupabaseFailed] = useState(false)
  const [modelRankings, setModelRankings] = useState<ModelRanking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [clinicianId, setClinicianId] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)

    const fetchData = async () => {
      // Only access browser APIs on the client side
      if (typeof window !== "undefined") {
        try {
          // First check if we have data in session storage
          const rankings = sessionStorage.getItem("rankings")
          const storedClinicianId = sessionStorage.getItem("clinicianId")
          const supabaseSaveStatus = sessionStorage.getItem("supabaseSaveStatus")

          if (rankings) {
            setHasLocalData(true)
            calculateResults(rankings)

            // Check if we have a status about the Supabase save operation
            if (supabaseSaveStatus === "failed") {
              setSaveToSupabaseFailed(true)
            } else {
              setSaveToSupabaseFailed(false)
            }

            if (storedClinicianId) {
              setClinicianId(storedClinicianId)
            }
          } else if (storedClinicianId) {
            // If no rankings in session storage but we have clinician ID,
            // try to fetch from Supabase
            setClinicianId(storedClinicianId)
            await fetchResultsFromSupabase(storedClinicianId)
          }
        } catch (error) {
          console.error("Error accessing data:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchData()
  }, [])

  // Fetch results from Supabase if session storage was cleared
  const fetchResultsFromSupabase = async (id: string) => {
    try {
      const supabase = createClient()

      // Fetch rankings for this clinician
      const { data: rankingsData, error: rankingsError } = await supabase
        .from("rankings")
        .select("*")
        .eq("clinician_id", id)

      if (rankingsError) {
        console.error("Error fetching rankings from Supabase:", rankingsError)
        return
      }

      if (rankingsData && rankingsData.length > 0) {
        // Convert the data to the format our calculateResults function expects
        const formattedRankings: Record<number, string[]> = {}

        rankingsData.forEach((ranking) => {
          formattedRankings[ranking.image_id] = ranking.model_rankings
        })

        // Calculate results from the fetched data
        calculateResultsFromSupabase(formattedRankings)
        setHasLocalData(true)
      }
    } catch (error) {
      console.error("Error in fetchResultsFromSupabase:", error)
    }
  }

  // Calculate results from Supabase data
  const calculateResultsFromSupabase = (rankings: Record<number, string[]>) => {
    try {
      const models = ["DDPM_new", "VQGAN", "UNET", "Pix2Pix", "BBDM"]

      // Initialize model stats
      const modelStats: Record<string, { totalRank: number; count: number }> = {}
      models.forEach((model) => {
        modelStats[model] = { totalRank: 0, count: 0 }
      })

      // Calculate total rankings for each model
      Object.values(rankings).forEach((modelOrder) => {
        modelOrder.forEach((model, index) => {
          if (modelStats[model]) {
            // Add rank position (0-indexed, so add 1)
            modelStats[model].totalRank += index + 1
            modelStats[model].count += 1
          }
        })
      })

      // Calculate average rank for each model
      const results = models.map((model) => ({
        model,
        averageRank: modelStats[model].count > 0 ? modelStats[model].totalRank / modelStats[model].count : 0,
        count: modelStats[model].count,
      }))

      // Sort by average rank (lower is better)
      setModelRankings(results.sort((a, b) => a.averageRank - b.averageRank))
    } catch (error) {
      console.error("Error calculating results from Supabase:", error)
    }
  }

  const calculateResults = (rankingsJson: string) => {
    try {
      const rankings = JSON.parse(rankingsJson)
      const models = ["DDPM_new", "VQGAN", "UNET", "Pix2Pix", "BBDM"]

      // Initialize model stats
      const modelStats: Record<string, { totalRank: number; count: number }> = {}
      models.forEach((model) => {
        modelStats[model] = { totalRank: 0, count: 0 }
      })

      // Calculate total rankings for each model
      Object.values(rankings).forEach((modelOrder: any) => {
        modelOrder.forEach((model: string, index: number) => {
          if (modelStats[model]) {
            // Add rank position (0-indexed, so add 1)
            modelStats[model].totalRank += index + 1
            modelStats[model].count += 1
          }
        })
      })

      // Calculate average rank for each model
      const results = models.map((model) => ({
        model,
        averageRank: modelStats[model].count > 0 ? modelStats[model].totalRank / modelStats[model].count : 0,
        count: modelStats[model].count,
      }))

      // Sort by average rank (lower is better)
      setModelRankings(results.sort((a, b) => a.averageRank - b.averageRank))
    } catch (error) {
      console.error("Error calculating results:", error)
    }
  }

  const handleDownloadData = () => {
    try {
      if (typeof window === "undefined") return

      // Get data from session storage
      const rankings = sessionStorage.getItem("rankings")
      const modelSequences = sessionStorage.getItem("modelSequences")
      const storedClinicianId = sessionStorage.getItem("clinicianId")

      if (!rankings || !storedClinicianId) {
        console.error("Missing required data in session storage")
        return
      }

      // Parse the rankings
      const parsedRankings = JSON.parse(rankings)
      const parsedModelSequences = modelSequences ? JSON.parse(modelSequences) : {}

      // Get clinician data
      const clinicianData = {
        id: storedClinicianId,
        name: sessionStorage.getItem("clinicianName") || "Anonymous",
        institution: sessionStorage.getItem("clinicianInstitution") || "Not specified",
        experience: sessionStorage.getItem("clinicianExperience") || "unknown",
        created_at: sessionStorage.getItem("clinicianCreatedAt") || new Date().toISOString(),
      }

      // Format the data for export - combine clinician and ranking data
      const formattedData = formatRankingsForExport(
        parsedRankings,
        parsedModelSequences,
        storedClinicianId,
        clinicianData,
      )

      // Define headers for the combined CSV
      const headers = [
        "clinician_id",
        "clinician_name",
        "clinician_institution",
        "clinician_experience",
        "clinician_created_at",
        "image_id",
        "model_rankings",
        "model_sequence",
        "submitted_at",
      ]

      // Create and download the CSV
      const csvContent = createCSV(headers, formattedData)
      downloadCSV(csvContent, `oct_evaluation_results_${storedClinicianId}`)
    } catch (error) {
      console.error("Error downloading data:", error)
    }
  }

  // Get medal icon based on position
  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-600" />
      case 1:
        return <Medal className="h-5 w-5 text-gray-500" />
      case 2:
        return <Medal className="h-5 w-5 text-amber-700" />
      default:
        return null
    }
  }

  // Get rank color based on average rank
  const getRankColor = (rank: number): string => {
    if (rank <= 1.5) return "bg-emerald-500"
    if (rank <= 2.5) return "bg-green-500"
    if (rank <= 3.5) return "bg-amber-500"
    if (rank <= 4.5) return "bg-orange-500"
    return "bg-red-500"
  }

  // Get text color based on average rank
  const getTextColor = (rank: number): string => {
    if (rank <= 1.5) return "text-emerald-700"
    if (rank <= 2.5) return "text-green-700"
    if (rank <= 3.5) return "text-amber-700"
    if (rank <= 4.5) return "text-orange-700"
    return "text-red-700"
  }

  // Don't render anything during SSR
  if (!isMounted) {
    return null
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] py-10 px-4">
      <div className="w-full max-w-md">
        <Card className="modern-card card-hover">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl">
              <span className="gradient-text">Thank You!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-700">
              Your evaluation has been successfully submitted. We greatly appreciate your participation in this clinical
              study.
            </p>
            <p className="mt-4 text-gray-700">
              Your expert feedback will help us improve deep learning models for OCT image enhancement.
            </p>

            {/* Results Summary - Always show if we have rankings */}
            {isLoading ? (
              <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500">Loading your results...</p>
              </div>
            ) : modelRankings.length > 0 ? (
              <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-2 text-blue-600">Your Evaluation Results</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Based on your rankings, here's how you rated the different deep learning models:
                </p>

                <div className="space-y-6 mt-6">
                  {modelRankings.map((model, index) => (
                    <div key={model.model} className="relative">
                      {/* Position badge */}
                      <div className="absolute -left-2 -top-2 z-10">
                        {index < 3 && <div className="rounded-full bg-white p-1 shadow-md">{getMedalIcon(index)}</div>}
                      </div>

                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-3 flex justify-between items-center border-b border-gray-100">
                          <div className="font-medium flex items-center text-gray-700">
                            <span className="mr-2">{index + 1}.</span>
                            {/* Show only the full model name */}
                            <span>{MODEL_FULL_NAMES[model.model]}</span>
                          </div>
                          <div className={`font-bold text-lg ${getTextColor(model.averageRank)}`}>
                            {model.averageRank.toFixed(2)}
                          </div>
                        </div>

                        <div className="p-3">
                          <div className="flex items-center">
                            <div className="text-sm font-medium mr-3 w-16 text-gray-600">Rank:</div>
                            <div className="flex-1 bg-gray-200 h-6 rounded-full overflow-hidden">
                              {/* Rank bar - width is percentage of max rank (5) */}
                              <div
                                className={`h-full ${getRankColor(model.averageRank)} flex items-center justify-center text-white text-xs font-bold`}
                                style={{ width: `${(model.averageRank / 5) * 100}%` }}
                              >
                                {model.averageRank.toFixed(1)}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <div>Best (1.0)</div>
                            <div>Worst (5.0)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-gray-600 mt-4 text-center">
                  <p>Based on your evaluations</p>
                  <p className="mt-1 font-medium">Lower rank numbers indicate better performance</p>
                </div>
              </div>
            ) : (
              <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500">
                  We couldn't retrieve your evaluation results. This might be due to a technical issue.
                </p>
              </div>
            )}

            {/* Only show the warning and download option if Supabase save failed */}
            {hasLocalData && saveToSupabaseFailed && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-700">
                  It seems your data might not have been saved to our database. You can download your results as a CSV
                  file to ensure your valuable feedback is preserved.
                </p>
                <p className="text-yellow-700 mt-2">Please send the downloaded CSV file to:</p>
                <div className="flex flex-col gap-1 mt-2">
                  <a
                    href="mailto:simone.sarrocco@unibas.ch"
                    className="text-blue-600 hover:underline flex items-center justify-center"
                  >
                    <Mail className="h-4 w-4 mr-1" /> simone.sarrocco@unibas.ch
                  </a>
                  <span className="text-yellow-700">or</span>
                  <a
                    href="mailto:philippe.valmaggia@unibas.ch"
                    className="text-blue-600 hover:underline flex items-center justify-center"
                  >
                    <Mail className="h-4 w-4 mr-1" /> philippe.valmaggia@unibas.ch
                  </a>
                </div>
              </div>
            )}

            {/* Download Button */}
            {!isLoading && modelRankings.length > 0 && (
              <div className="mt-6">
                <Button onClick={handleDownloadData} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Download className="h-4 w-4 mr-2" /> Download Results
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full border-gray-300 text-gray-700">
                Return to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
