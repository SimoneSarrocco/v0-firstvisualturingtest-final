"use client"

import { useState, useEffect } from "react"

interface DeviceType {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
}

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
  })

  useEffect(() => {
    // Function to update device type based on screen size
    const updateDeviceType = () => {
      const width = window.innerWidth
      const isMobile = width < 768
      const isTablet = width >= 768 && width < 1024
      const isDesktop = width >= 1024

      // Check if device has touch capabilities
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0

      setDeviceType({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
      })
    }

    // Initial check
    updateDeviceType()

    // Add event listener for window resize
    window.addEventListener("resize", updateDeviceType)

    // Cleanup
    return () => {
      window.removeEventListener("resize", updateDeviceType)
    }
  }, [])

  return deviceType
}
