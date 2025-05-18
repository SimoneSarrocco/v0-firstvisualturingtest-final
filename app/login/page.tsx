"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import {
  saveToStorage,
  generateClinicianId,
  CLINICIAN_ID_KEY,
  CLINICIAN_NAME_KEY,
  CLINICIAN_INSTITUTION_KEY,
  CLINICIAN_EXPERIENCE_KEY,
  CLINICIAN_CREATED_AT_KEY,
} from "@/lib/storage-utils"
import { saveClinicianToSupabase } from "@/lib/supabase-utils"

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [institution, setInstitution] = useState("")
  const [experience, setExperience] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [connectionError, setConnectionError] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setConnectionError(false)

    // Validate experience (required)
    if (!experience) {
      setError("Please select your experience level with OCT images.")
      return
    }

    setIsSubmitting(true)

    try {
      // Generate a unique ID for this clinician using the new format
      const clinicianId = generateClinicianId()
      const timestamp = new Date().toISOString()

      // Create clinician data object
      const clinicianData = {
        id: clinicianId,
        name: name || "Anonymous",
        institution: institution || "Not specified",
        experience,
        created_at: timestamp,
      }

      // Save clinician data to localStorage
      saveToStorage(CLINICIAN_ID_KEY, clinicianId)
      saveToStorage(CLINICIAN_NAME_KEY, clinicianData.name)
      saveToStorage(CLINICIAN_INSTITUTION_KEY, clinicianData.institution)
      saveToStorage(CLINICIAN_EXPERIENCE_KEY, experience)
      saveToStorage(CLINICIAN_CREATED_AT_KEY, timestamp)

      // Try to save to Supabase if available
      try {
        const { success, error } = await saveClinicianToSupabase(clinicianData)

        if (!success) {
          console.warn("Could not save to Supabase:", error)
          setConnectionError(true)
        }
      } catch (err) {
        // If Supabase is not available, just continue but show a warning
        console.warn("Could not save to Supabase:", err)
        setConnectionError(true)
      }

      // Redirect to instructions page
      router.push("/instructions")
    } catch (err) {
      console.error("Error during login:", err)
      setError("An error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          padding: "16px",
          margin: "0 auto",
        }}
      >
        <Card style={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}>
          <CardHeader>
            <CardTitle>Clinician Information</CardTitle>
            <CardDescription>
              Please provide your information to participate in the OCT image enhancement evaluation.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution">Institution (optional)</Label>
                <Input
                  id="institution"
                  placeholder="Your institution"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  Experience with OCT Images
                </Label>
                <RadioGroup value={experience} onValueChange={setExperience} className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="less_than_5" id="less" />
                    <Label htmlFor="less" className="font-normal">
                      Less than 5 years
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="5_or_more_years" id="more" />
                    <Label htmlFor="more" className="font-normal">
                      5 or more years
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {connectionError && (
                <Alert variant="warning" className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: Could not connect to the database. Your information will be saved locally, and you can
                    still proceed with the evaluation.
                  </AlertDescription>
                </Alert>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Continue to Instructions"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
