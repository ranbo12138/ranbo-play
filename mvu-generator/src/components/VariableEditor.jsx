import { useCallback, useMemo, useState } from 'react'
import CodeEditor from './CodeEditor.jsx'

const INITIAL_YAML = `metadata:
  title: Tavern 状态栏示例
  version: 0.1.0
variables:
  mood: neutral
  energy: 0
  focus: 50
`

const VariableEditor = () => {
  const [source, setSource] = useState(INITIAL_YAML)

  const editorOptions = useMemo(
    () => ({
      lineNumbers: 'on',
      folding: true,
      rulers: [80],
    }),
    [],
  )

  const handleChange = useCallback((nextValue) => {
    setSource(nextValue ?? '')
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="panel-header">
        <h2 className="panel-title">变量编辑器</h2>
        <span className="tag">Variables</span>
      </div>
      <p className="text-sm text-muted">
        整理 MVU 所需的变量、状态与映射。未来将在此支持 YAML、TOML 及 JSON5 的互转与校验。
      </p>
      <div className="flex min-h-0 flex-1">
        <CodeEditor language="yaml" value={source} onChange={handleChange} options={editorOptions} />
      </div>
    </div>
  )
}

export default VariableEditor
