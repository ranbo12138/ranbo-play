const CodeEditor = () => {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="panel-header">
        <h2 className="panel-title">模板输出</h2>
        <span className="tag">Code</span>
      </div>
      <p className="text-sm text-muted">
        Tailwind 主题与 MVU 模板片段将在此生成，便于复制到 TavernAI 或其他部署环境。
      </p>
      <div className="placeholder min-h-[220px]">代码编辑器占位</div>
    </div>
  )
}

export default CodeEditor
