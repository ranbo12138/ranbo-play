const ChatInterface = () => {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="panel-header">
        <h2 className="panel-title">对话调试</h2>
        <span className="tag">聊天调试</span>
      </div>
      <p className="text-sm text-muted">
        在此验证状态栏变量于实际对话流程中的表现，快速捕捉上下文缺失与响应异常。
      </p>
      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        <div className="placeholder min-h-[180px] sm:col-span-2">对话记录占位</div>
        <div className="placeholder h-24">输入区占位</div>
        <div className="placeholder h-24">快速提示占位</div>
      </div>
    </div>
  )
}

export default ChatInterface
