"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DebugEnvironment() {
  const [showVars, setShowVars] = useState(false)

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle>Environment Variables Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setShowVars(!showVars)}>{showVars ? "Hide Variables" : "Show Variables"}</Button>

        {showVars && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <h3 className="font-medium mb-2">Client-side Environment Variables:</h3>
            <ul className="space-y-1 text-sm">
              <li>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Not set"}</li>
              <li>
                NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Not set"}
              </li>
            </ul>
            <p className="text-xs mt-4 text-muted-foreground">
              Note: Server-side environment variables cannot be displayed here for security reasons.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
