"use client"

import { useState, useEffect } from "react"

interface DeviceType {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  hasTouch: boolean
}

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    hasTouch: false,
  })

  useEffect(() => {
    // Function to determine device type
    const determineDeviceType = () => {
      const width = window.innerWidth
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0

      setDeviceType({
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024,
        hasTouch,
      })
    }

    // Initial check
    determineDeviceType()

    // Add resize listener
    window.addEventListener("resize", determineDeviceType)

    // Cleanup
    return () => {
      window.removeEventListener("resize", determineDeviceType)
    }
  }, [])

  return deviceType
}
