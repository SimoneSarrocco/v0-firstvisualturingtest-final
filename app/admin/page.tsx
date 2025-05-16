"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download } from "lucide-react"
import { createClient } from "@/lib/supabase-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [rankings, setRankings] = useState<any[]>([])
  const [clinicians, setClinicans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Check authorization
  const checkAuth = () => {
    // In a real app, you would hash this and use a more secure method
    // This is just a simple example
    if (password === "admin123forzamagicaroma") {
      setIsAuthorized(true)
      fetchData()
    } else {
      alert("Incorrect password")
    }
  }

  // Fetch all data
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()

      // Fetch rankings
      const { data: rankingsData, error: rankingsError } = await supabase
        .from("rankings")
        .select("*")
        .order("submitted_at", { ascending: false })

      if (rankingsError) throw rankingsError
      setRankings(rankingsData || [])

      // Fetch clinicians
      const { data: cliniciansData, error: cliniciansError } = await supabase
        .from("clinicians")
        .select("*")
        .order("created_at", { ascending: false })

      if (cliniciansError) throw cliniciansError

      // Normalize experience values
      const normalizedClinicians =
        cliniciansData?.map((clinician) => ({
          ...clinician,
          // Ensure consistent experience values
          experience: normalizeExperienceValue(clinician.experience),
        })) || []

      setClinicans(normalizedClinicians)
    } catch (error) {
      console.error("Error fetching data:", error)
      alert("Failed to fetch data")
    } finally {
      setIsLoading(false)
    }
  }

  // Normalize experience values to ensure consistency
  const normalizeExperienceValue = (experience: string): string => {
    if (!experience) return "unknown"

    // Convert to lowercase for case-insensitive comparison
    const expLower = experience.toLowerCase()

    if (expLower === "less_than_5" || expLower === "less than 5" || expLower === "<5") {
      return "less_than_5"
    }

    if (expLower === "5_or_more" || expLower === "5 or more" || expLower === ">=5" || expLower === "5+") {
      return "5_or_more"
    }

    return experience
  }

  // Download results as CSV
  const downloadRankingsCSV = () => {
    // Format data as CSV
    const headers = ["clinician_id", "image_id", "model_rankings", "submitted_at"]
    const csvRows = [
      headers.join(","), // Header row
      ...rankings.map((rank) =>
        [
          rank.clinician_id,
          rank.image_id,
          `"${rank.model_rankings.join(",")}"`, // Wrap in quotes to handle commas
          rank.submitted_at,
        ].join(","),
      ),
    ]

    const csvString = csvRows.join("\n")
    downloadCSV(csvString, "oct_rankings")
  }

  // Download clinicians as CSV
  const downloadCliniciansCSV = () => {
    // Format data as CSV
    const headers = ["id", "name", "institution", "experience", "created_at"]
    const csvRows = [
      headers.join(","), // Header row
      ...clinicians.map((clinician) =>
        [
          clinician.id,
          `"${clinician.name}"`, // Wrap in quotes to handle commas
          `"${clinician.institution}"`, // Wrap in quotes to handle commas
          clinician.experience,
          clinician.created_at,
        ].join(","),
      ),
    ]

    const csvString = csvRows.join("\n")
    downloadCSV(csvString, "oct_clinicians")
  }

  // Helper function to download CSV
  const downloadCSV = (csvString: string, filename: string) => {
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    // Create download link and click it
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Compute model performance statistics
  const computeStatistics = () => {
    if (!rankings.length) return null

    // Create an object to store model rankings
    const modelStats: Record<string, { totalRank: number; count: number }> = {}
    const modelStatsByExperience: Record<string, Record<string, { totalRank: number; count: number }>> = {
      less_than_5: {},
      five_or_more: {},
    }
    const models = ["DDPM", "VQGAN", "UNET", "Pix2Pix", "BBDM"]

    models.forEach((model) => {
      modelStats[model] = { totalRank: 0, count: 0 }
      modelStatsByExperience.less_than_5[model] = { totalRank: 0, count: 0 }
      modelStatsByExperience.five_or_more[model] = { totalRank: 0, count: 0 }
    })

    // Calculate total rankings for each model
    rankings.forEach((ranking) => {
      // Find the clinician to get their experience level
      const clinician = clinicians.find((c) => c.id === ranking.clinician_id)
      const experienceLevel = normalizeExperienceValue(clinician?.experience || "unknown")

      ranking.model_rankings.forEach((model: string, index: number) => {
        if (modelStats[model]) {
          // Add rank position (0-indexed, so add 1)
          modelStats[model].totalRank += index + 1
          modelStats[model].count += 1

          // Add to experience-specific stats if we know the experience
          if (experienceLevel === "less_than_5" || experienceLevel === "5_or_more") {
            const expKey = experienceLevel === "5_or_more" ? "five_or_more" : "less_than_5"
            modelStatsByExperience[expKey][model].totalRank += index + 1
            modelStatsByExperience[expKey][model].count += 1
          }
        }
      })
    })

    // Calculate average rank for each model
    const averageRanks = models.map((model) => ({
      model,
      averageRank:
        modelStats[model].count > 0 ? (modelStats[model].totalRank / modelStats[model].count).toFixed(2) : "N/A",
    }))

    // Calculate average rank by experience
    const averageRanksByExperience = {
      less_than_5: models.map((model) => ({
        model,
        averageRank:
          modelStatsByExperience.less_than_5[model].count > 0
            ? (
                modelStatsByExperience.less_than_5[model].totalRank / modelStatsByExperience.less_than_5[model].count
              ).toFixed(2)
            : "N/A",
      })),
      five_or_more: models.map((model) => ({
        model,
        averageRank:
          modelStatsByExperience.five_or_more[model].count > 0
            ? (
                modelStatsByExperience.five_or_more[model].totalRank / modelStatsByExperience.five_or_more[model].count
              ).toFixed(2)
            : "N/A",
      })),
    }

    // Sort by average rank (lower is better)
    return {
      overall: averageRanks.sort((a, b) =>
        a.averageRank === "N/A"
          ? 1
          : b.averageRank === "N/A"
            ? -1
            : Number.parseFloat(a.averageRank) - Number.parseFloat(b.averageRank),
      ),
      byExperience: {
        less_than_5: averageRanksByExperience.less_than_5.sort((a, b) =>
          a.averageRank === "N/A"
            ? 1
            : b.averageRank === "N/A"
              ? -1
              : Number.parseFloat(a.averageRank) - Number.parseFloat(b.averageRank),
        ),
        five_or_more: averageRanksByExperience.five_or_more.sort((a, b) =>
          a.averageRank === "N/A"
            ? 1
            : b.averageRank === "N/A"
              ? -1
              : Number.parseFloat(a.averageRank) - Number.parseFloat(b.averageRank),
        ),
      },
    }
  }

  // Compute experience statistics
  const computeExperienceStats = () => {
    if (!clinicians.length) return null

    const experienceCount = {
      less_than_5: 0,
      five_or_more: 0,
    }

    clinicians.forEach((clinician) => {
      if (clinician.experience === "less_than_5") {
        experienceCount.less_than_5++
      } else if (clinician.experience === "5_or_more") {
        experienceCount.five_or_more++
      }
    })

    return experienceCount
  }

  const statistics = computeStatistics()
  const experienceStats = computeExperienceStats()

  if (!isAuthorized) {
    return (
      <div className="container max-w-md mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <p>Enter the admin password to view results</p>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button onClick={checkAuth} className="w-full">
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Tabs defaultValue="summary">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="clinicians">Clinicians</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>OCT Image Enhancement Results Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading data...</p>
              ) : (
                <div className="space-y-6">
                  {/* Summary Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-2">Model Performance</h3>
                      {statistics ? (
                        <div>
                          <p className="mb-2 text-sm text-muted-foreground">Average Ranking (lower is better)</p>
                          <h4 className="font-semibold mt-3 mb-1">Overall</h4>
                          <ul className="space-y-1">
                            {statistics.overall.map((stat, index) => (
                              <li key={index} className="flex justify-between">
                                <span>{stat.model}:</span>
                                <span className="font-medium">{stat.averageRank}</span>
                              </li>
                            ))}
                          </ul>

                          <h4 className="font-semibold mt-4 mb-1">Clinicians with &lt;5 years experience</h4>
                          <ul className="space-y-1">
                            {statistics.byExperience.less_than_5.map((stat, index) => (
                              <li key={`less_${index}`} className="flex justify-between">
                                <span>{stat.model}:</span>
                                <span className="font-medium">{stat.averageRank}</span>
                              </li>
                            ))}
                          </ul>

                          <h4 className="font-semibold mt-4 mb-1">Clinicians with 5+ years experience</h4>
                          <ul className="space-y-1">
                            {statistics.byExperience.five_or_more.map((stat, index) => (
                              <li key={`more_${index}`} className="flex justify-between">
                                <span>{stat.model}:</span>
                                <span className="font-medium">{stat.averageRank}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p>No ranking data available yet.</p>
                      )}
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-2">Participation Summary</h3>
                      <ul className="space-y-1">
                        <li className="flex justify-between">
                          <span>Total Clinicians:</span>
                          <span className="font-medium">{clinicians.length}</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Total Evaluations:</span>
                          <span className="font-medium">{rankings.length}</span>
                        </li>
                        {experienceStats && (
                          <>
                            <li className="flex justify-between">
                              <span>Less than 5 years experience:</span>
                              <span className="font-medium">{experienceStats.less_than_5}</span>
                            </li>
                            <li className="flex justify-between">
                              <span>5+ years experience:</span>
                              <span className="font-medium">{experienceStats.five_or_more}</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button onClick={downloadRankingsCSV} disabled={!rankings.length}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Rankings CSV
                    </Button>
                    <Button onClick={downloadCliniciansCSV} disabled={!clinicians.length}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Clinicians CSV
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rankings">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading data...</p>
              ) : rankings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Clinician</th>
                        <th className="text-left p-2">Image</th>
                        <th className="text-left p-2">Rankings (Best to Worst)</th>
                        <th className="text-left p-2">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.map((rank, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{rank.clinician_id}</td>
                          <td className="p-2">{rank.image_id}</td>
                          <td className="p-2">{rank.model_rankings.join(" > ")}</td>
                          <td className="p-2">{new Date(rank.submitted_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No ranking data available yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinicians">
          <Card>
            <CardHeader>
              <CardTitle>Clinician Information</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading data...</p>
              ) : clinicians.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Institution</th>
                        <th className="text-left p-2">Experience</th>
                        <th className="text-left p-2">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clinicians.map((clinician, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{clinician.id}</td>
                          <td className="p-2">{clinician.name}</td>
                          <td className="p-2">{clinician.institution}</td>
                          <td className="p-2">
                            {clinician.experience === "less_than_5" ? "Less than 5 years" : "5+ years"}
                          </td>
                          <td className="p-2">{new Date(clinician.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No clinician data available yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
