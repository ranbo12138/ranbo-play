const VariableEditor = () => {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="panel-header">
        <h2 className="panel-title">变量编辑器</h2>
        <span className="tag">Variables</span>
      </div>
      <p className="text-sm text-muted">
        整理 MVU 所需的变量、状态与映射。未来将在此支持 YAML、TOML 及 JSON5 的互转与校验。
      </p>
      <div className="placeholder min-h-[200px]">变量配置界面正在建设中</div>
    </div>
  )
}

export default VariableEditor
