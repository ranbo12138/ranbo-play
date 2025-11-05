import { useEffect, useMemo, useState } from 'react'

const PHONE_MAX = 430
const SMALL_PHONE_MAX = 380
const TABLET_MIN = 768
const DESKTOP_MIN = 1024
const WIDE_DESKTOP_MIN = 1280

const getBreakpointState = () => {
  if (typeof window === 'undefined') {
    return {
      width: DESKTOP_MIN,
      height: 0,
      isPhone: false,
      isSmallPhone: false,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isWideDesktop: true,
    }
  }

  const width = Math.round(window.innerWidth)
  const height = Math.round(window.innerHeight)

  const isDesktop = width >= DESKTOP_MIN
  const isTablet = width >= TABLET_MIN && width < DESKTOP_MIN
  const isPhone = width <= PHONE_MAX
  const isSmallPhone = width <= SMALL_PHONE_MAX

  return {
    width,
    height,
    isPhone,
    isSmallPhone,
    isMobile: width < DESKTOP_MIN,
    isTablet,
    isDesktop,
    isWideDesktop: width >= WIDE_DESKTOP_MIN,
  }
}

const statesAreEqual = (next, prev) => {
  return (
    next.width === prev.width &&
    next.height === prev.height &&
    next.isPhone === prev.isPhone &&
    next.isSmallPhone === prev.isSmallPhone &&
    next.isMobile === prev.isMobile &&
    next.isTablet === prev.isTablet &&
    next.isDesktop === prev.isDesktop &&
    next.isWideDesktop === prev.isWideDesktop
  )
}

export default function useBreakpoints() {
  const [state, setState] = useState(getBreakpointState)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    let frame = null

    const handleResize = () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }

      frame = window.requestAnimationFrame(() => {
        frame = null
        setState((prev) => {
          const next = getBreakpointState()
          if (statesAreEqual(next, prev)) {
            return prev
          }
          return next
        })
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    const viewport = window.visualViewport
    viewport?.addEventListener('resize', handleResize)

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      viewport?.removeEventListener('resize', handleResize)
    }
  }, [])

  const enhancedState = useMemo(() => {
    const breakpoint = state.isDesktop ? 'desktop' : state.isTablet ? 'tablet' : 'mobile'
    return {
      ...state,
      breakpoint,
    }
  }, [state])

  return enhancedState
}
