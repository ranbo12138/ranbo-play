import { useCallback, useEffect, useState } from 'react'
import CodeEditor from './CodeEditor.jsx'
import PreviewSandbox from './PreviewSandbox.jsx'
import SplitPane from './SplitPane.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useDebouncedValue } from '../hooks/useDebouncedValue.js'
import { getPreviewCode, savePreviewCode } from '../utils/storage.js'

const DEFAULT_CODE = `// MVU Status Bar Example
// Write your code here to see it preview in real-time

const statusBar = document.getElementById('app');
if (statusBar) {
  statusBar.innerHTML = \`
    <div style="
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
      font-family: -apple-system, system-ui, sans-serif;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    ">
      <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">
        ⚡ Energy: 85%
      </div>
      <div style="font-size: 12px; opacity: 0.9;">
        🧠 Status: Focused | 🎯 Priority: High
      </div>
    </div>
  \`;
}
`

const CodeWorkspace = () => {
  const { theme } = useTheme()
  const [code, setCode] = useState(() => {
    const saved = getPreviewCode()
    return saved || DEFAULT_CODE
  })
  const [runtimeError, setRuntimeError] = useState(null)

  const debouncedCode = useDebouncedValue(code, 400)

  useEffect(() => {
    savePreviewCode(code)
  }, [code])

  const handleCodeChange = useCallback((newCode) => {
    setCode(newCode)
    setRuntimeError(null)
  }, [])

  const handleRuntimeError = useCallback((error) => {
    setRuntimeError(error)
  }, [])

  const leftContent = (
    <div className="flex h-full flex-col gap-4 p-5">
      <div className="panel-header">
        <h2 className="panel-title">Code Editor</h2>
        <span className="tag">JavaScript</span>
      </div>
      <p className="text-sm text-muted">
        Edit your MVU status bar code. Changes preview automatically.
      </p>
      <div className="flex-1">
        <CodeEditor
          language="javascript"
          value={code}
          onChange={handleCodeChange}
          options={{
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            renderLineHighlight: 'all',
          }}
        />
      </div>
      {runtimeError && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <div className="mb-1 font-semibold">Runtime Error:</div>
          <div className="font-mono text-xs">{runtimeError}</div>
        </div>
      )}
    </div>
  )

  const rightContent = (
    <div className="flex h-full flex-col gap-4 p-5">
      <div className="panel-header">
        <h2 className="panel-title">Live Preview</h2>
        <span className="tag">Sandbox</span>
      </div>
      <p className="text-sm text-muted">
        Isolated preview of your code. Updates after you stop typing.
      </p>
      <div className="flex-1">
        <PreviewSandbox
          code={debouncedCode}
          theme={theme}
          deviceStyle="ios"
          height="100%"
          onRuntimeError={handleRuntimeError}
        />
      </div>
    </div>
  )

  return (
    <div className="h-full">
      <SplitPane
        leftContent={leftContent}
        rightContent={rightContent}
        minLeftWidth={280}
        minRightWidth={280}
        defaultSplit={50}
        storageKey="codePreview"
      />
    </div>
  )
}

export default CodeWorkspace
