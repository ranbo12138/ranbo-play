import ChatInterface from './ChatInterface.jsx'
import CodeEditor from './CodeEditor.jsx'
import PreviewPanel from './PreviewPanel.jsx'
import VariableEditor from './VariableEditor.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

const Layout = () => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent/80">
              MVU 状态栏生成器
            </p>
            <h1 className="text-3xl font-semibold sm:text-4xl">变量驱动的 TavernAI 体验</h1>
            <p className="text-sm text-muted">
              在统一的工作区中编排变量、调试对话并预览实际渲染的状态栏。
            </p>
          </div>
          <div className="flex items-center gap-3 self-start rounded-full border border-border bg-surface px-3 py-2 shadow-card sm:self-auto">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">主题</span>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              aria-label="切换主题"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  isDark
                    ? 'bg-accent shadow-[0_0_0_4px_rgba(96,165,250,0.25)]'
                    : 'bg-accent/60 shadow-[0_0_0_4px_rgba(37,99,235,0.18)]'
                }`}
              />
              {isDark ? '深色模式' : '浅色模式'}
            </button>
          </div>
        </header>

        <main className="grid flex-1 gap-6 lg:grid-cols-12 lg:auto-rows-[minmax(220px,_1fr)]">
          <section className="panel lg:col-span-3 lg:row-span-2">
            <VariableEditor />
          </section>
          <section className="panel lg:col-span-5">
            <ChatInterface />
          </section>
          <section className="panel lg:col-span-4 lg:row-span-2">
            <PreviewPanel />
          </section>
          <section className="panel lg:col-span-5">
            <CodeEditor />
          </section>
        </main>
      </div>
    </div>
  )
}

export default Layout
