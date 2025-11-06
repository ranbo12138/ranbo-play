import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createChatCompletion } from '../services/openai';
import CodeEditor from './CodeEditor.jsx';
import {
  clearApiSettings,
  clearChatHistory,
  clearVariableSummary,
  deleteCodeTemplate,
  getApiSettings,
  getChatHistory,
  getCodeTemplate,
  getCodeTemplates,
  getVariableSummary,
  renameCodeTemplate,
  saveApiSettings,
  saveChatHistory,
  saveCodeTemplate,
  saveVariableSummary,
} from '../utils/storage';
import {
  MVU_CONTEXT_ACTIONS,
  assemblePrompt,
  parseVariableSummary,
} from '../utils/prompts';
import {
  extractArtifactsFromContent,
  normaliseArtifacts,
} from '../utils/workspace.js';

const PROVIDER_PRESETS = {
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
  },
  azure: {
    label: 'Azure OpenAI',
    baseUrl: '',
  },
  openrouter: {
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  custom: {
    label: '自定义',
    baseUrl: '',
  },
};

const ROLE_LABELS = {
  user: '用户',
  assistant: '助手',
  system: '系统',
};

function translateErrorMessage(message) {
  if (!message) return '';
  const trimmed = `${message}`.trim();
  if (!trimmed) return '';

  const normalized = trimmed.toLowerCase();

  if (normalized.includes('failed to fetch') || normalized.includes('networkerror')) {
    return '网络请求失败，请检查连接。';
  }

  if (normalized.includes('timeout')) {
    return '请求超时，请稍后重试。';
  }

  if (normalized.includes('unauthorized') || normalized.includes('401')) {
    return '认证失败，请检查 API 凭据。';
  }

  if (normalized.includes('forbidden') || normalized.includes('403')) {
    return '权限不足，请检查 API 凭据。';
  }

  if (normalized.includes('not found') || normalized.includes('404')) {
    return '未找到目标接口，请检查基础 URL。';
  }

  if (
    normalized.includes('bad gateway') ||
    normalized.includes('service unavailable') ||
    normalized.includes('gateway timeout') ||
    normalized.includes('502') ||
    normalized.includes('503') ||
    normalized.includes('504')
  ) {
    return '服务暂时不可用，请稍后重试。';
  }

  if (
    normalized.includes('invalid json response body') ||
    normalized.includes('unexpected end of json input')
  ) {
    return '接口返回的 JSON 数据无效。';
  }

  if (normalized.includes('ssl') || normalized.includes('certificate') || normalized.includes('handshake')) {
    return 'SSL 连接失败，请检查网络或证书配置。';
  }

  if (/[A-Za-z]/.test(trimmed)) {
    return '';
  }

  return trimmed;
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    height: '100%',
    minHeight: '640px',
    maxWidth: '960px',
    margin: '0 auto',
    borderRadius: '16px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    boxShadow: '0 16px 48px rgba(15, 23, 42, 0.12)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#111827',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  actionButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '999px',
    border: '1px solid #cbd5f5',
    background: '#e0e7ff',
    color: '#1e2a78',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  actionButtonSecondary: {
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    color: '#0f172a',
  },
  actionButtonDanger: {
    border: '1px solid #fecaca',
    background: '#fee2e2',
    color: '#b91c1c',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  workspaceWrapper: {
    flex: '0 0 auto',
    padding: '16px 20px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  contextShelf: {
    padding: '12px 20px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '12px',
  },
  contextButtonsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px',
  },
  contextButton: {
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#1e293b',
    transition: 'all 0.2s ease',
  },
  contextButtonActive: {
    background: '#2563eb',
    borderColor: '#1d4ed8',
    color: '#ffffff',
  },
  contextMeta: {
    fontSize: '12px',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  summaryDetails: {
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
  },
  summaryTextarea: {
    width: '100%',
    minHeight: '120px',
    resize: 'vertical',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    padding: '10px 12px',
    fontSize: '13px',
    fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    background: '#f8fafc',
    color: '#0f172a',
  },
  summaryFooter: {
    marginTop: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  summaryActions: {
    display: 'flex',
    gap: '8px',
  },
  chatScroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    background: '#ffffff',
  },
  message: {
    padding: '14px 16px',
    borderRadius: '14px',
    border: '1px solid #e5e7eb',
    marginBottom: '12px',
    maxWidth: '90%',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  },
  messageUser: {
    background: '#2563eb',
    color: '#ffffff',
    marginLeft: 'auto',
    borderColor: '#1d4ed8',
  },
  messageAssistant: {
    background: '#f8fafc',
    color: '#0f172a',
  },
  messageSystem: {
    background: '#fef9c3',
    borderColor: '#fbbf24',
    color: '#78350f',
  },
  messageMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '11px',
    letterSpacing: '0.02em',
  },
  composer: {
    padding: '16px 20px',
    borderTop: '1px solid #e2e8f0',
    background: '#f9fafb',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  textarea: {
    width: '100%',
    minHeight: '96px',
    resize: 'vertical',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    padding: '12px 14px',
    fontSize: '14px',
    lineHeight: 1.5,
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    background: '#ffffff',
    color: '#0f172a',
  },
  composerFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  composerHint: {
    fontSize: '12px',
    color: '#64748b',
  },
  sendButton: {
    padding: '10px 16px',
    borderRadius: '10px',
    border: 'none',
    background: '#2563eb',
    color: '#ffffff',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  sendButtonDisabled: {
    background: '#93c5fd',
    cursor: 'not-allowed',
  },
  errorBanner: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #fecaca',
    background: '#fee2e2',
    color: '#991b1b',
    fontSize: '13px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  previewPanel: {
    background: '#ffffff',
    border: '1px dashed #cbd5e1',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '12px',
    lineHeight: 1.5,
    color: '#1f2937',
  },
  settingsOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.72)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    zIndex: 20,
  },
  settingsPanel: {
    width: '100%',
    maxWidth: '520px',
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 24px 56px rgba(15, 23, 42, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  settingsTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#0f172a',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1e293b',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    background: '#f8fafc',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    fontSize: '13px',
  },
  settingsFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  inlineButton: {
    border: 'none',
    background: 'transparent',
    color: '#2563eb',
    cursor: 'pointer',
    fontSize: '13px',
  },
  settingsError: {
    fontSize: '12px',
    color: '#b91c1c',
  },
};

const initialContextSelection = {
  statData: false,
  lorebook: false,
  memory: false,
  customNotes: [],
};

const ChatInterface = () => {
  const settingsSeedRef = useRef(null);
  if (settingsSeedRef.current === null) {
    settingsSeedRef.current = getApiSettings();
  }

  const historySeedRef = useRef(null);
  if (historySeedRef.current === null) {
    historySeedRef.current = getChatHistory();
  }

  const summarySeedRef = useRef(null);
  if (summarySeedRef.current === null) {
    summarySeedRef.current = getVariableSummary();
  }

  const [apiSettings, setApiSettingsState] = useState(settingsSeedRef.current);
  const [settingsDraft, setSettingsDraft] = useState(settingsSeedRef.current);
  const [headersInput, setHeadersInput] = useState(
    settingsSeedRef.current.headers && Object.keys(settingsSeedRef.current.headers).length > 0
      ? JSON.stringify(settingsSeedRef.current.headers, null, 2)
      : ''
  );
  const [settingsError, setSettingsError] = useState('');
  const [chatHistory, setChatHistoryState] = useState(historySeedRef.current);
  const [contextSelection, setContextSelection] = useState(initialContextSelection);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(() => !settingsSeedRef.current.apiKey);
  const [promptPreview, setPromptPreview] = useState({
    system: '',
    user: '',
    contextSections: [],
  });
  const [rawSummary, setRawSummary] = useState(summarySeedRef.current.raw || '');
  const [parsedSummary, setParsedSummary] = useState(summarySeedRef.current.parsed || {});
  const [summaryUpdatedAt, setSummaryUpdatedAt] = useState(summarySeedRef.current.updatedAt || null);
  const [lastRequest, setLastRequest] = useState(null);
  const [artifacts, setArtifacts] = useState(() => normaliseArtifacts());
  const [artifactBaseline, setArtifactBaseline] = useState(() => normaliseArtifacts());
  const [workspaceMeta, setWorkspaceMeta] = useState({
    source: 'manual',
    templateName: null,
    updatedAt: null,
    messageId: null,
  });
  const [currentTemplateName, setCurrentTemplateName] = useState('');
  const [templates, setTemplates] = useState(() => {
    try {
      return getCodeTemplates();
    } catch (error) {
      console.warn('[ChatInterface] Failed to read code templates', error);
      return [];
    }
  });

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const hasApiCredentials = useMemo(() => {
    return Boolean(
      apiSettings.apiKey && apiSettings.baseUrl && apiSettings.defaultModel
    );
  }, [apiSettings.apiKey, apiSettings.baseUrl, apiSettings.defaultModel]);

  const hasInputValue = useMemo(() => Boolean(inputValue.trim()), [inputValue]);
  const isSendDisabled = isLoading || !hasApiCredentials || !hasInputValue;
  const latestAssistantMessage = useMemo(() => {
    for (let index = chatHistory.length - 1; index >= 0; index -= 1) {
      const message = chatHistory[index];
      if (message.role === 'assistant') {
        return message;
      }
    }
    return null;
  }, [chatHistory]);

  useEffect(() => {
    saveApiSettings(apiSettings);
  }, [apiSettings]);

  useEffect(() => {
    saveChatHistory(chatHistory);
  }, [chatHistory]);

  useEffect(() => {
    if (!latestAssistantMessage) {
      return;
    }

    const hasArtifactsContent = Object.values(artifacts).some((value) =>
      Boolean(value && value.trim())
    );

    if (
      workspaceMeta.messageId ||
      hasArtifactsContent ||
      workspaceMeta.source !== 'manual' ||
      workspaceMeta.templateName
    ) {
      return;
    }

    updateWorkspaceFromAssistant(latestAssistantMessage.id, latestAssistantMessage.content);
  }, [
    artifacts,
    latestAssistantMessage,
    workspaceMeta.messageId,
    workspaceMeta.source,
    workspaceMeta.templateName,
  ]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  useEffect(() => {
    if (hasApiCredentials) {
      setSettingsOpen(false);
      setError('');
    }
  }, [hasApiCredentials]);

  useEffect(() => {
    if (settingsOpen) {
      setSettingsDraft(apiSettings);
      setHeadersInput(
        apiSettings.headers && Object.keys(apiSettings.headers).length > 0
          ? JSON.stringify(apiSettings.headers, null, 2)
          : ''
      );
      setSettingsError('');
    }
  }, [apiSettings, settingsOpen]);

  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return '';
    try {
      return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(timestamp));
    } catch (timeError) {
      return timestamp;
    }
  }, []);

  const handleToggleContext = useCallback((id) => {
    setContextSelection((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const handleInputChange = useCallback((event) => {
    setInputValue(event.target.value);
  }, []);

  const handleSummaryChange = useCallback((event) => {
    setRawSummary(event.target.value);
  }, []);

  const refreshSummary = useCallback(() => {
    const parsed = parseVariableSummary(rawSummary);
    setParsedSummary(parsed);
    const timestamp = new Date().toISOString();
    setSummaryUpdatedAt(timestamp);
    saveVariableSummary({ raw: rawSummary, parsed, updatedAt: timestamp });
  }, [rawSummary]);

  const clearSummary = useCallback(() => {
    setRawSummary('');
    setParsedSummary({});
    setSummaryUpdatedAt(null);
    clearVariableSummary();
  }, []);

  const refreshPromptPreview = useCallback(() => {
    if (!inputValue.trim()) {
      setPromptPreview({ system: '', user: '', contextSections: [] });
      return;
    }

    try {
      const assembled = assemblePrompt({
        userInput: inputValue,
        history: chatHistory,
        variableSummary: { parsed: parsedSummary },
        context: contextSelection,
      });

      setPromptPreview({
        system: assembled.systemPrompt,
        user: assembled.userPrompt,
        contextSections: assembled.contextSections,
      });
    } catch (previewError) {
      console.warn('[ChatInterface] Failed to build prompt preview', previewError);
    }
  }, [chatHistory, contextSelection, inputValue, parsedSummary]);

  const updateWorkspaceFromAssistant = useCallback((messageId, content) => {
    if (!content) {
      return;
    }

    const extracted = extractArtifactsFromContent(content);
    if (!extracted || Object.keys(extracted).length === 0) {
      return;
    }

    let snapshot = null;

    setArtifacts((prev) => {
      const updated = { ...prev };
      let changed = false;

      Object.entries(extracted).forEach(([key, value]) => {
        if (typeof value === 'string' && (updated[key] ?? '') !== value) {
          updated[key] = value;
          changed = true;
        }
      });

      if (!changed) {
        return prev;
      }

      const nextSnapshot = { ...updated };
      snapshot = nextSnapshot;
      return nextSnapshot;
    });

    if (!snapshot) {
      return;
    }

    setArtifactBaseline({ ...snapshot });
    setWorkspaceMeta({
      source: 'ai',
      templateName: null,
      updatedAt: new Date().toISOString(),
      messageId,
    });
    setCurrentTemplateName('');
  }, []);

  const resetPromptPreview = useCallback(() => {
    setPromptPreview({ system: '', user: '', contextSections: [] });
  }, []);

  const normaliseHeadersDraft = useCallback(() => {
    if (!headersInput.trim()) {
      return {};
    }

    try {
      const parsed = JSON.parse(headersInput);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
      throw new Error('请求头必须是 JSON 对象');
    } catch (parseError) {
      const message =
        parseError.message === '请求头必须是 JSON 对象'
          ? parseError.message
          : '自定义请求头必须是合法的 JSON 对象。';
      setSettingsError(message);
      throw new Error(message);
    }
  }, [headersInput]);

  const updateSettingsDraft = useCallback((field, value) => {
    setSettingsDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleProviderChange = useCallback((event) => {
    const nextProvider = event.target.value;
    const preset = PROVIDER_PRESETS[nextProvider];
    updateSettingsDraft('providerType', nextProvider);
    if (preset && preset.baseUrl && !settingsDraft.baseUrl) {
      updateSettingsDraft('baseUrl', preset.baseUrl);
    }
  }, [settingsDraft.baseUrl, updateSettingsDraft]);

  const handleSettingsSubmit = useCallback(
    (event) => {
      event.preventDefault();
      setSettingsError('');

      try {
        const headers = normaliseHeadersDraft();
        const sanitised = {
          providerType: settingsDraft.providerType || 'openai',
          baseUrl: (settingsDraft.baseUrl || '').trim(),
          defaultModel: (settingsDraft.defaultModel || '').trim(),
          apiKey: (settingsDraft.apiKey || '').trim(),
          headers,
        };

        setApiSettingsState(sanitised);
        setSettingsDraft(sanitised);
        setHeadersInput(Object.keys(headers).length ? JSON.stringify(headers, null, 2) : '');
        setSettingsOpen(false);
        setSettingsError('');
      } catch (submissionError) {
        console.warn('[ChatInterface] Invalid settings payload', submissionError);
      }
    },
    [normaliseHeadersDraft, settingsDraft]
  );

  const handleSettingsReset = useCallback(() => {
    clearApiSettings();
    const baseline = {
      providerType: 'openai',
      baseUrl: PROVIDER_PRESETS.openai.baseUrl,
      defaultModel: 'gpt-3.5-turbo',
      apiKey: '',
      headers: {},
    };
    setApiSettingsState(baseline);
    setSettingsDraft(baseline);
    setHeadersInput('');
    setSettingsError('');
    setSettingsOpen(true);
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async ({
      userInput: overrideInput,
      context: overrideContext,
      skipUserAppend = false,
      userMessageId,
      assistantMessageId,
    } = {}) => {
      if (!hasApiCredentials) {
        setSettingsOpen(true);
        setError('请先配置 API 凭据。');
        return;
      }

      const content = (overrideInput ?? inputValue).trim();
      if (!content) {
        setError('请输入要发送的内容。');
        return;
      }

      if (isLoading) {
        return;
      }

      const contextToUse = overrideContext || contextSelection;
      const historyForPrompt = skipUserAppend
        ? chatHistory.filter(
            (message) =>
              message.id !== assistantMessageId && message.id !== userMessageId
          )
        : chatHistory;

      let assembled;
      try {
        assembled = assemblePrompt({
          userInput: content,
          history: historyForPrompt,
          variableSummary: { parsed: parsedSummary },
          context: contextToUse,
        });
      } catch (assemblyError) {
        const message = translateErrorMessage(assemblyError.message) || '无法构建提示。';
        setError(message);
        return;
      }

      const timestamp = new Date().toISOString();
      let currentUserId = userMessageId;
      let currentAssistantId = assistantMessageId;

      if (!skipUserAppend) {
        currentUserId = `user-${Date.now().toString(36)}`;
        currentAssistantId = `assistant-${Date.now().toString(36)}-${Math.random()
          .toString(16)
          .slice(2, 8)}`;

        setChatHistoryState((prev) => [
          ...prev,
          {
            id: currentUserId,
            role: 'user',
            content,
            timestamp,
          },
          {
            id: currentAssistantId,
            role: 'assistant',
            content: '',
            timestamp,
            pending: true,
            status: 'pending',
          },
        ]);
      } else if (currentAssistantId) {
        setChatHistoryState((prev) =>
          prev.map((message) =>
            message.id === currentAssistantId
              ? {
                  ...message,
                  content: '',
                  pending: true,
                  status: 'pending',
                  error: null,
                  timestamp,
                }
              : message
          )
        );
      }

      setInputValue('');
      resetPromptPreview();
      setError('');
      setIsLoading(true);
      setIsStreaming(true);
      setLastRequest({
        userInput: content,
        context: contextToUse,
        userMessageId: currentUserId,
        assistantMessageId: currentAssistantId,
      });

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const result = await createChatCompletion({
          apiKey: apiSettings.apiKey,
          baseUrl: apiSettings.baseUrl,
          model: apiSettings.defaultModel,
          providerType: apiSettings.providerType,
          headers: apiSettings.headers,
          messages: assembled.messages,
          stream: true,
          signal: controller.signal,
          onToken: (delta, full) => {
            setChatHistoryState((prev) =>
              prev.map((message) =>
                message.id === currentAssistantId
                  ? {
                      ...message,
                      content: full,
                      pending: true,
                      status: 'pending',
                      error: null,
                      delta,
                    }
                  : message
              )
            );
          },
          onComplete: (finalContent) => {
            setChatHistoryState((prev) =>
              prev.map((message) =>
                message.id === currentAssistantId
                  ? {
                      ...message,
                      content: finalContent,
                      pending: false,
                      status: 'complete',
                      error: null,
                    }
                  : message
              )
            );
            updateWorkspaceFromAssistant(currentAssistantId, finalContent);
          },
          onError: () => {
            setIsStreaming(false);
          },
        });

        const finalContent =
          result?.payload?.choices?.[0]?.message?.content ?? '';

        if (finalContent) {
          setChatHistoryState((prev) =>
            prev.map((message) =>
              message.id === currentAssistantId
                ? {
                    ...message,
                    content: finalContent,
                    pending: false,
                    status: 'complete',
                    error: null,
                  }
                : message
            )
          );
          updateWorkspaceFromAssistant(currentAssistantId, finalContent);
        }
      } catch (requestError) {
        const isAbort = requestError?.name === 'AbortError';
        if (!isAbort) {
          console.error('[ChatInterface] Chat request failed', requestError);
        }
        const localizedError = translateErrorMessage(requestError?.message);
        const message = isAbort
          ? '请求已取消。'
          : localizedError || '请求失败，请稍后重试。';
        setError(message);
        setChatHistoryState((prev) =>
          prev.map((item) =>
            item.id === currentAssistantId
              ? {
                  ...item,
                  content: isAbort
                    ? '🚫 请求已取消。'
                    : `⚠️ 错误：${message}`,
                  pending: false,
                  status: isAbort ? 'cancelled' : 'error',
                  error: isAbort ? null : message,
                }
              : item
          )
        );
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [
      apiSettings.apiKey,
      apiSettings.baseUrl,
      apiSettings.defaultModel,
      apiSettings.headers,
      apiSettings.providerType,
      chatHistory,
      contextSelection,
      hasApiCredentials,
      inputValue,
      isLoading,
      parsedSummary,
      resetPromptPreview,
      updateWorkspaceFromAssistant,
    ]
  );

  const handleSend = useCallback(() => {
    sendMessage();
  }, [sendMessage]);

  const handleComposerKeyDown = useCallback(
    (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const handleRetry = useCallback(() => {
    if (!lastRequest) return;
    sendMessage({
      userInput: lastRequest.userInput,
      context: lastRequest.context,
      skipUserAppend: true,
      userMessageId: lastRequest.userMessageId,
      assistantMessageId: lastRequest.assistantMessageId,
    });
  }, [lastRequest, sendMessage]);

  const handleClearHistory = useCallback(() => {
    clearChatHistory();
    setChatHistoryState([]);
    setLastRequest(null);
    setError('');
  }, []);

  const handleArtifactChange = useCallback((tabId, value) => {
    const nextValue = value ?? '';
    let didChange = false;

    setArtifacts((prev) => {
      const currentValue = prev?.[tabId] ?? '';
      if (currentValue === nextValue) {
        return prev;
      }
      didChange = true;
      return {
        ...prev,
        [tabId]: nextValue,
      };
    });

    if (didChange) {
      setWorkspaceMeta((prevMeta) => ({
        ...prevMeta,
        source: 'manual',
        updatedAt: new Date().toISOString(),
      }));
    }
  }, []);

  const handleTemplateSave = useCallback(
    (name) => {
      const result = saveCodeTemplate(name, artifacts);
      setTemplates(result.templates);
      const baselineSnapshot = { ...result.template.artifacts };
      setArtifacts(baselineSnapshot);
      setArtifactBaseline({ ...baselineSnapshot });
      setWorkspaceMeta((prevMeta) => ({
        ...prevMeta,
        source: 'template',
        templateName: result.template.name,
        updatedAt: result.template.updatedAt || new Date().toISOString(),
      }));
      setCurrentTemplateName(result.template.name);
      return result.template;
    },
    [artifacts]
  );

  const handleTemplateLoad = useCallback(
    (name) => {
      const trimmed = typeof name === 'string' ? name.trim() : '';
      if (!trimmed) {
        throw new Error('请选择要加载的模板。');
      }

      const template = getCodeTemplate(trimmed);
      if (!template) {
        throw new Error(`未找到模板「${trimmed}」。`);
      }

      const nextArtifacts = { ...template.artifacts };
      setArtifacts(nextArtifacts);
      setArtifactBaseline({ ...nextArtifacts });
      setWorkspaceMeta((prevMeta) => ({
        ...prevMeta,
        source: 'template',
        templateName: template.name,
        updatedAt: template.updatedAt || new Date().toISOString(),
        messageId: null,
      }));
      setCurrentTemplateName(template.name);
      return template;
    },
    []
  );

  const handleTemplateRename = useCallback(
    (from, to) => {
      const result = renameCodeTemplate(from, to);
      setTemplates(result.templates);
      if (currentTemplateName === from) {
        setCurrentTemplateName(result.template?.name || '');
      }
      if (workspaceMeta.templateName === from) {
        setWorkspaceMeta((prevMeta) => ({
          ...prevMeta,
          templateName: result.template?.name || null,
          updatedAt: result.template?.updatedAt || prevMeta.updatedAt,
        }));
      }
      return result.template;
    },
    [currentTemplateName, workspaceMeta.templateName]
  );

  const handleTemplateDelete = useCallback(
    (name) => {
      const result = deleteCodeTemplate(name);
      setTemplates(result.templates);
      if (currentTemplateName === name) {
        setCurrentTemplateName('');
      }
      if (workspaceMeta.templateName === name) {
        setWorkspaceMeta((prevMeta) => ({
          ...prevMeta,
          source: 'manual',
          templateName: null,
          updatedAt: new Date().toISOString(),
        }));
      }
      return result.removed;
    },
    [currentTemplateName, workspaceMeta.templateName]
  );

  const handleExportConfiguration = useCallback(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('当前环境不支持导出。');
    }

    const timestamp = new Date().toISOString();
    const payload = {
      exportedAt: timestamp,
      workspace: {
        source: workspaceMeta.source,
        templateName: workspaceMeta.templateName || currentTemplateName || null,
        updatedAt: workspaceMeta.updatedAt,
        messageId: workspaceMeta.messageId,
      },
      artifacts,
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const safeName = (workspaceMeta.templateName || currentTemplateName || 'mvu-workspace')
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'mvu-workspace';
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return payload;
  }, [artifacts, workspaceMeta, currentTemplateName]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.title}>MVU 聊天助手</div>
        <div style={styles.headerActions}>
          <button
            type="button"
            style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
            onClick={refreshPromptPreview}
          >
            刷新提示
          </button>
          <button
            type="button"
            style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
            onClick={handleClearHistory}
          >
            清除会话
          </button>
          <button
            type="button"
            style={styles.actionButton}
            onClick={() => setSettingsOpen(true)}
          >
            设置
          </button>
        </div>
      </header>

      <section style={styles.contextShelf}>
        <div style={styles.contextButtonsRow}>
          <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>
            快速上下文：
          </span>
          {MVU_CONTEXT_ACTIONS.map((action) => {
            const isActive = contextSelection[action.id];
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => handleToggleContext(action.id)}
                style={{
                  ...styles.contextButton,
                  ...(isActive ? styles.contextButtonActive : {}),
                }}
              >
                {action.label}
              </button>
            );
          })}
        </div>

        <div style={styles.summaryDetails}>
          <div style={styles.contextMeta}>
            <span>变量摘要</span>
            {summaryUpdatedAt ? (
              <span>上次刷新：{formatTimestamp(summaryUpdatedAt)}</span>
            ) : (
              <span>尚未解析上下文</span>
            )}
          </div>
          <textarea
            style={styles.summaryTextarea}
            value={rawSummary}
            onChange={handleSummaryChange}
            placeholder="在此粘贴 MVU 变量摘要（JSON 或文本），然后点击刷新解析。"
          />
          <div style={styles.summaryFooter}>
            <div style={styles.summaryActions}>
              <button
                type="button"
                style={{ ...styles.actionButton, fontSize: '12px', padding: '6px 10px' }}
                onClick={refreshSummary}
              >
                刷新变量
              </button>
              <button
                type="button"
                style={{
                  ...styles.actionButton,
                  ...styles.actionButtonSecondary,
                  fontSize: '12px',
                  padding: '6px 10px',
                }}
                onClick={clearSummary}
              >
                清空摘要
              </button>
            </div>
            <span style={styles.contextMeta}>
              已选片段：
              {MVU_CONTEXT_ACTIONS.filter((action) => contextSelection[action.id])
                .map((action) => action.label)
                .join('，') || '无'}
            </span>
          </div>
        </div>

        {promptPreview.user && (
          <div style={styles.previewPanel}>
            <strong>提示预览（手动刷新）</strong>
            <br />
            <span style={{ color: '#475569' }}>系统：</span>
            <pre style={{ whiteSpace: 'pre-wrap', margin: '4px 0', fontSize: '12px' }}>
              {promptPreview.system}
            </pre>
            <span style={{ color: '#475569' }}>用户：</span>
            <pre style={{ whiteSpace: 'pre-wrap', margin: '4px 0', fontSize: '12px' }}>
              {promptPreview.user}
            </pre>
          </div>
        )}
      </section>

      <div style={styles.body}>
        <div style={styles.workspaceWrapper}>
          <CodeEditor
            artifacts={artifacts}
            baseline={artifactBaseline}
            meta={workspaceMeta}
            templates={templates}
            currentTemplate={currentTemplateName}
            latestAssistantMessage={latestAssistantMessage}
            onChange={handleArtifactChange}
            onExport={handleExportConfiguration}
            onSaveTemplate={handleTemplateSave}
            onLoadTemplate={handleTemplateLoad}
            onRenameTemplate={handleTemplateRename}
            onDeleteTemplate={handleTemplateDelete}
          />
        </div>
        <div style={styles.chatScroll}>
          {chatHistory.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                marginTop: '64px',
                color: '#94a3b8',
                fontSize: '14px',
              }}
            >
              暂无会话，配置 API 后即可开始对话。
            </div>
          )}

          {chatHistory.map((message) => {
            const role = message.role;
            const isUser = role === 'user';
            const isAssistant = role === 'assistant';
            const isSystem = role === 'system';
            const baseStyle = {
              ...styles.message,
              ...(isUser ? styles.messageUser : {}),
              ...(isAssistant ? styles.messageAssistant : {}),
              ...(isSystem ? styles.messageSystem : {}),
            };

            const statusLabel = message.pending
              ? ' · 正在响应…'
              : message.status === 'cancelled'
              ? ' · 已取消'
              : message.status === 'error'
              ? ' · 错误'
              : '';

            const roleLabel = ROLE_LABELS[role] || role.toUpperCase();

            return (
              <div key={message.id} style={baseStyle}>
                <div style={styles.messageMeta}>
                  <span>
                    {roleLabel}
                    {statusLabel}
                  </span>
                  <span>{formatTimestamp(message.timestamp)}</span>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: 1.6 }}>
                  {message.content || (message.pending ? '等待响应…' : '')}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.composer}>
          {error && (
            <div style={styles.errorBanner}>
              <span>{error}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {lastRequest && (
                  <button
                    type="button"
                    style={{ ...styles.actionButton, fontSize: '12px', padding: '6px 10px' }}
                    onClick={handleRetry}
                  >
                    重试
                  </button>
                )}
                {isStreaming && (
                  <button
                    type="button"
                    style={{
                      ...styles.actionButton,
                      ...styles.actionButtonDanger,
                      fontSize: '12px',
                      padding: '6px 10px',
                    }}
                    onClick={cancelRequest}
                  >
                    中止
                  </button>
                )}
              </div>
            </div>
          )}

          <textarea
            style={styles.textarea}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleComposerKeyDown}
            placeholder="输入对话内容，Ctrl/Cmd + Enter 发送"
          />

          <div style={styles.composerFooter}>
            <span style={styles.composerHint}>
              {isLoading
                ? '正在发送请求…'
                : '提示：Ctrl/Cmd + Enter 可快速发送'}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                style={{
                  ...styles.actionButton,
                  ...styles.actionButtonSecondary,
                  fontSize: '12px',
                  padding: '6px 10px',
                }}
                onClick={() => {
                  setInputValue('');
                  resetPromptPreview();
                }}
              >
                清空输入
              </button>
              <button
                type="button"
                style={{
                  ...styles.sendButton,
                  ...(isSendDisabled ? styles.sendButtonDisabled : {}),
                }}
                onClick={handleSend}
                disabled={isSendDisabled}
              >
                {isLoading ? '发送中…' : '发送'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {settingsOpen && (
        <div style={styles.settingsOverlay}>
          <form style={styles.settingsPanel} onSubmit={handleSettingsSubmit}>
            <div style={styles.settingsTitle}>配置 API 凭据</div>
            <p style={{ fontSize: '13px', color: '#475569' }}>
              凭据仅保存在本地浏览器中，仅在发起请求时发送至配置的 API 端点。
            </p>

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="provider">
                服务提供方
              </label>
              <select
                id="provider"
                value={settingsDraft.providerType || 'openai'}
                style={styles.select}
                onChange={handleProviderChange}
              >
                {Object.entries(PROVIDER_PRESETS).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="baseUrl">
                基础 URL
              </label>
              <input
                id="baseUrl"
                style={styles.input}
                value={settingsDraft.baseUrl || ''}
                onChange={(event) => updateSettingsDraft('baseUrl', event.target.value)}
                placeholder="https://api.openai.com/v1"
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="apiKey">
                API 密钥
              </label>
              <input
                id="apiKey"
                style={styles.input}
                value={settingsDraft.apiKey || ''}
                onChange={(event) => updateSettingsDraft('apiKey', event.target.value)}
                placeholder="sk-..."
                type="password"
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="model">
                默认模型
              </label>
              <input
                id="model"
                style={styles.input}
                value={settingsDraft.defaultModel || ''}
                onChange={(event) => updateSettingsDraft('defaultModel', event.target.value)}
                placeholder="gpt-4o-mini"
                required
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="headers">
                自定义请求头（JSON）
              </label>
              <textarea
                id="headers"
                style={{ ...styles.summaryTextarea, minHeight: '80px' }}
                value={headersInput}
                onChange={(event) => {
                  setHeadersInput(event.target.value);
                  setSettingsError('');
                }}
                placeholder='{"Custom-Header":"value"}'
              />
            </div>

            {settingsError && <div style={styles.settingsError}>{settingsError}</div>}

            <div style={styles.settingsFooter}>
              <button type="button" style={styles.inlineButton} onClick={handleSettingsReset}>
                恢复默认
              </button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
                  onClick={() => {
                    if (hasApiCredentials) {
                      setSettingsOpen(false);
                    }
                  }}
                >
                  取消
                </button>
                <button type="submit" style={styles.actionButton}>
                  保存
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;