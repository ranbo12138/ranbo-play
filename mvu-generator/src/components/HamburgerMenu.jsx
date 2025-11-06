import { useState, useRef, useEffect } from 'react'

const MOBILE_MENU_ITEMS = [
  { id: 'variables', label: '变量编辑器', icon: '📊' },
  { id: 'chat', label: 'AI 助手', icon: '💬' },
  { id: 'code', label: '代码编辑器', icon: '⚡' },
  { id: 'preview', label: '预览', icon: '👁️' },
]

const HamburgerMenu = ({ activePanel, onPanelChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleMenuItemClick = (panelId) => {
    onPanelChange(panelId)
    setIsOpen(false)
  }

  return (
    <>
      {/* Menu Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 flex items-center justify-center w-11 h-11 rounded-lg border border-border bg-surface/80 backdrop-blur-sm text-foreground hover:border-accent hover:text-accent transition-colors md:hidden touch-manipulation"
        aria-label="打开菜单"
        aria-expanded={isOpen}
      >
        <div className="relative w-5 h-4 flex flex-col justify-center">
          <span
            className={`absolute h-0.5 w-5 bg-current transition-all duration-300 ${
              isOpen ? 'top-2 rotate-45' : 'top-0'
            }`}
          />
          <span
            className={`absolute h-0.5 w-5 bg-current transition-all duration-300 ${
              isOpen ? 'opacity-0' : 'top-1.5'
            }`}
          />
          <span
            className={`absolute h-0.5 w-5 bg-current transition-all duration-300 ${
              isOpen ? 'top-2 -rotate-45' : 'top-3'
            }`}
          />
        </div>
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Panel */}
          <div 
            ref={menuRef}
            className="absolute top-0 left-0 bottom-0 w-72 max-w-[80vw] bg-surface border-r border-border shadow-xl animate-slide-up"
          >
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">导航菜单</h2>
                  <p className="text-sm text-muted">选择要查看的面板</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-background/50 transition-colors touch-manipulation"
                  aria-label="关闭菜单"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 p-2">
                <ul className="space-y-1">
                  {MOBILE_MENU_ITEMS.map((item) => {
                    const isActive = activePanel === item.id
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => handleMenuItemClick(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all touch-manipulation min-h-touch-target ${
                            isActive
                              ? 'bg-accent/10 text-accent border border-accent/20'
                              : 'text-muted hover:text-foreground hover:bg-background/50'
                          }`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <span className="text-xl flex-shrink-0" aria-hidden="true">
                            {item.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{item.label}</div>
                            {isActive && (
                              <div className="text-xs text-accent/80">当前面板</div>
                            )}
                          </div>
                          {isActive && (
                            <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              {/* Menu Footer */}
              <div className="p-4 border-t border-border">
                <div className="text-xs text-muted text-center">
                  轻触外部区域关闭菜单
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default HamburgerMenu