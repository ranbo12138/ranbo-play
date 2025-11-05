import { useEffect, useMemo, useRef, useState } from 'react'

const DEVICE_PRESETS = {
  desktop: { label: '桌面', description: '1280px', maxWidth: 1280 },
  tablet: { label: '平板', description: '834px', maxWidth: 834 },
  mobile: { label: '移动', description: '414px', maxWidth: 414 },
}

const BACKGROUND_PRESETS = {
  light: { label: '浅色背景', fill: '#f8fafc' },
  dark: { label: '深色背景', fill: '#0b1120' },
}

const DEFAULT_STAT_DATA = {
  display_name: '先锋诺拉',
  mood: 'Focused',
  energy: 0.78,
  focus: 0.62,
  location: '白塔 · 观测层',
  quest: '校准元素调谐器',
}

const DEFAULT_HTML = `
<div data-component="status-card" class="status-card">
  <header class="status-card__header">
    <div class="status-card__scope">
      <span class="status-card__hint">当前任务</span>
      <span class="status-card__title" data-field="quest">加载中…</span>
    </div>
    <span class="status-card__badge" data-field="mood">—</span>
  </header>
  <section class="status-card__body">
    <div class="status-card__row">
      <span class="status-card__label">能量</span>
      <div class="status-card__metric" data-field="energy-meter">
        <span class="status-card__metric-bar" data-field="energy-bar"></span>
        <span class="status-card__metric-value" data-field="energy">0%</span>
      </div>
    </div>
    <div class="status-card__row">
      <span class="status-card__label">专注</span>
      <div class="status-card__metric" data-field="focus-meter">
        <span class="status-card__metric-bar" data-field="focus-bar"></span>
        <span class="status-card__metric-value" data-field="focus">0%</span>
      </div>
    </div>
  </section>
  <footer class="status-card__footer">
    <div class="status-card__footer-item">
      <span class="status-card__hint">定位</span>
      <span class="status-card__text" data-field="location">坐标装载中…</span>
    </div>
    <div class="status-card__footer-item">
      <span class="status-card__hint">角色</span>
      <span class="status-card__text" data-field="display_name">—</span>
    </div>
  </footer>
</div>
`

const DEFAULT_CSS = `
:root {
  color-scheme: light;
  font-family: 'Inter', 'Noto Sans SC', system-ui, -apple-system, 'Segoe UI', sans-serif;
}

body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #f8fafc;
  transition: background 0.3s ease;
}

body.theme-dark {
  background: radial-gradient(circle at top, rgba(59, 130, 246, 0.18), transparent 55%), #050816;
  color-scheme: dark;
}

.status-card {
  width: clamp(280px, 100%, 420px);
  display: grid;
  gap: 18px;
  padding: 24px;
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.94);
  color: #f8fafc;
  box-shadow: 0 32px 72px rgba(8, 11, 22, 0.55);
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

body.theme-light .status-card {
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
  box-shadow: 0 32px 72px rgba(15, 23, 42, 0.18);
}

.status-card::before {
  content: '';
  position: absolute;
  inset: -40% -60% auto auto;
  height: 280px;
  aspect-ratio: 1 / 1;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.35), transparent 62%);
  pointer-events: none;
  opacity: 0.48;
}

body.theme-light .status-card::before {
  background: radial-gradient(circle, rgba(37, 99, 235, 0.22), transparent 58%);
}

.status-card__header,
.status-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.status-card__body {
  display: grid;
  gap: 14px;
}

.status-card__scope {
  display: grid;
  gap: 6px;
}

.status-card__row {
  display: grid;
  gap: 8px;
}

.status-card__label {
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.72;
}

body.theme-light .status-card__label {
  opacity: 0.62;
}

.status-card__metric {
  position: relative;
  isolation: isolate;
  height: 18px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.22);
  overflow: hidden;
  display: flex;
  align-items: center;
  padding-inline: 8px;
}

body.theme-light .status-card__metric {
  background: rgba(148, 163, 184, 0.18);
}

.status-card__metric-bar {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #38bdf8 0%, #6366f1 45%, #a855f7 100%);
  transform-origin: left center;
  width: var(--fill, 12%);
  transition: width 420ms cubic-bezier(0.4, 0, 0.2, 1);
}

body.theme-light .status-card__metric-bar {
  background: linear-gradient(90deg, #22d3ee 0%, #2563eb 52%, #7c3aed 100%);
}

.status-card__metric-value {
  position: relative;
  z-index: 1;
  margin-left: auto;
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.status-card__title {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.status-card__badge {
  align-self: flex-start;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  background: rgba(96, 165, 250, 0.18);
  color: #bfdbfe;
  letter-spacing: 0.08em;
}

body.theme-light .status-card__badge {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.status-card__hint {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  opacity: 0.68;
}

.status-card__text {
  display: block;
  margin-top: 4px;
  font-size: 0.95rem;
  font-weight: 500;
}

.status-card__footer-item {
  display: grid;
  gap: 4px;
}
`

const DEFAULT_SCRIPT = `
function toPercent(value) {
  if (value === undefined || value === null) return '0%'
  const numeric = typeof value === 'number' ? value : Number.parseFloat(value)
  if (Number.isNaN(numeric)) return '0%'
  const scaled = numeric <= 1 ? numeric * 100 : numeric
  return Math.max(0, Math.min(100, Math.round(scaled))) + '%'
}

function applyMetric(name, raw) {
  const meter = document.querySelector('[data-field="' + name + '-meter"]')
  const bar = document.querySelector('[data-field="' + name + '-bar"]')
  const value = document.querySelector('[data-field="' + name + '"]')
  if (!meter || !bar || !value) return
  const percent = toPercent(raw)
  value.textContent = percent
  bar.style.setProperty('--fill', percent)
}

function setText(name, raw, fallback) {
  const node = document.querySelector('[data-field="' + name + '"]')
  if (!node) return
  const content = raw === undefined || raw === null || raw === '' ? fallback : raw
  node.textContent = content ?? fallback ?? '—'
}

const statData = window.MVU_DATA?.stat_data || {}
setText('display_name', statData.display_name, '未知角色')
setText('location', statData.location, '未定位坐标')
setText('quest', statData.quest, '任务同步中…')
setText('mood', (statData.mood || '安定').toUpperCase())
applyMetric('energy', statData.energy)
applyMetric('focus', statData.focus)
`

const RENDER_DEBOUNCE = 220

const escapeScriptTag = (value = '') => value.replace(/<\/script/gi, '<\\/script')

const buildPreviewDocument = ({ html, css, script, statData, background, theme }) => {
  const safeHtml = escapeScriptTag(html)
  const safeScript = escapeScriptTag(script)
  const dataJson = JSON.stringify({ stat_data: statData ?? {} })

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      html { height: 100%; }
      body {
        background: ${background};
      }
      ${css}
    </style>
  </head>
  <body class="theme-${theme}">
    <div id="mvu-root">${safeHtml}</div>
    <script>
      window.MVU_DATA = ${dataJson};
      window.addEventListener('message', function(event) {
        if (!event || !event.data || event.data.source !== 'mvu-preview-host') return;
        if (event.data.type === 'update-data') {
          window.MVU_DATA = event.data.payload;
        }
        if (event.data.type === 'update-background') {
          document.body.style.background = event.data.payload;
        }
      });
    </script>
    <script>
      (function() {
        const postError = (payload) => {
          if (!window.parent || !window.parent.postMessage) return;
          window.parent.postMessage({ source: 'mvu-preview', type: 'runtime-error', payload }, '*');
        };

        window.addEventListener('error', (event) => {
          if (!event) return;
          postError({
            message: event.message || '脚本执行错误',
            line: event.lineno || 0,
            column: event.colno || 0,
            stack: event.error?.stack || null,
          });
        });

        window.addEventListener('unhandledrejection', (event) => {
          const reason = event.reason || {};
          postError({
            message: reason.message || String(reason),
            stack: reason.stack || null,
          });
        });

        try {
          ${safeScript}
        } catch (error) {
          postError({
            message: error?.message || String(error),
            stack: error?.stack || null,
          });
        }
      })();
    </script>
  </body>
</html>`
}

const PreviewPanel = ({ definition = null }) => {
  const iframeRef = useRef(null)
  const debounceRef = useRef(null)

  const [device, setDevice] = useState('desktop')
  const [canvas, setCanvas] = useState('light')
  const [manualRefresh, setManualRefresh] = useState(0)
  const [frameKey, setFrameKey] = useState(0)
  const [srcDoc, setSrcDoc] = useState(() =>
    buildPreviewDocument({
      html: (definition && typeof definition === 'object' && definition.html) || DEFAULT_HTML,
      css: (definition && typeof definition === 'object' && definition.css) || DEFAULT_CSS,
      script: (definition && typeof definition === 'object' && definition.script) || DEFAULT_SCRIPT,
      statData: (definition && typeof definition === 'object' && definition.statData) || DEFAULT_STAT_DATA,
      background: BACKGROUND_PRESETS.light.fill,
      theme: 'light',
    }),
  )
  const [runtimeError, setRuntimeError] = useState(null)

  const activeDefinition = useMemo(() => {
    if (definition && typeof definition === 'object') {
      return {
        html: definition.html ?? DEFAULT_HTML,
        css: definition.css ?? DEFAULT_CSS,
        script: definition.script ?? DEFAULT_SCRIPT,
        statData: definition.statData ?? DEFAULT_STAT_DATA,
      }
    }

    return {
      html: DEFAULT_HTML,
      css: DEFAULT_CSS,
      script: DEFAULT_SCRIPT,
      statData: DEFAULT_STAT_DATA,
    }
  }, [definition])

  const backgroundPreset = useMemo(
    () => BACKGROUND_PRESETS[canvas] ?? BACKGROUND_PRESETS.light,
    [canvas],
  )

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(() => {
      const documentHtml = buildPreviewDocument({
        html: activeDefinition.html,
        css: activeDefinition.css,
        script: activeDefinition.script,
        statData: activeDefinition.statData,
        background: backgroundPreset.fill,
        theme: canvas,
      })
      setSrcDoc(documentHtml)
      setRuntimeError(null)
    }, RENDER_DEBOUNCE)

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [activeDefinition, backgroundPreset, canvas, manualRefresh])

  useEffect(() => {
    const handleMessage = (event) => {
      if (!event?.data || event.data.source !== 'mvu-preview') return
      if (event.source !== iframeRef.current?.contentWindow) return

      if (event.data.type === 'runtime-error') {
        setRuntimeError(event.data.payload || { message: '预览脚本执行错误' })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  const handleRefresh = () => {
    setManualRefresh((prev) => prev + 1)
    setFrameKey((prev) => prev + 1)
    setRuntimeError(null)
  }

  const handleCanvasToggle = (next) => {
    if (canvas === next) return
    setCanvas(next)
  }

  const frameWrapperStyle = useMemo(() => {
    const preset = DEVICE_PRESETS[device]
    if (!preset?.maxWidth) {
      return { width: '100%' }
    }

    return { width: '100%', maxWidth: `${preset.maxWidth}px` }
  }, [device])

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="panel-header">
        <h2 className="panel-title">实时预览</h2>
        <span className="tag">Preview</span>
      </div>
      <p className="text-sm text-muted">
        渲染生成的 UI 代码，并以隔离沙箱安全执行脚本，实时验证 MVU 变量注入后的表现。
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          刷新预览
        </button>
        <div className="ml-auto flex items-center gap-2">
          {Object.entries(BACKGROUND_PRESETS).map(([key, preset]) => {
            const isActive = canvas === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleCanvasToggle(key)}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  isActive
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border/80 bg-background/70 text-muted hover:border-accent/60 hover:text-accent'
                }`}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted">
        查看尺寸：
        {Object.entries(DEVICE_PRESETS).map(([key, preset]) => {
          const isActive = device === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setDevice(key)}
              className={`rounded-full border px-3 py-1 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                isActive
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border/70 text-muted hover:border-accent/60 hover:text-accent'
              }`}
            >
              {preset.label}
            </button>
          )
        })}
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-background/50 shadow-inner">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: backgroundPreset.fill, transition: 'background 0.3s ease' }}
        />
        <div className="relative flex flex-1 items-center justify-center p-6">
          <div className="relative w-full transition-all" style={frameWrapperStyle}>
            <iframe
              key={frameKey}
              ref={iframeRef}
              title="MVU Preview"
              sandbox="allow-scripts allow-same-origin"
              srcDoc={srcDoc}
              className="h-[520px] w-full rounded-[24px] border border-border/90 bg-white shadow-2xl"
            />
            {runtimeError && (
              <div className="absolute inset-6 z-20 flex flex-col gap-3 rounded-2xl border border-red-400/40 bg-red-950/80 p-5 text-left text-sm text-red-100 shadow-lg">
                <div className="font-semibold text-red-100">预览渲染失败</div>
                <p className="text-xs leading-relaxed text-red-100/80">{runtimeError.message || '脚本执行出现错误。'}</p>
                {runtimeError.stack && (
                  <pre className="max-h-40 overflow-auto rounded-xl bg-black/40 p-3 text-[11px] leading-relaxed text-red-100/80">
                    {runtimeError.stack}
                  </pre>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRuntimeError(null)}
                    className="inline-flex items-center rounded-full border border-red-300/60 px-3 py-1 text-xs font-medium text-red-100 transition hover:border-red-200 hover:text-white"
                  >
                    忽略
                  </button>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="inline-flex items-center rounded-full border border-accent/80 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/20"
                  >
                    重新加载
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreviewPanel
