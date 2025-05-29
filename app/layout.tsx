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
      <body className={`${inter.className} gradient-bg min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <main className="min-h-screen flex flex-col w-full max-w-none">
            <div className="flex-1 w-full">{children}</div>
            <footer className="py-6 text-center text-sm text-gray-500 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100">
              <div className="flex flex-col items-center space-y-2 sm:space-y-0 sm:flex-row sm:justify-center sm:space-x-6">
                <img src="https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/UniBasel.png" alt="DBE Logo" className="h-14 sm:h-14" />
                <img src="https://cdn.jsdelivr.net/gh/SimoneSarrocco/images-oct@main/Logo_Universita%CC%88tsspital_Basel.svg.png" alt="USB Logo" className="h-8 sm:h-10" />
              </div>
              <p className="mt-2 text-xs sm:text-sm text-gray-500 px-4 max-w-4xl mx-auto">
                © {new Date().getFullYear()} OCT Image Enhancement Evaluation
              </p>
            </footer>
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
