import { useMemo, useState } from 'react'
import ChatInterface from './ChatInterface.jsx'
import CodeEditor from './CodeEditor.jsx'
import CodeWorkspace from './CodeWorkspace.jsx'
import VariableEditor from './VariableEditor.jsx'
import MobileNavigation from './MobileNavigation.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAppState } from '../context/AppStateContext.jsx'

const formatTimestamp = (value) => {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

const OUTPUT_TABS = {
  html: { label: 'HTML Bundle', language: 'html' },
  yaml: { label: 'World Book YAML', language: 'yaml' },
  script: { label: 'Tavern Script', language: 'javascript' },
  regex: { label: '正则配置', language: 'plaintext' },
}

const Layout = () => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const { state } = useAppState()
  const { generatedArtifacts = {}, generationMeta } = state
  const [activeTab, setActiveTab] = useState('html')
  const [mobileActivePanel, setMobileActivePanel] = useState('variables')

  const codeEditorOptions = useMemo(
    () => ({
      lineNumbers: 'off',
      glyphMargin: false,
      folding: false,
      renderLineHighlight: 'none',
    }),
    [],
  )

  const activeConfig = OUTPUT_TABS[activeTab] ?? OUTPUT_TABS.html
  const editorValue = generatedArtifacts[activeTab] ?? ''
  const hasContent = Boolean(editorValue && editorValue.trim().length > 0)

  const renderMobileContent = () => {
    switch (mobileActivePanel) {
      case 'variables':
        return <VariableEditor />
      case 'chat':
        return <ChatInterface />
      case 'code':
        return (
          <div className="flex h-full flex-col gap-4">
            <div className="panel-header">
              <h2 className="panel-title">模板输出</h2>
              <span className="tag">代码</span>
            </div>
            <p className="text-sm text-muted">
              选择下方标签查看生成的 HTML、世界书 YAML、Tavern 脚本或正则配置，便于复制到 TavernAI 或其他部署环境。
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(OUTPUT_TABS).map(([key, config]) => {
                const isActive = key === activeTab
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      isActive
                        ? 'border-accent bg-accent text-white shadow'
                        : 'border-border bg-background text-muted hover:border-accent/60 hover:text-accent'
                    }`}
                  >
                    {config.label}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span>当前视图：{activeConfig.label}</span>
              {generationMeta?.generatedAt && <span>生成时间：{formatTimestamp(generationMeta.generatedAt)}</span>}
            </div>
            {!hasContent && (
              <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-xs text-muted">
                生成输出后将在此显示代码片段。
              </div>
            )}
            <div className="flex-1 min-h-0">
              <CodeEditor language={activeConfig.language} value={editorValue} readOnly options={codeEditorOptions} />
            </div>
          </div>
        )
      case 'preview':
        return <CodeWorkspace />
      default:
        return <VariableEditor />
    }
  }

  return (
    <div className="layout-container mobile-vh-fix bg-background text-foreground transition-colors duration-300">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6 md:gap-6 md:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 sm:space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent/80">
              MVU 状态栏生成器
            </p>
            <h1 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">变量驱动的 TavernAI 体验</h1>
            <p className="text-xs text-muted sm:text-sm">
              在统一的工作区中编排变量、调试对话并预览实际渲染的状态栏。
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-border bg-surface px-2 py-1.5 shadow-card sm:gap-3 sm:px-3 sm:py-2 sm:self-auto">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">主题</span>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
              aria-label="切换主题"
            >
              <span
                className={`h-2 w-2 rounded-full transition-all sm:h-2.5 sm:w-2.5 ${
                  isDark
                    ? 'bg-accent shadow-[0_0_0_4px_rgba(96,165,250,0.25)]'
                    : 'bg-accent/60 shadow-[0_0_0_4px_rgba(37,99,235,0.18)]'
                }`}
              />
              <span className="hidden sm:inline">{isDark ? '深色模式' : '浅色模式'}</span>
              <span className="sm:hidden">{isDark ? '深' : '浅'}</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content flex-1 min-h-0 responsive-transition">
          {/* Mobile Layout */}
          <div className="h-full md:hidden mobile-content-height">
            <div className="h-full pb-16">
              {renderMobileContent()}
            </div>
          </div>

          {/* Tablet Layout */}
          <div className="hidden h-full md:grid md:grid-cols-8 md:gap-4 lg:hidden">
            <div className="col-span-3 panel">
              <VariableEditor />
            </div>
            <div className="col-span-5 panel">
              <ChatInterface />
            </div>
            <div className="col-span-5 panel">
              <div className="flex h-full flex-col gap-4">
                <div className="panel-header">
                  <h2 className="panel-title">模板输出</h2>
                  <span className="tag">代码</span>
                </div>
                <p className="text-sm text-muted">
                  选择下方标签查看生成的 HTML、世界书 YAML、Tavern 脚本或正则配置，便于复制到 TavernAI 或其他部署环境。
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(OUTPUT_TABS).map(([key, config]) => {
                    const isActive = key === activeTab
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveTab(key)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          isActive
                            ? 'border-accent bg-accent text-white shadow'
                            : 'border-border bg-background text-muted hover:border-accent/60 hover:text-accent'
                        }`}
                      >
                        {config.label}
                      </button>
                    )
                  })}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <span>当前视图：{activeConfig.label}</span>
                  {generationMeta?.generatedAt && <span>生成时间：{formatTimestamp(generationMeta.generatedAt)}</span>}
                </div>
                {!hasContent && (
                  <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-xs text-muted">
                    生成输出后将在此显示代码片段。
                  </div>
                )}
                <div className="flex-1 min-h-0">
                  <CodeEditor language={activeConfig.language} value={editorValue} readOnly options={codeEditorOptions} />
                </div>
              </div>
            </div>
            <div className="col-span-8 panel min-h-[400px]">
              <CodeWorkspace />
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden h-full lg:grid lg:grid-cols-12 lg:gap-6 lg:auto-rows-[minmax(280px,_1fr)]">
            <section className="panel lg:col-span-3 lg:row-span-2">
              <VariableEditor />
            </section>
            <section className="panel lg:col-span-4">
              <ChatInterface />
            </section>
            <section className="panel lg:col-span-5">
              <div className="flex h-full flex-col gap-4">
                <div className="panel-header">
                  <h2 className="panel-title">模板输出</h2>
                  <span className="tag">代码</span>
                </div>
                <p className="text-sm text-muted">
                  选择下方标签查看生成的 HTML、世界书 YAML、Tavern 脚本或正则配置，便于复制到 TavernAI 或其他部署环境。
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(OUTPUT_TABS).map(([key, config]) => {
                    const isActive = key === activeTab
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveTab(key)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          isActive
                            ? 'border-accent bg-accent text-white shadow'
                            : 'border-border bg-background text-muted hover:border-accent/60 hover:text-accent'
                        }`}
                      >
                        {config.label}
                      </button>
                    )
                  })}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <span>当前视图：{activeConfig.label}</span>
                  {generationMeta?.generatedAt && <span>生成时间：{formatTimestamp(generationMeta.generatedAt)}</span>}
                </div>
                {!hasContent && (
                  <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-xs text-muted">
                    生成输出后将在此显示代码片段。
                  </div>
                )}
                <div className="flex-1 min-h-0">
                  <CodeEditor language={activeConfig.language} value={editorValue} readOnly options={codeEditorOptions} />
                </div>
              </div>
            </section>
            <section className="panel lg:col-span-7 lg:row-span-1 min-h-[500px]">
              <CodeWorkspace />
            </section>
          </div>
        </main>

        {/* Mobile Navigation */}
        <MobileNavigation 
          activeTab={mobileActivePanel} 
          onTabChange={setMobileActivePanel} 
        />
      </div>
    </div>
  )
}

export default Layout
