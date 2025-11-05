const ChatInterface = () => {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="panel-header">
        <h2 className="panel-title">对话调试</h2>
        <span className="tag">Chat Ops</span>
      </div>
      <p className="text-sm text-muted">
        在此验证状态栏变量于实际对话流程中的表现，快速捕捉上下文缺失与响应异常。
      </p>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto sm:grid-cols-2">
          <div className="placeholder min-h-[180px] sm:col-span-2">对话记录占位</div>
          <div className="placeholder h-24">输入区占位</div>
          <div className="placeholder h-24">快速提示占位</div>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
