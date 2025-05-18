import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "OCT Image Enhancement Evaluation",
  description: "Clinical evaluation of deep learning models for vitreous OCT image enhancement",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <main className="min-h-screen flex flex-col w-full max-w-none">
            <div className="flex-1 w-full">{children}</div>
            <footer className="py-6 text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} OCT Image Enhancement Evaluation
            </footer>
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
