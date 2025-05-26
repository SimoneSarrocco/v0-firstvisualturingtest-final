"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase-client"
import { DebugEnvironment } from "@/components/debug-env"

export default function TestSupabasePage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setStatus("loading")
    setError(null)

    try {
      const supabase = createClient()

      // Simple query to test the connection
      const { data, error } = await supabase.from("rankings").select("*", { count: "exact", head: true })

      if (error) throw error

      setStatus("success")
    } catch (err: any) {
      console.error("Supabase connection error:", err)
      setStatus("error")
      setError(err.message || "Unknown error occurred")
    }
  }

  return (
    <div className="container py-10">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Test Supabase Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testConnection} disabled={status === "loading"} className="w-full">
            {status === "loading" ? "Testing..." : "Test Connection"}
          </Button>

          {status === "success" && (
            <div className="p-3 bg-green-50 text-green-700 rounded-md">
              ✅ Connection successful! Your Supabase integration is working.
            </div>
          )}

          {status === "error" && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md">❌ Connection failed: {error}</div>
          )}
        </CardContent>
      </Card>

      <DebugEnvironment />
    </div>
  )
}
