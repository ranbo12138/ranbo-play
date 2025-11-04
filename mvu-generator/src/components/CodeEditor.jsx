import { useCallback, useEffect, useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import { configureMonacoYaml } from 'monaco-yaml'
import { useTheme } from '../context/ThemeContext.jsx'

const getRootFontSize = () => {
  if (typeof window === 'undefined') {
    return 16
  }

  const computed = window.getComputedStyle(window.document.documentElement)
  const parsed = Number.parseFloat(computed.fontSize)
  return Number.isFinite(parsed) ? parsed : 16
}

let yamlService = null

const CodeEditor = ({
  language = 'yaml',
  value = '',
  onChange,
  readOnly = false,
  options,
  className = '',
  height = '100%',
}) => {
  const { theme } = useTheme()
  const [fontSize, setFontSize] = useState(getRootFontSize)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleResize = () => {
      setFontSize(getRootFontSize())
    }

    const observer = typeof window.ResizeObserver === 'function' ? new window.ResizeObserver(handleResize) : null

    window.addEventListener('resize', handleResize)
    observer?.observe(window.document.documentElement)

    return () => {
      window.removeEventListener('resize', handleResize)
      observer?.disconnect()
    }
  }, [])

  const mergedOptions = useMemo(() => {
    const baseOptions = {
      automaticLayout: true,
      wordWrap: 'on',
      wrappingIndent: 'same',
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      minimap: { enabled: false },
      fontLigatures: true,
      renderWhitespace: 'selection',
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: false,
      quickSuggestions: { other: true, comments: false, strings: true },
      formatOnPaste: true,
      formatOnType: true,
      links: false,
      padding: { top: 12, bottom: 12 },
      fontFamily:
        'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    }

    const merged = {
      ...baseOptions,
      ...options,
      minimap: { ...baseOptions.minimap, ...(options?.minimap ?? {}) },
      padding: { ...baseOptions.padding, ...(options?.padding ?? {}) },
    }

    merged.readOnly = readOnly
    merged.fontSize = options?.fontSize ?? Math.round(fontSize)

    return merged
  }, [fontSize, options, readOnly])

  const themeKey = theme === 'dark' ? 'vs-dark' : 'vs'

  const handleEditorDidMount = useCallback(
    (editorInstance, monacoInstance) => {
      if (monacoInstance && language === 'yaml') {
        if (!yamlService) {
          yamlService = configureMonacoYaml(monacoInstance, {
            enableSchemaRequest: false,
            hover: true,
            completion: true,
            format: true,
          })
        }
      }

      const formatAction = editorInstance.getAction('editor.action.formatDocument')
      if (formatAction) {
        editorInstance.addCommand(
          monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
          () => {
            formatAction.run()
          },
        )
      }
    },
    [language],
  )

  const handleChange = useCallback(
    (nextValue) => {
      if (onChange) {
        onChange(nextValue ?? '')
      }
    },
    [onChange],
  )

  return (
    <div
      className={`relative flex min-h-[200px] flex-1 overflow-hidden rounded-xl border border-border/70 bg-background/60 shadow-inner ${className}`.trim()}
    >
      <Editor
        className="flex-1"
        language={language}
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={mergedOptions}
        theme={themeKey}
        loading={
          <div className="flex h-full w-full items-center justify-center text-sm text-muted">
            正在加载编辑器…
          </div>
        }
        width="100%"
        height={height}
      />
    </div>
  )
}

export default CodeEditor
