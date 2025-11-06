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
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    borderBottom: '1px solid #e2e8f0',
    marginBottom: '12px',
  },
  tab: {
    padding: '8px 12px',
    borderRadius: '8px 8px 0 0',
    border: '1px solid transparent',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    background: '#f8fafc',
    color: '#64748b',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    background: '#ffffff',
    borderColor: '#e2e8f0 #e2e8f0 transparent',
    color: '#1f2937',
  },
  editorContainer: {
    flex: 1,
    minHeight: '200px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
  },
  status: {
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 500,
    transition: 'all 0.3s ease',
  },
  statusSuccess: {
    background: '#dcfce7',
    color: '#166534',
  },
  statusError: {
    background: '#fee2e2',
    color: '#b91c1c',
  },
  statusInfo: {
    background: '#eff6ff',
    color: '#1d4ed8',
  },
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return timestamp;
  }
};

const CodeEditor = ({
  artifacts = {},
  baseline = {},
  meta = {},
  templates = [],
  currentTemplate = '',
  latestAssistantMessage = null,
  onChange,
  onExport,
  onSaveTemplate,
  onLoadTemplate,
  onRenameTemplate,
  onDeleteTemplate,
}) => {
  const [activeTab, setActiveTab] = useState('html');
  const [status, setStatus] = useState({ message: '', type: 'info' });
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameFrom, setRenameFrom] = useState('');
  const [renameTo, setRenameTo] = useState('');
  const statusTimeoutRef = useRef(null);

  const currentTabConfig = WORKSPACE_TABS.find((tab) => tab.id === activeTab) || WORKSPACE_TABS[0];
  const currentValue = artifacts[activeTab] || '';
  const hasChanges = useMemo(() => {
    return diffArtifacts(artifacts, baseline)[activeTab];
  }, [artifacts, baseline, activeTab]);

  const showStatus = useCallback((message, type = 'info') => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
    setStatus({ message, type });
    statusTimeoutRef.current = setTimeout(() => {
      setStatus({ message: '', type: 'info' });
    }, STATUS_TIMEOUT);
  }, []);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const handleEditorChange = useCallback((value) => {
    if (onChange) {
      onChange(activeTab, value);
    }
  }, [activeTab, onChange]);

  const handleFormat = useCallback(() => {
    showStatus('格式化功能需要手动实现', 'info');
  }, [showStatus]);

  const handleSaveTemplate = useCallback(() => {
    if (!onSaveTemplate) return;
    
    if (!templateName.trim()) {
      showStatus('请输入模板名称', 'error');
      return;
    }

    try {
      const template = onSaveTemplate(templateName.trim(), artifacts, {
        description: templateDescription.trim(),
      });
      showStatus(`模板 "${template.name}" 已保存`, 'success');
      setTemplateDialogOpen(false);
      setTemplateName('');
      setTemplateDescription('');
    } catch (error) {
      showStatus(`保存失败：${error.message}`, 'error');
    }
  }, [templateName, templateDescription, artifacts, onSaveTemplate, showStatus]);

  const handleLoadTemplate = useCallback((name) => {
    if (!onLoadTemplate) return;

    try {
      const template = onLoadTemplate(name);
      showStatus(`已加载模板 "${template.name}"`, 'success');
    } catch (error) {
      showStatus(`加载失败：${error.message}`, 'error');
    }
  }, [onLoadTemplate, showStatus]);

  const handleDeleteTemplate = useCallback((name) => {
    if (!onDeleteTemplate) return;
    
    if (!confirm(`确定要删除模板 "${name}" 吗？`)) return;

    try {
      const result = onDeleteTemplate(name);
      if (result.removed) {
        showStatus(`模板 "${name}" 已删除`, 'success');
      }
    } catch (error) {
      showStatus(`删除失败：${error.message}`, 'error');
    }
  }, [onDeleteTemplate, showStatus]);

  const handleRenameTemplate = useCallback(() => {
    if (!onRenameTemplate) return;
    
    if (!renameFrom.trim() || !renameTo.trim()) {
      showStatus('请输入有效的模板名称', 'error');
      return;
    }

    try {
      const template = onRenameTemplate(renameFrom.trim(), renameTo.trim());
      showStatus(`模板已重命名为 "${template.name}"`, 'success');
      setRenameDialogOpen(false);
      setRenameFrom('');
      setRenameTo('');
    } catch (error) {
      showStatus(`重命名失败：${error.message}`, 'error');
    }
  }, [renameFrom, renameTo, onRenameTemplate, showStatus]);

  const handleExport = useCallback(() => {
    if (!onExport) return;

    try {
      const payload = onExport();
      showStatus(`配置已导出`, 'success');
    } catch (error) {
      showStatus(`导出失败：${error.message}`, 'error');
    }
  }, [onExport, showStatus]);

  const editorOptions = useMemo(() => ({
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
    fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 13,
    lineNumbers: 'on',
    glyphMargin: false,
    folding: true,
    renderLineHighlight: 'line',
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      useShadows: false,
    },
  }), []);

  const handleEditorDidMount = useCallback((editor, monaco) => {
    if (monaco && currentTabConfig.language === 'yaml') {
      configureMonacoYaml(monaco, {
        enableSchemaRequest: false,
        hover: true,
        completion: true,
        format: true,
      });
    }

    // Add format shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleFormat();
    });
  }, [currentTabConfig.language, handleFormat]);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <div style={styles.title}>代码工作区</div>
          <div style={styles.subtitle}>
            {currentTabConfig.label} • {hasChanges ? '已修改' : '未修改'}
          </div>
          {(meta.source || meta.updatedAt) && (
            <div style={styles.meta}>
              来源：{meta.source} • 更新：{formatTimestamp(meta.updatedAt)}
            </div>
          )}
        </div>
        <div style={styles.headerActions}>
          {status.message && (
            <div style={{ ...styles.status, ...styles[`status${status.type.charAt(0).toUpperCase()}${status.type.slice(1)}`] }}>
              {status.message}
            </div>
          )}
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.toolbarGroup}>
          <span style={styles.toolbarLabel}>模板：</span>
          <select
            style={styles.templateSelect}
            value={currentTemplate}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '__new__') {
                setTemplateDialogOpen(true);
              } else if (value) {
                handleLoadTemplate(value);
              }
            }}
          >
            <option value="">选择模板...</option>
            {templates.map((template) => (
              <option key={template.name} value={template.name}>
                {template.name}
              </option>
            ))}
            <option value="__new__">+ 新建模板</option>
          </select>
          
          {currentTemplate && (
            <>
              <button
                type="button"
                style={{ ...styles.button, ...styles.buttonSecondary }}
                onClick={() => {
                  setRenameFrom(currentTemplate);
                  setRenameTo(currentTemplate);
                  setRenameDialogOpen(true);
                }}
              >
                重命名
              </button>
              <button
                type="button"
                style={{ ...styles.button, ...styles.buttonDanger }}
                onClick={() => handleDeleteTemplate(currentTemplate)}
              >
                删除
              </button>
            </>
          )}
        </div>

        <div style={styles.toolbarGroup}>
          <button
            type="button"
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={() => setTemplateDialogOpen(true)}
          >
            保存为模板
          </button>
          <button
            type="button"
            style={{ ...styles.button, ...styles.buttonSecondary }}
            onClick={handleExport}
          >
            导出配置
          </button>
          {currentTabConfig.canFormat && (
            <button
              type="button"
              style={{ ...styles.button, ...styles.buttonSecondary }}
              onClick={handleFormat}
            >
              格式化
            </button>
          )}
        </div>
      </div>

      <div style={styles.tabs}>
        {WORKSPACE_TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              style={{
                ...styles.tab,
                ...(isActive ? styles.tabActive : {}),
              }}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={styles.editorContainer}>
        <Editor
          height="100%"
          language={currentTabConfig.language}
          value={currentValue}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={editorOptions}
          theme="vs"
        />
      </div>

      {/* Save Template Dialog */}
      {templateDialogOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            minWidth: '400px',
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              保存模板
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
                模板名称
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
                placeholder="输入模板名称"
                autoFocus
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
                描述（可选）
              </label>
              <textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical',
                }}
                placeholder="输入模板描述"
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                style={{ ...styles.button, ...styles.buttonSecondary }}
                onClick={() => {
                  setTemplateDialogOpen(false);
                  setTemplateName('');
                  setTemplateDescription('');
                }}
              >
                取消
              </button>
              <button
                type="button"
                style={{ ...styles.button, ...styles.buttonPrimary }}
                onClick={handleSaveTemplate}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Template Dialog */}
      {renameDialogOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            minWidth: '400px',
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              重命名模板
            </h3>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>
                新名称
              </label>
              <input
                type="text"
                value={renameTo}
                onChange={(e) => setRenameTo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
                placeholder="输入新名称"
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                style={{ ...styles.button, ...styles.buttonSecondary }}
                onClick={() => {
                  setRenameDialogOpen(false);
                  setRenameFrom('');
                  setRenameTo('');
                }}
              >
                取消
              </button>
              <button
                type="button"
                style={{ ...styles.button, ...styles.buttonPrimary }}
                onClick={handleRenameTemplate}
              >
                重命名
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;