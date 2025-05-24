"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface ModelRanking {
  modelName: string
  rank: number
}

const TestPage = () => {
  const router = useRouter()
  const [models, setModels] = useState<string[]>([])
  const [rankings, setRankings] = useState<ModelRanking[]>([])
  const [modelSequences, setModelSequences] = useState<{ [modelName: string]: string }>({})
  const [testSequence, setTestSequence] = useState<string>("")
  const [clinicianId, setClinicianId] = useState<string>("")

  useEffect(() => {
    // Retrieve models from session storage
    const storedModels = sessionStorage.getItem("models")
    if (storedModels) {
      setModels(JSON.parse(storedModels))
    }

    // Retrieve clinicianId from session storage
    const storedClinicianId = sessionStorage.getItem("clinicianId")
    if (storedClinicianId) {
      setClinicianId(storedClinicianId)
    }

    // Generate a random test sequence (example)
    const sequence = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setTestSequence(sequence)

    // Initialize rankings (all models ranked 0 initially)
    if (storedModels) {
      const parsedModels = JSON.parse(storedModels) as string[]
      const initialRankings = parsedModels.map((modelName) => ({ modelName: modelName, rank: 0 }))
      setRankings(initialRankings)
    }
  }, [])

  const handleRankChange = (modelName: string, newRank: number) => {
    setRankings((prevRankings) => {
      return prevRankings.map((ranking) => {
        if (ranking.modelName === modelName) {
          return { ...ranking, rank: newRank }
        }
        return ranking
      })
    })
  }

  const handleSubmit = () => {
    // Sort rankings by rank in descending order
    const sortedRankings = [...rankings].sort((a, b) => b.rank - a.rank)

    // Save to session storage
    sessionStorage.setItem("rankings", JSON.stringify(sortedRankings))
    sessionStorage.setItem("modelSequences", JSON.stringify(modelSequences))
    sessionStorage.setItem("testSequence", JSON.stringify(testSequence))
    sessionStorage.setItem("clinicianId", clinicianId)

    console.log("Test sequence being saved:", testSequence)
    console.log("Rankings being saved:", sortedRankings)

    // Redirect to the next page
    router.push("/confirmation")
  }

  return (
    <div>
      <h1>Model Ranking</h1>
      <p>Clinician ID: {clinicianId}</p>
      <p>Test Sequence: {testSequence}</p>
      {models.map((modelName) => (
        <div key={modelName}>
          <label htmlFor={modelName}>{modelName}:</label>
          <input
            type="number"
            id={modelName}
            value={rankings.find((ranking) => ranking.modelName === modelName)?.rank || 0}
            onChange={(e) => handleRankChange(modelName, Number.parseInt(e.target.value))}
          />
        </div>
      ))}
      <button onClick={handleSubmit}>Submit Rankings</button>
    </div>
  )
}

export default TestPage
