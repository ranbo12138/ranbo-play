const PreviewPanel = () => {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="panel-header">
        <h2 className="panel-title">实时预览</h2>
        <span className="tag">Preview</span>
      </div>
      <p className="text-sm text-muted">
        预览状态栏在亮色与暗色主题下的最终呈现，确保布局与色彩一致。
      </p>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="placeholder min-h-[240px]">预览区域占位</div>
      </div>
    </div>
  )
}

export default PreviewPanel
