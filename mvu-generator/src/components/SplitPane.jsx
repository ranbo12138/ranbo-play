import { useCallback, useEffect, useRef, useState } from 'react'

const SplitPane = ({
  leftContent,
  rightContent,
  minLeftWidth = 200,
  minRightWidth = 200,
  defaultSplit = 50,
  onSplitChange,
}) => {
  const containerRef = useRef(null)
  const [splitPercent, setSplitPercent] = useState(defaultSplit)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragStartSplit = useRef(defaultSplit)

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartX.current = e.clientX
    dragStartSplit.current = splitPercent
  }, [splitPercent])

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !containerRef.current) return

      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const containerWidth = containerRect.width
      const deltaX = e.clientX - dragStartX.current
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

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full overflow-hidden"
    >
      <div
        className="overflow-auto"
        style={{ width: `${splitPercent}%`, flexShrink: 0 }}
      >
        {leftContent}
      </div>

      <div
        className="group relative flex w-1 cursor-col-resize items-center bg-border transition-colors hover:bg-accent/50"
        onMouseDown={handleMouseDown}
        style={{
          cursor: isDragging ? 'col-resize' : undefined,
        }}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/0 p-1 transition-colors group-hover:bg-accent/10">
          <div className="flex flex-col gap-0.5">
            <div className="h-1 w-1 rounded-full bg-muted transition-colors group-hover:bg-accent" />
            <div className="h-1 w-1 rounded-full bg-muted transition-colors group-hover:bg-accent" />
            <div className="h-1 w-1 rounded-full bg-muted transition-colors group-hover:bg-accent" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {rightContent}
      </div>
    </div>
  )
}

export default SplitPane
