const MOBILE_TABS = [
  { id: 'variables', label: '变量', icon: '📊' },
  { id: 'chat', label: '对话', icon: '💬' },
  { id: 'code', label: '代码', icon: '⚡' },
  { id: 'preview', label: '预览', icon: '👁️' },
]

const MobileNavigation = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-sm pb-safe-bottom md:hidden animate-slide-up">
      <div className="flex items-center justify-around py-2 pb-safe-bottom">
        {MOBILE_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-all min-w-touch-target min-h-touch-target justify-center touch-manipulation ${
                isActive
                  ? 'text-accent bg-accent/10 shadow-sm animate-fade-in'
                  : 'text-muted hover:text-foreground hover:bg-background/50'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              role="tab"
              tabIndex={isActive ? 0 : -1}
            >
              <span className="text-base leading-none" aria-hidden="true">{tab.icon}</span>
              <span className="leading-none">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MobileNavigation