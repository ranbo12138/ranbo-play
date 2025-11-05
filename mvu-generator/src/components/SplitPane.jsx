import { Children, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

const STORAGE_PREFIX = 'layout:split:'
const MINIMUM_RATIO = 0.05

const clamp = (value, min, max) => {
  if (Number.isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}

const readStoredRatio = (storageKey) => {
  if (!storageKey || typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`)
    if (stored === null) {
      return null
    }
    const parsed = Number.parseFloat(stored)
    return Number.isFinite(parsed) ? parsed : null
  } catch (error) {
    console.warn('[SplitPane] Failed to read stored split ratio', error)
    return null
  }
}

const writeStoredRatio = (storageKey, ratio) => {
  if (!storageKey || typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, ratio.toString())
  } catch (error) {
    console.warn('[SplitPane] Failed to persist split ratio', error)
  }
}

const getCursor = (direction) => (direction === 'horizontal' ? 'col-resize' : 'row-resize')

const computeConstraints = (element, direction, minPrimary, minSecondary) => {
  if (!element) {
    return { total: 0, minRatio: MINIMUM_RATIO, maxRatio: 1 - MINIMUM_RATIO }
  }

  const rect = element.getBoundingClientRect()
  const total = direction === 'horizontal' ? rect.width : rect.height

  if (!total) {
    return { total: 0, minRatio: MINIMUM_RATIO, maxRatio: 1 - MINIMUM_RATIO }
  }

  const minRatio = clamp(minPrimary / total || 0, MINIMUM_RATIO, 1 - MINIMUM_RATIO)
  const maxRatio = clamp(1 - minSecondary / total || 1, MINIMUM_RATIO, 1 - MINIMUM_RATIO)

  if (maxRatio <= minRatio) {
    const midpoint = clamp(0.5, MINIMUM_RATIO, 1 - MINIMUM_RATIO)
    return { total, minRatio: midpoint, maxRatio: midpoint }
  }

  return { total, minRatio, maxRatio }
}

const getPointRatio = (event, element, direction) => {
  const rect = element.getBoundingClientRect()
  const position = direction === 'horizontal' ? event.clientX - rect.left : event.clientY - rect.top
  const total = direction === 'horizontal' ? rect.width : rect.height

  if (!total) {
    return null
  }

  return clamp(position / total, MINIMUM_RATIO, 1 - MINIMUM_RATIO)
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

const useResizeObserver = (ref, callback) => {
  useIsomorphicLayoutEffect(() => {
    const node = ref.current
    if (!node || typeof window === 'undefined' || typeof window.ResizeObserver !== 'function') {
      return undefined
    }

    const observer = new window.ResizeObserver(callback)
    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [ref, callback])
}

const SplitPane = ({
  children,
  direction = 'horizontal',
  className = '',
  initialRatio = 0.5,
  minPrimary = 260,
  minSecondary = 260,
  storageKey,
  ariaLabel,
}) => {
  const containerRef = useRef(null)
  const handleRef = useRef(null)
  const pointerIdRef = useRef(null)
  const constraintsRef = useRef({ total: 0, minRatio: MINIMUM_RATIO, maxRatio: 1 - MINIMUM_RATIO })
  const isHorizontal = direction === 'horizontal'

  const storedRatio = useMemo(() => readStoredRatio(storageKey), [storageKey])
  const initial = clamp(storedRatio ?? initialRatio, MINIMUM_RATIO, 1 - MINIMUM_RATIO)

  const [ratio, setRatio] = useState(initial)
  const ratioRef = useRef(ratio)
  const [isDragging, setIsDragging] = useState(false)

  const applyConstraints = useCallback(
    (value) => {
      const container = containerRef.current
      if (!container) {
        return value
      }

      const { minRatio, maxRatio } = computeConstraints(container, direction, minPrimary, minSecondary)
      constraintsRef.current = { ...constraintsRef.current, minRatio, maxRatio }
      return clamp(value, minRatio, maxRatio)
    },
    [direction, minPrimary, minSecondary],
  )

  useEffect(() => {
    ratioRef.current = ratio
    if (storageKey) {
      writeStoredRatio(storageKey, ratio)
    }
  }, [ratio, storageKey])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return undefined
    }

    constraintsRef.current = computeConstraints(container, direction, minPrimary, minSecondary)
    setRatio((current) => applyConstraints(current))

    return undefined
  }, [applyConstraints, direction, minPrimary, minSecondary])

  useResizeObserver(
    containerRef,
    useCallback(() => {
      setRatio((current) => applyConstraints(current))
    }, [applyConstraints]),
  )

  const startDragging = useCallback(
    (event) => {
      if (!containerRef.current || pointerIdRef.current !== null) {
        return
      }

      event.preventDefault()

      pointerIdRef.current = event.pointerId
      handleRef.current?.setPointerCapture(event.pointerId)
      setIsDragging(true)

      const cursor = getCursor(direction)
      const originalUserSelect = document.body.style.userSelect
      const originalCursor = document.body.style.cursor

      document.body.style.userSelect = 'none'
      document.body.style.cursor = cursor

      const handlePointerMove = (moveEvent) => {
        if (moveEvent.pointerId !== pointerIdRef.current) {
          return
        }

        const nextRatio = getPointRatio(moveEvent, containerRef.current, direction)
        if (nextRatio === null) {
          return
        }

        const { minRatio, maxRatio } = constraintsRef.current
        const constrained = clamp(nextRatio, minRatio, maxRatio)
        setRatio(constrained)
      }

      const release = () => {
        pointerIdRef.current = null
        setIsDragging(false)
        document.body.style.userSelect = originalUserSelect
        document.body.style.cursor = originalCursor
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('pointercancel', handlePointerCancel)
      }

      const handlePointerUp = (upEvent) => {
        if (upEvent.pointerId !== pointerIdRef.current) {
          return
        }

        handleRef.current?.releasePointerCapture(upEvent.pointerId)
        release()
      }

      const handlePointerCancel = (cancelEvent) => {
        if (cancelEvent.pointerId !== pointerIdRef.current) {
          return
        }

        handleRef.current?.releasePointerCapture(cancelEvent.pointerId)
        release()
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerCancel)
    },
    [direction],
  )

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
        return
      }

      const delta = event.shiftKey ? 0.05 : 0.02
      const { minRatio, maxRatio } = constraintsRef.current
      let next = ratioRef.current

      if (direction === 'horizontal') {
        if (event.key === 'ArrowLeft') {
          next -= delta
        }
        if (event.key === 'ArrowRight') {
          next += delta
        }
      } else {
        if (event.key === 'ArrowUp') {
          next -= delta
        }
        if (event.key === 'ArrowDown') {
          next += delta
        }
      }

      const constrained = clamp(next, minRatio, maxRatio)
      setRatio(constrained)
      event.preventDefault()
    },
    [direction],
  )

  const handleDoubleClick = useCallback(() => {
    setRatio(applyConstraints(initial))
  }, [applyConstraints, initial])

  const childArray = useMemo(() => {
    const elements = Children.toArray(children).filter(Boolean)
    if (elements.length !== 2) {
      console.warn('[SplitPane] requires exactly two children.')
    }
    return [elements[0] ?? null, elements[1] ?? null]
  }, [children])

  const orientation = isHorizontal ? 'vertical' : 'horizontal'
  const percentage = Math.round(ratio * 100)

  const { minRatio, maxRatio } = constraintsRef.current
  ratioRef.current = ratio

  const primaryStyle = isHorizontal
    ? {
        flexBasis: `${ratio * 100}%`,
        maxWidth: `${ratio * 100}%`,
        minWidth: `${minPrimary}px`,
      }
    : {
        flexBasis: `${ratio * 100}%`,
        maxHeight: `${ratio * 100}%`,
        minHeight: `${minPrimary}px`,
      }

  const secondaryStyle = isHorizontal
    ? {
        flexBasis: `${(1 - ratio) * 100}%`,
        maxWidth: `${(1 - ratio) * 100}%`,
        minWidth: `${minSecondary}px`,
      }
    : {
        flexBasis: `${(1 - ratio) * 100}%`,
        maxHeight: `${(1 - ratio) * 100}%`,
        minHeight: `${minSecondary}px`,
      }

  return (
    <div
      ref={containerRef}
      className={`split-pane ${isHorizontal ? 'split-pane--horizontal' : 'split-pane--vertical'} ${isDragging ? 'is-dragging' : ''} ${className}`.trim()}
      data-orientation={orientation}
    >
      <div className="split-pane-pane" style={primaryStyle}>
        {childArray[0]}
      </div>
      <button
        ref={handleRef}
        type="button"
        className={`split-pane-divider ${isHorizontal ? 'split-pane-divider-horizontal' : 'split-pane-divider-vertical'}`.trim()}
        onPointerDown={startDragging}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel || '调整区域大小'}
        aria-orientation={orientation}
        aria-valuemin={Math.round(minRatio * 100)}
        aria-valuemax={Math.round(maxRatio * 100)}
        aria-valuenow={percentage}
        role="separator"
        tabIndex={0}
        data-dragging={isDragging}
      >
        <span className="split-pane-grip" aria-hidden="true" />
      </button>
      <div className="split-pane-pane" style={secondaryStyle}>
        {childArray[1]}
      </div>
    </div>
  )
}

export default SplitPane
