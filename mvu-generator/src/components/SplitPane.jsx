import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY_PREFIX = 'layout:split:'

const SplitPane = ({
  leftContent,
  rightContent,
  minLeftWidth = 200,
  minRightWidth = 200,
  defaultSplit = 50,
  onSplitChange,
  storageKey,
}) => {
  const containerRef = useRef(null)
  const storageKeyFull = storageKey ? `${STORAGE_KEY_PREFIX}${storageKey}` : null
  
  const [splitPercent, setSplitPercent] = useState(() => {
    if (storageKeyFull) {
      try {
        const saved = localStorage.getItem(storageKeyFull)
        return saved ? parseFloat(saved) : defaultSplit
      } catch {
        return defaultSplit
      }
    }
    return defaultSplit
  })
  
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragStartSplit = useRef(defaultSplit)

  const handleDragStart = useCallback((clientX) => {
    setIsDragging(true)
    dragStartX.current = clientX
    dragStartSplit.current = splitPercent
  }, [splitPercent])

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    handleDragStart(e.clientX)
  }, [handleDragStart])

  const handleTouchStart = useCallback((e) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleDragStart(touch.clientX)
  }, [handleDragStart])

  const handleDragMove = useCallback(
    (clientX) => {
      if (!isDragging || !containerRef.current) return

      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const containerWidth = containerRect.width
      const deltaX = clientX - dragStartX.current
      const deltaPercent = (deltaX / containerWidth) * 100
      const newSplit = dragStartSplit.current + deltaPercent

      const minLeftPercent = (minLeftWidth / containerWidth) * 100
      const minRightPercent = (minRightWidth / containerWidth) * 100

      const clampedSplit = Math.max(
        minLeftPercent,
        Math.min(100 - minRightPercent, newSplit)
      )

      setSplitPercent(clampedSplit)

      if (onSplitChange) {
        onSplitChange(clampedSplit)
      }
    },
    [isDragging, minLeftWidth, minRightWidth, onSplitChange]
  )

  const handleMouseMove = useCallback(
    (e) => {
      handleDragMove(e.clientX)
    },
    [handleDragMove]
  )

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return
      e.preventDefault()
      const touch = e.touches[0]
      handleDragMove(touch.clientX)
    },
    [isDragging, handleDragMove]
  )

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleMouseUp = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  const handleTouchEnd = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.body.style.webkitUserSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        document.body.style.webkitUserSelect = ''
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  useEffect(() => {
    if (storageKeyFull) {
      try {
        localStorage.setItem(storageKeyFull, splitPercent.toString())
      } catch {
        // Silent fail for localStorage errors
      }
    }
  }, [splitPercent, storageKeyFull])

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full overflow-hidden"
    >
      <div
        className="overflow-auto scrollbar-thin"
        style={{ width: `${splitPercent}%`, flexShrink: 0 }}
      >
        {leftContent}
      </div>

      <div
        className="group relative flex w-2 cursor-col-resize items-center bg-border transition-colors hover:bg-accent/50 active:bg-accent/70 md:w-1"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          cursor: isDragging ? 'col-resize' : undefined,
          touchAction: 'none',
        }}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/0 p-1.5 transition-colors group-hover:bg-accent/10 md:p-1">
          <div className="flex flex-col gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-muted transition-colors group-hover:bg-accent md:h-1 md:w-1" />
            <div className="h-1.5 w-1.5 rounded-full bg-muted transition-colors group-hover:bg-accent md:h-1 md:w-1" />
            <div className="h-1.5 w-1.5 rounded-full bg-muted transition-colors group-hover:bg-accent md:h-1 md:w-1" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin">
        {rightContent}
      </div>
    </div>
  )
}

export default SplitPane
