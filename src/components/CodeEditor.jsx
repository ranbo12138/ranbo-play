import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { configureMonacoYaml } from 'monaco-yaml';
import { WORKSPACE_TABS, diffArtifacts } from '../utils/workspace.js';

const STATUS_TIMEOUT = 3600;

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    borderRadius: '14px',
    border: '1px solid #dbe3f0',
    background: '#f8fbff',
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.14)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
  },
  subtitle: {
    fontSize: '12px',
    color: '#475569',
  },
  meta: {
    fontSize: '11px',
    color: '#64748b',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolbarGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  templateSelect: {
    minWidth: '180px',
    padding: '8px 10px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    fontSize: '12px',
    color: '#1f2937',
  },
  toolbarLabel: {
    fontSize: '12px',
    color: '#475569',
    fontWeight: 500,
  },
  button: {
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid transparent',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    background: '#ffffff',
    color: '#1f2937',
    transition: 'all 0.2s ease',
  },
  buttonPrimary: {
    background: '#2563eb',
    borderColor: '#1d4ed8',
    color: '#ffffff',
  },
  buttonSecondary: {
    background: '#eff6ff',
    borderColor: '#bfdbfe',
    color: '#1d4ed8',
  },
  buttonDanger: {
    background: '#fee2e2',
    borderColor: '#fecaca',
    color: '#b91c1c',
  },
  buttonGhost: {
    background: 'transparent',
    borderColor: '#cbd5e1',
    color: '#334155',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  status: {
    padding: '8px 10px',
    borderRadius: '10px',
    fontSize: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusSuccess: {
    background: '#dcfce7',
    border: '1px solid #86efac',
    color: '#166534',
  },
  statusError: {
    background: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#991b1b',
  },
  statusInfo: {
    background: '#e0f2fe',
    border: '1px solid #bae6fd',
    color: '#0c4a6e',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  tab: {
    padding: '6px 12px',
    borderRadius: '999px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    fontSize: '12px',
    fontWeight: 500,
    color: '#475569',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    background: '#2563eb',
    borderColor: '#1d4ed8',
    color: '#ffffff',
  },
  tabDirtyDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#f97316',
  },
  surface: {
    display: 'flex',
    gap: '12px',
  },
  editorColumn: {
    flex: 1,
    minHeight: '320px',
    background: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    display: 'flex',
  },
  editorInner: {
    flex: 1,
    display: 'flex',
  },
  aiPanel: {
    width: '280px',
    minWidth: '240px',
    maxWidth: '320px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  aiPanelTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a',
  },
  aiPanelBody: {
    flex: 1,
    fontSize: '12px',
    lineHeight: 1.6,
    color: '#1f2937',
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
  },
};

const isBrowser = typeof window !== 'undefined';

const getRootFontSize = () => {
  if (!isBrowser) {
    return 16;
  }

  const computed = window.getComputedStyle(window.document.documentElement);
  const parsed = Number.parseFloat(computed.fontSize);
  return Number.isFinite(parsed) ? parsed : 16;
};

let yamlService = null;

const CodeEditor = ({
  artifacts = {},
  baseline = {},
  meta = {},
  templates = [],
  currentTemplate,
  latestAssistantMessage,
  onChange,
  onExport,
  onSaveTemplate,
  onLoadTemplate,
  onRenameTemplate,
  onDeleteTemplate,
  onActiveTabChange,
}) => {
  const initialTab = useMemo(() => WORKSPACE_TABS[0]?.id ?? 'html', []);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [fontSize, setFontSize] = useState(getRootFontSize);
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate || '');
  const [status, setStatus] = useState(null);

  const editorRefs = useRef({});

  useEffect(() => {
    if (!isBrowser) {
      return undefined;
    }

    const handleResize = () => {
      setFontSize(getRootFontSize());
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    setSelectedTemplate(currentTemplate || '');
  }, [currentTemplate]);

  const dirtyMap = useMemo(() => diffArtifacts(artifacts, baseline), [artifacts, baseline]);
  const hasUnsavedChanges = useMemo(
    () => Object.values(dirtyMap).some(Boolean),
    [dirtyMap]
  );

  const activeTabConfig = useMemo(
    () => WORKSPACE_TABS.find((tab) => tab.id === activeTab) || WORKSPACE_TABS[0],
    [activeTab]
  );

  const activeContent = useMemo(
    () => (artifacts?.[activeTabConfig?.id] ?? ''),
    [artifacts, activeTabConfig]
  );

  const formatTimestamp = useCallback((value) => {
    if (!value) return '';
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value));
    } catch (error) {
      return value;
    }
  }, []);

  const showStatusMessage = useCallback((type, text) => {
    setStatus({ type, text, at: Date.now() });
  }, []);

  useEffect(() => {
    if (!status || !isBrowser) return undefined;

    const timer = window.setTimeout(() => setStatus(null), STATUS_TIMEOUT);
    return () => window.clearTimeout(timer);
  }, [status]);

  const handleTabChange = useCallback(
    (nextTab) => {
      if (nextTab === activeTab) return;

      if (dirtyMap[activeTab]) {
        const confirmed = !isBrowser || window.confirm('当前标签页存在未保存的修改，确定切换吗？');
        if (!confirmed) {
          return;
        }
      }

      setActiveTab(nextTab);
      if (typeof onActiveTabChange === 'function') {
        onActiveTabChange(nextTab);
      }
    },
    [activeTab, dirtyMap, onActiveTabChange]
  );

  const handleEditorDidMount = useCallback((tabId, editorInstance, monacoInstance) => {
    editorRefs.current[tabId] = { editor: editorInstance, monaco: monacoInstance };

    if (tabId === 'yaml' && monacoInstance && !yamlService) {
      yamlService = configureMonacoYaml(monacoInstance, {
        enableSchemaRequest: false,
        hover: true,
        completion: true,
        format: true,
      });
    }

    const formatAction = editorInstance.getAction('editor.action.formatDocument');
    if (formatAction && monacoInstance) {
      editorInstance.addCommand(
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
        () => {
          formatAction.run();
        }
      );
    }
  }, []);

  const handleEditorChange = useCallback(
    (tabId, value) => {
      if (typeof onChange === 'function') {
        onChange(tabId, value ?? '');
      }
    },
    [onChange]
  );

  const handleCopy = useCallback(async () => {
    const content = artifacts?.[activeTabConfig?.id] ?? '';
    if (!content) {
      showStatusMessage('info', '当前片段为空，未复制。');
      return;
    }

    try {
      const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
      if (clipboard?.writeText) {
        await clipboard.writeText(content);
      } else if (isBrowser) {
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } else {
        throw new Error('Clipboard not supported');
      }
      showStatusMessage('success', '代码已复制到剪贴板。');
    } catch (error) {
      console.warn('[CodeEditor] Failed to copy snippet', error);
      showStatusMessage('error', '复制失败，请手动复制。');
    }
  }, [artifacts, activeTabConfig?.id, showStatusMessage]);

  const handleDownload = useCallback(() => {
    if (!isBrowser || typeof document === 'undefined') {
      showStatusMessage('error', '当前环境不支持下载。');
      return;
    }

    const content = artifacts?.[activeTabConfig?.id] ?? '';
    const defaultName = `${(activeTabConfig?.label || 'snippet').toLowerCase()}.txt`;
    const fileName = activeTabConfig?.fileName || defaultName;

    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showStatusMessage('success', `已下载 ${fileName}`);
    } catch (error) {
      console.warn('[CodeEditor] Failed to download snippet', error);
      showStatusMessage('error', '下载失败，请尝试手动复制。');
    }
  }, [artifacts, activeTabConfig, showStatusMessage]);

  const handleFormat = useCallback(async () => {
    const tabId = activeTabConfig?.id;
    const ref = tabId ? editorRefs.current[tabId] : null;

    if (!ref?.editor) {
      showStatusMessage('info', '编辑器尚未就绪，无法格式化。');
      return;
    }

    if (!activeTabConfig?.canFormat) {
      showStatusMessage('info', '当前语言暂不支持自动格式化。');
      return;
    }

    try {
      const action = ref.editor.getAction('editor.action.formatDocument');
      if (action) {
        await action.run();
        showStatusMessage('success', '已完成格式化。');
      } else {
        showStatusMessage('info', '当前语言暂不支持自动格式化。');
      }
    } catch (error) {
      console.warn('[CodeEditor] Format action failed', error);
      showStatusMessage('error', '格式化失败。');
    }
  }, [activeTabConfig, showStatusMessage]);

  const handleToggleAiPanel = useCallback(() => {
    setShowAiPanel((prev) => !prev);
  }, []);

  const confirmDiscardIfNeeded = useCallback(() => {
    if (!hasUnsavedChanges) return true;
    if (!isBrowser) return true;
    return window.confirm('当前工作区存在未保存的修改，确定继续吗？');
  }, [hasUnsavedChanges]);

  const handleSaveTemplate = useCallback(async () => {
    if (typeof onSaveTemplate !== 'function') return;
    if (!isBrowser) {
      showStatusMessage('error', '当前环境不支持模板保存。');
      return;
    }

    const suggestedName = currentTemplate || '';
    const input = window.prompt('请输入模板名称', suggestedName);
    if (!input) {
      return;
    }

    const trimmed = input.trim();
    if (!trimmed) {
      showStatusMessage('info', '模板名称不能为空。');
      return;
    }

    try {
      await Promise.resolve(onSaveTemplate(trimmed));
      setSelectedTemplate(trimmed);
      showStatusMessage('success', '模板已保存。');
    } catch (error) {
      console.warn('[CodeEditor] Failed to save template', error);
      showStatusMessage('error', error?.message || '保存模板失败。');
    }
  }, [currentTemplate, onSaveTemplate, showStatusMessage]);

  const handleLoadTemplate = useCallback(async () => {
    if (typeof onLoadTemplate !== 'function') return;
    if (!selectedTemplate) {
      showStatusMessage('info', '请选择要加载的模板。');
      return;
    }

    if (!confirmDiscardIfNeeded()) {
      return;
    }

    try {
      await Promise.resolve(onLoadTemplate(selectedTemplate));
      showStatusMessage('success', `已加载模板「${selectedTemplate}」。`);
    } catch (error) {
      console.warn('[CodeEditor] Failed to load template', error);
      showStatusMessage('error', error?.message || '加载模板失败。');
    }
  }, [onLoadTemplate, selectedTemplate, confirmDiscardIfNeeded, showStatusMessage]);

  const handleRenameTemplate = useCallback(async () => {
    if (typeof onRenameTemplate !== 'function') return;
    if (!selectedTemplate) {
      showStatusMessage('info', '请选择要重命名的模板。');
      return;
    }

    if (!isBrowser) {
      showStatusMessage('error', '当前环境不支持重命名操作。');
      return;
    }

    const input = window.prompt('请输入新的模板名称', selectedTemplate);
    if (!input) {
      return;
    }

    const trimmed = input.trim();
    if (!trimmed) {
      showStatusMessage('info', '模板名称不能为空。');
      return;
    }

    if (trimmed === selectedTemplate) {
      return;
    }

    try {
      await Promise.resolve(onRenameTemplate(selectedTemplate, trimmed));
      setSelectedTemplate(trimmed);
      showStatusMessage('success', '模板名称已更新。');
    } catch (error) {
      console.warn('[CodeEditor] Failed to rename template', error);
      showStatusMessage('error', error?.message || '重命名模板失败。');
    }
  }, [onRenameTemplate, selectedTemplate, showStatusMessage]);

  const handleDeleteTemplate = useCallback(async () => {
    if (typeof onDeleteTemplate !== 'function') return;
    if (!selectedTemplate) {
      showStatusMessage('info', '请选择要删除的模板。');
      return;
    }

    if (!isBrowser) {
      showStatusMessage('error', '当前环境不支持删除操作。');
      return;
    }

    const confirmed = window.confirm(`确定要删除模板「${selectedTemplate}」吗？`);
    if (!confirmed) {
      return;
    }

    try {
      await Promise.resolve(onDeleteTemplate(selectedTemplate));
      setSelectedTemplate('');
      showStatusMessage('success', '模板已删除。');
    } catch (error) {
      console.warn('[CodeEditor] Failed to delete template', error);
      showStatusMessage('error', error?.message || '删除模板失败。');
    }
  }, [onDeleteTemplate, selectedTemplate, showStatusMessage]);

  const handleExport = useCallback(async () => {
    if (typeof onExport !== 'function') return;

    try {
      await Promise.resolve(onExport());
      showStatusMessage('success', '配置已导出。');
    } catch (error) {
      console.warn('[CodeEditor] Failed to export configuration', error);
      showStatusMessage('error', error?.message || '导出失败。');
    }
  }, [onExport, showStatusMessage]);

  const statusStyle = useMemo(() => {
    if (!status) return null;
    if (status.type === 'success') return { ...styles.status, ...styles.statusSuccess };
    if (status.type === 'error') return { ...styles.status, ...styles.statusError };
    return { ...styles.status, ...styles.statusInfo };
  }, [status]);

  const templateOptions = useMemo(() => templates ?? [], [templates]);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    if (!templateOptions.some((template) => template.name === selectedTemplate)) {
      setSelectedTemplate('');
    }
  }, [selectedTemplate, templateOptions]);

  const latestAiContent = latestAssistantMessage?.content ?? '';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <div style={styles.title}>Code Workspace</div>
          <div style={styles.subtitle}>管理 AI 生成的 HTML / CSS / 脚本等代码片段。</div>
          <div style={styles.meta}>
            <span>
              活动来源：
              {meta?.source === 'template'
                ? `模板（${meta?.templateName || '未命名'}）`
                : meta?.source === 'ai'
                ? 'AI 输出'
                : '手动编辑'}
            </span>
            {meta?.updatedAt && (
              <>
                {' · '}最后更新于 {formatTimestamp(meta.updatedAt)}
              </>
            )}
          </div>
        </div>
        <div style={styles.headerActions}>
          <button
            type="button"
            style={{ ...styles.button, ...styles.buttonSecondary }}
            onClick={handleExport}
          >
            导出配置
          </button>
          <button
            type="button"
            style={{ ...styles.button, ...styles.buttonGhost }}
            onClick={handleToggleAiPanel}
          >
            {showAiPanel ? '隐藏 AI 响应' : '查看 AI 响应'}
          </button>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.toolbarGroup}>
          <span style={styles.toolbarLabel}>模板：</span>
          <select
            value={selectedTemplate}
            onChange={(event) => setSelectedTemplate(event.target.value)}
            style={styles.templateSelect}
          >
            <option value="">未选模板</option>
            {templateOptions.map((template) => (
              <option key={template.name} value={template.name}>
                {template.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={handleSaveTemplate}
          >
            保存当前
          </button>
          <button
            type="button"
            style={{ ...styles.button, ...styles.buttonSecondary }}
            onClick={handleLoadTemplate}
          >
            加载模板
          </button>
          <button
            type="button"
            style={styles.button}
            onClick={handleRenameTemplate}
            disabled={!selectedTemplate}
          >
            重命名
          </button>
          <button
            type="button"
            style={{ ...styles.button, ...styles.buttonDanger }}
            onClick={handleDeleteTemplate}
            disabled={!selectedTemplate}
          >
            删除
          </button>
        </div>
        <div style={styles.toolbarGroup}>
          <button type="button" style={styles.button} onClick={handleCopy}>
            复制
          </button>
          <button type="button" style={styles.button} onClick={handleDownload}>
            下载
          </button>
          <button
            type="button"
            style={{
              ...styles.button,
              ...(activeTabConfig?.canFormat ? {} : styles.buttonDisabled),
            }}
            onClick={handleFormat}
            disabled={!activeTabConfig?.canFormat}
          >
            格式化
          </button>
        </div>
      </div>

      {status && <div style={statusStyle}>{status.text}</div>}

      <div style={styles.tabs}>
        {WORKSPACE_TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const isDirty = dirtyMap[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              style={{
                ...styles.tab,
                ...(isActive ? styles.tabActive : {}),
              }}
            >
              {tab.label}
              {isDirty && <span style={styles.tabDirtyDot} aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div style={styles.surface}>
        <div style={styles.editorColumn}>
          <div style={styles.editorInner}>
            {activeTabConfig && (
              <Editor
                key={activeTabConfig.id}
                language={activeTabConfig.language}
                value={activeContent}
                onChange={(value) => handleEditorChange(activeTabConfig.id, value)}
                onMount={(editorInstance, monacoInstance) =>
                  handleEditorDidMount(activeTabConfig.id, editorInstance, monacoInstance)
                }
                theme="vs"
                options={{
                  automaticLayout: true,
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  fontLigatures: true,
                  padding: { top: 12, bottom: 12 },
                  fontSize: Math.max(12, Math.round(fontSize || 14)),
                }}
                loading={<div style={{ padding: '12px', fontSize: '12px' }}>正在加载编辑器…</div>}
                width="100%"
                height="360px"
              />
            )}
          </div>
        </div>
        {showAiPanel && (
          <aside style={styles.aiPanel}>
            <div style={styles.aiPanelTitle}>最新 AI 响应</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {latestAssistantMessage?.timestamp
                ? formatTimestamp(latestAssistantMessage.timestamp)
                : '无时间信息'}
            </div>
            <div style={styles.aiPanelBody}>
              {latestAiContent ? latestAiContent : '暂无 AI 响应可显示。'}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
