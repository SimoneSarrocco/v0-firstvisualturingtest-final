"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, User, Building, Calendar, Users, Eye } from "lucide-react"
import {
  saveToStorage,
  generateClinicianId,
  CLINICIAN_ID_KEY,
  CLINICIAN_NAME_KEY,
  CLINICIAN_INSTITUTION_KEY,
  CLINICIAN_EXPERIENCE_KEY,
  CLINICIAN_CREATED_AT_KEY,
  CLINICIAN_SEX_KEY,
  CLINICIAN_AGE_KEY,
} from "@/lib/storage-utils"
import { saveClinicianToSupabase } from "@/lib/supabase-utils"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    institution: "",
    experience: "",
    sex: "",
    age: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Experience is required
    if (!formData.experience) {
      newErrors.experience = "Please select your experience level with OCT images"
    }

    // Sex is required
    if (!formData.sex) {
      newErrors.sex = "Please select your sex"
    }

    // Age is required and must be valid
    if (!formData.age) {
      newErrors.age = "Please enter your age"
    } else {
      const ageNum = Number.parseInt(formData.age)
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
        newErrors.age = "Please enter a valid age between 18 and 100"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Generate a unique ID for this clinician
      const clinicianId = generateClinicianId()
      const timestamp = new Date().toISOString()

      // Prepare clinician data
      const clinicianData = {
        id: clinicianId,
        name: formData.name || "Anonymous",
        institution: formData.institution || "Not specified",
        experience: formData.experience,
        sex: formData.sex,
        age: Number.parseInt(formData.age),
        created_at: timestamp,
      }

      console.log("Saving clinician data:", clinicianData)

      // Save to localStorage first
      saveToStorage(CLINICIAN_ID_KEY, clinicianId)
      saveToStorage(CLINICIAN_NAME_KEY, clinicianData.name)
      saveToStorage(CLINICIAN_INSTITUTION_KEY, clinicianData.institution)
      saveToStorage(CLINICIAN_EXPERIENCE_KEY, clinicianData.experience)
      saveToStorage(CLINICIAN_SEX_KEY, clinicianData.sex)
      saveToStorage(CLINICIAN_AGE_KEY, clinicianData.age.toString())
      saveToStorage(CLINICIAN_CREATED_AT_KEY, timestamp)

      // Save to Supabase immediately
      const supabaseResult = await saveClinicianToSupabase(clinicianData, false)

      if (!supabaseResult.success) {
        console.error("Failed to save to Supabase:", supabaseResult.error)
        setErrors({ general: "Failed to save your information. Please try again." })
        setIsSubmitting(false)
        return
      }

      console.log("Clinician data saved successfully to both localStorage and Supabase")

      // Redirect to instructions page
      router.push("/instructions")
    } catch (err) {
      console.error("Error during login:", err)
      setErrors({ general: "An error occurred. Please try again." })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">OCT Image Enhancement Study</h1>
          <p className="text-gray-600">Help us evaluate AI-enhanced medical imaging quality</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">Participant Information</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Please provide your details to begin the evaluation
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Name - Optional */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Name <span className="text-gray-400 text-xs">(optional)</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Institution - Optional */}
              <div className="space-y-2">
                <Label htmlFor="institution" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Institution <span className="text-gray-400 text-xs">(optional)</span>
                </Label>
                <Input
                  id="institution"
                  placeholder="Your institution or hospital"
                  value={formData.institution}
                  onChange={(e) => handleInputChange("institution", e.target.value)}
                  className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Experience - Required */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Experience with OCT Images <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={formData.experience}
                  onValueChange={(value) => handleInputChange("experience", value)}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="less_than_5" id="exp-less" className="text-blue-600" />
                    <Label htmlFor="exp-less" className="text-gray-700 font-normal cursor-pointer flex-1">
                      Less than 5 years
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="5_or_more_years" id="exp-more" className="text-blue-600" />
                    <Label htmlFor="exp-more" className="text-gray-700 font-normal cursor-pointer flex-1">
                      5+ years of experience
                    </Label>
                  </div>
                </RadioGroup>
                {errors.experience && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.experience}
                  </p>
                )}
              </div>

              {/* Sex - Required */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Sex <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={formData.sex}
                  onValueChange={(value) => handleInputChange("sex", value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex-1">
                    <RadioGroupItem value="Male" id="sex-male" className="text-blue-600" />
                    <Label htmlFor="sex-male" className="text-gray-700 font-normal cursor-pointer">
                      Male
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors flex-1">
                    <RadioGroupItem value="Female" id="sex-female" className="text-blue-600" />
                    <Label htmlFor="sex-female" className="text-gray-700 font-normal cursor-pointer">
                      Female
                    </Label>
                  </div>
                </RadioGroup>
                {errors.sex && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.sex}
                  </p>
                )}
              </div>

              {/* Age - Required */}
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Age <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter your age"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  className={`h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.age ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""
                  }`}
                  min="18"
                  max="100"
                />
                {errors.age && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.age}
                  </p>
                )}
              </div>

              {/* General Error */}
              {errors.general && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}

              {/* Privacy Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Privacy Notice:</strong> Your data will be used solely for research purposes.
                </p>
              </div>
            </CardContent>

            <CardFooter className="pt-6">
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving Information...
                  </div>
                ) : (
                  "Continue to Instructions"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>This study is conducted for research purposes only</p>
        </div>
      </div>
    </div>
  )
}
