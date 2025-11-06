const PreviewPanel = () => {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="panel-header">
        <h2 className="panel-title">实时预览</h2>
        <span className="tag">预览</span>
      </div>
      <p className="text-sm text-muted">
        预览状态栏在亮色与暗色主题下的最终呈现，确保布局与色彩一致。
      </p>
      <div className="placeholder min-h-[320px]">预览区域占位</div>
    </div>
  )
}

export default PreviewPanel
