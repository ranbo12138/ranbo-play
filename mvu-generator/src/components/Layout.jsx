import { useEffect, useMemo, useState } from 'react'
import ChatInterface from './ChatInterface.jsx'
import CodeEditor from './CodeEditor.jsx'
import PreviewPanel from './PreviewPanel.jsx'
import SplitPane from './SplitPane.jsx'
import VariableEditor from './VariableEditor.jsx'
import useBreakpoints from '../hooks/useBreakpoints.js'
import { useTheme } from '../context/ThemeContext.jsx'

const CODE_PLACEHOLDER = `// TODO: 生成 MVU 模板
export const statusBar = {
  theme: 'tailwind',
  variables: {
    mood: '{{ mood }}',
    energy: '{{ energy }}',
    focus: '{{ focus }}',
  },
  slots: {
    default: [
      '⚡ 能量值: {{ energy }}',
      '🧠 当前状态: {{ mood | title }}',
      '🎯 专注度: {{ focus }}',
    ],
  },
}
`

const MOBILE_TABS = [
  { id: 'variables', label: '变量', icon: '🧮' },
  { id: 'chat', label: '对话', icon: '💬' },
  { id: 'code', label: '代码', icon: '⌨️' },
  { id: 'preview', label: '预览', icon: '🖥️' },
]

const Layout = () => {
  const { theme, toggleTheme } = useTheme()
  const breakpoints = useBreakpoints()
  const isDark = theme === 'dark'

  const isDesktop = breakpoints.isDesktop
  const isTablet = breakpoints.isTablet

  const [activeMobileTab, setActiveMobileTab] = useState('preview')
  const [tabletDrawer, setTabletDrawer] = useState(null)

  useEffect(() => {
    if (!isTablet) {
      setTabletDrawer(null)
    }
  }, [isTablet])

  useEffect(() => {
    if (!tabletDrawer) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setTabletDrawer(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [tabletDrawer])

  const codeEditorOptions = useMemo(
    () => ({
      lineNumbers: 'off',
      glyphMargin: false,
      folding: false,
      renderLineHighlight: 'none',
    }),
    [],
  )

  const sideToggleClass = (isActive) =>
    [
      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
      isActive
        ? 'border-accent bg-accent/10 text-accent shadow-inner'
        : 'border-border bg-background hover:border-accent hover:text-accent',
    ].join(' ')

  const VariablesPanel = ({ className = '' }) => (
    <section className={`panel h-full overflow-hidden ${className}`.trim()}>
      <VariableEditor />
    </section>
  )

  const ChatPanel = ({ className = '' }) => (
    <section className={`panel h-full overflow-hidden ${className}`.trim()}>
      <ChatInterface />
    </section>
  )

  const PreviewPanelCard = ({ className = '' }) => (
    <section className={`panel h-full overflow-hidden ${className}`.trim()}>
      <PreviewPanel />
    </section>
  )

  const CodeWorkspace = ({ className = '' }) => (
    <section className={`panel h-full overflow-hidden ${className}`.trim()}>
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
        <div className="panel-header">
          <h2 className="panel-title">模板输出</h2>
          <span className="tag">Code</span>
        </div>
        <p className="text-sm text-muted">
          Tailwind 主题与 MVU 模板片段将在此生成，便于复制到 TavernAI 或其他部署环境。
        </p>
        <div className="flex min-h-0 flex-1">
          <CodeEditor language="javascript" value={CODE_PLACEHOLDER} readOnly options={codeEditorOptions} />
        </div>
      </div>
    </section>
  )

  const renderMobilePanel = () => {
    switch (activeMobileTab) {
      case 'variables':
        return <VariablesPanel />
      case 'chat':
        return <ChatPanel />
      case 'code':
        return <CodeWorkspace />
      case 'preview':
      default:
        return <PreviewPanelCard />
    }
  }

  const MobileDock = () => (
    <nav className="mobile-dock" aria-label="工作区切换">
      {MOBILE_TABS.map((tab) => {
        const isActive = activeMobileTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            className={`mobile-dock__button ${isActive ? 'mobile-dock__button--active' : ''}`.trim()}
            onClick={() => setActiveMobileTab(tab.id)}
            aria-pressed={isActive}
          >
            <span aria-hidden="true">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )

  const TabletDrawer = ({ id, side, title, open, onClose, children }) => {
    const justify = side === 'left' ? 'justify-start' : 'justify-end'
    const closedTransform = side === 'left' ? '-translate-x-[120%]' : 'translate-x-[120%]'
    const drawerState = open
      ? 'pointer-events-auto translate-x-0 opacity-100'
      : `${closedTransform} opacity-0 pointer-events-none`
    const overlayPointer = open ? 'pointer-events-auto' : 'pointer-events-none'

    return (
      <div className={`absolute inset-0 z-30 ${overlayPointer}`}>
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          className={`tablet-drawer__backdrop ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={onClose}
          aria-label="关闭侧边面板"
        />
        <div className={`absolute inset-y-4 flex w-full px-4 ${justify}`}>
          <div
            id={id}
            role="dialog"
            aria-modal={open ? 'true' : undefined}
            aria-hidden={open ? 'false' : 'true'}
            aria-label={title}
            className={`tablet-drawer ${drawerState}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                关闭
              </button>
            </div>
            <div className="flex min-h-0 flex-1 overflow-hidden">{children}</div>
          </div>
        </div>
      </div>
    )
  }

  const renderDesktopLayout = () => (
    <div className="flex h-full min-h-0">
      <SplitPane
        direction="horizontal"
        className="flex-1"
        initialRatio={0.5}
        minPrimary={380}
        minSecondary={420}
        storageKey="desktop-main"
        ariaLabel="调整左侧与右侧区域的宽度"
      >
        <SplitPane
          direction="vertical"
          initialRatio={0.6}
          minPrimary={320}
          minSecondary={280}
          storageKey="desktop-left"
          ariaLabel="调整变量与对话区域的高度"
        >
          <VariablesPanel />
          <ChatPanel />
        </SplitPane>
        <SplitPane
          direction="vertical"
          initialRatio={0.55}
          minPrimary={320}
          minSecondary={260}
          storageKey="desktop-right"
          ariaLabel="调整预览与代码区域的高度"
        >
          <PreviewPanelCard />
          <CodeWorkspace />
        </SplitPane>
      </SplitPane>
    </div>
  )

  const renderTabletLayout = () => (
    <div className="relative flex h-full min-h-0">
      <SplitPane
        direction="horizontal"
        className="flex-1"
        initialRatio={0.56}
        minPrimary={360}
        minSecondary={360}
        storageKey="tablet-main"
        ariaLabel="调整编辑器与预览区域的宽度"
      >
        <CodeWorkspace />
        <PreviewPanelCard />
      </SplitPane>

      <TabletDrawer
        id="tablet-drawer-variables"
        side="left"
        title="变量面板"
        open={tabletDrawer === 'variables'}
        onClose={() => setTabletDrawer(null)}
      >
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <VariableEditor />
        </div>
      </TabletDrawer>

      <TabletDrawer
        id="tablet-drawer-chat"
        side="right"
        title="对话面板"
        open={tabletDrawer === 'chat'}
        onClose={() => setTabletDrawer(null)}
      >
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </TabletDrawer>
    </div>
  )

  const renderMobileLayout = () => (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div key={activeMobileTab} className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          {renderMobilePanel()}
        </div>
      </div>
      <MobileDock />
    </div>
  )

  return (
    <div className="min-h-[100svh] bg-background text-foreground transition-colors duration-300">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col gap-6 px-4 py-6 xs:px-5 tablet:px-6 desktop:px-8">
        <header className="flex flex-col gap-4 tablet:gap-6 desktop:flex-row desktop:items-center desktop:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent/80">
              MVU 状态栏生成器
            </p>
            <h1 className="text-3xl font-semibold tablet:text-4xl">变量驱动的 TavernAI 体验</h1>
            <p className="text-sm text-muted">
              在统一的工作区中编排变量、调试对话并预览实际渲染的状态栏。
            </p>
          </div>
          <div className="flex flex-col gap-3 tablet:items-end desktop:flex-row desktop:items-center desktop:gap-4">
            {isTablet && (
              <div className="flex w-full flex-wrap gap-2 tablet:justify-end desktop:w-auto">
                <button
                  type="button"
                  onClick={() =>
                    setTabletDrawer((prev) => (prev === 'variables' ? null : 'variables'))
                  }
                  className={sideToggleClass(tabletDrawer === 'variables')}
                  aria-controls="tablet-drawer-variables"
                  aria-expanded={tabletDrawer === 'variables'}
                >
                  <span aria-hidden="true">🧮</span> 变量侧栏
                </button>
                <button
                  type="button"
                  onClick={() => setTabletDrawer((prev) => (prev === 'chat' ? null : 'chat'))}
                  className={sideToggleClass(tabletDrawer === 'chat')}
                  aria-controls="tablet-drawer-chat"
                  aria-expanded={tabletDrawer === 'chat'}
                >
                  <span aria-hidden="true">💬</span> 聊天侧栏
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 self-start rounded-full border border-border bg-surface px-3 py-2 shadow-card tablet:self-auto">
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
          </div>
        </header>

        <main className="flex-1 min-h-0">
          {isDesktop ? renderDesktopLayout() : isTablet ? renderTabletLayout() : renderMobileLayout()}
        </main>
      </div>
    </div>
  )
}

export default Layout
