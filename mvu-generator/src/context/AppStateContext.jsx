import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { storage, storageKeys } from '../utils/storage.js'
import { normalizeYamlError, parseYamlToState } from '../utils/yamlParser.js'

const DEFAULT_SAMPLE_STAT_DATA = `stat_data:
  角色:
    络络:
      好感度: 30
      心情: 开心
      体力: 75
    青空莉:
      好感度: 55
      心情: 郁闷
  世界:
    日期: 2025-07-26
    时间: 21:00
    天气: 晴
  系统:
    模式: 正常
    提醒:
      - 在对话末尾输出变量更新摘要
`

const DEFAULT_INITVAR_TEMPLATE = `metadata:
  title: Tavern 状态栏初始化
  version: 0.1.0
  description: >-
    在 [initvar] 条目中保存的 YAML 会被 MVU 读取并用作 stat_data 初始值。
stat_data:
  角色:
    络络:
      好感度: 30
      心情: 开心
      体力: 75
    青空莉:
      好感度: 55
      心情: 郁闷
  世界:
    日期: 2025-07-26
    时间: 21:00
    天气: 晴
check:
  - 请确保该条目保持禁用状态，防止文本直接发送给 AI。
rule: |
  你需要在每次回复的末尾输出变量更新总结。
`

const DEFAULT_YAML = `metadata:
  title: Tavern 状态栏示例
  version: 0.1.0
  description: >-
    使用 MVU 提供的变量来驱动 TavernAI 状态栏展示。
stat_data:
  角色:
    络络:
      好感度: 30
      心情: 开心
      体力: 75
    青空莉:
      好感度: 55
      心情: 郁闷
  世界:
    日期: 2025-07-26
    时间: 21:00
    天气: 晴
  系统:
    模式: 正常
    提醒:
      - 在回复末尾输出变量更新摘要
      - 当好感度低于 20 时提示玩家给予关心
templates:
  statusBanner: |
    ⚡ 能量: {{ stat_data.角色.络络.体力 }} | 💖 好感度: {{ stat_data.角色.络络.好感度 }}
  variableSummary: |
    当前变量概览: {{ stat_data | dump }}
`

const DEFAULT_TEMPLATES = Object.freeze({
  starter: DEFAULT_YAML,
  initVar: DEFAULT_INITVAR_TEMPLATE,
  sampleStatData: DEFAULT_SAMPLE_STAT_DATA,
})

const ACTIONS = {
  SET_YAML_TEXT: 'SET_YAML_TEXT',
  SET_PARSE_RESULT: 'SET_PARSE_RESULT',
  SET_PARSE_ERROR: 'SET_PARSE_ERROR',
  CLEAR_PARSE_ERROR: 'CLEAR_PARSE_ERROR',
}

const defaultParsedState = parseYamlToState(DEFAULT_YAML)

const mergeTemplates = (baseTemplates, parsedTemplates) => ({
  ...DEFAULT_TEMPLATES,
  ...baseTemplates,
  ...(parsedTemplates ?? {}),
})

const appStateReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_YAML_TEXT: {
      return {
        ...state,
        yamlText: action.payload,
      }
    }
    case ACTIONS.SET_PARSE_RESULT: {
      const { result, source } = action.payload
      return {
        ...state,
        parsed: result,
        parseError: null,
        lastValidated: source,
        templates: mergeTemplates(state.templates, result.templates),
      }
    }
    case ACTIONS.SET_PARSE_ERROR: {
      return {
        ...state,
        parseError: action.payload.error,
        lastValidated: action.payload.source,
      }
    }
    case ACTIONS.CLEAR_PARSE_ERROR: {
      return {
        ...state,
        parseError: null,
      }
    }
    default:
      return state
  }
}

export const createInitialAppState = () => {
  const storedYaml = storage.get(storageKeys.variables)
  const lastValidYaml = storage.get(storageKeys.lastValidYaml)

  const candidateYaml = typeof storedYaml === 'string' ? storedYaml : ''
  const yamlText = candidateYaml.trim().length > 0 ? candidateYaml : DEFAULT_YAML

  let parsed = defaultParsedState
  let parseError = null
  let lastValidated = ''

  try {
    parsed = parseYamlToState(yamlText)
    lastValidated = yamlText
  } catch (error) {
    parseError = normalizeYamlError(error, yamlText)
    lastValidated = yamlText

    if (typeof lastValidYaml === 'string' && lastValidYaml.trim().length > 0) {
      try {
        parsed = parseYamlToState(lastValidYaml)
      } catch (restoreError) {
        console.warn('Unable to restore last valid YAML snapshot.', restoreError)
        parsed = defaultParsedState
      }
    }
  }

  return {
    yamlText,
    parsed,
    parseError,
    lastValidated,
    templates: mergeTemplates({}, parsed.templates),
  }
}

const AppStateContext = createContext(null)

export function AppStateProvider({ children, initialState }) {
  const [state, dispatch] = useReducer(
    appStateReducer,
    initialState,
    (provided) => provided ?? createInitialAppState(),
  )

  useEffect(() => {
    storage.set(storageKeys.variables, state.yamlText)
  }, [state.yamlText])

  useEffect(() => {
    if (state.parsed?.source) {
      storage.set(storageKeys.lastValidYaml, state.parsed.source)
    }
  }, [state.parsed?.source])

  const setYamlText = useCallback((nextValue) => {
    dispatch({
      type: ACTIONS.SET_YAML_TEXT,
      payload: typeof nextValue === 'string' ? nextValue : '',
    })
  }, [])

  const validateYaml = useCallback(
    (source = state.yamlText, options = {}) => {
      const text = typeof source === 'string' ? source : ''
      const force = options.force === true

      if (!force && text === state.lastValidated) {
        return
      }

      try {
        const result = parseYamlToState(text)
        dispatch({
          type: ACTIONS.SET_PARSE_RESULT,
          payload: { result, source: text },
        })
      } catch (error) {
        const normalized = normalizeYamlError(error, text)
        dispatch({
          type: ACTIONS.SET_PARSE_ERROR,
          payload: { error: normalized, source: text },
        })
      }
    },
    [state.lastValidated, state.yamlText],
  )

  const replaceYaml = useCallback(
    (nextValue, options = {}) => {
      const text = typeof nextValue === 'string' ? nextValue : ''
      const forceValidate = options.forceValidate === true
      const skipValidation = options.skipValidation === true

      dispatch({
        type: ACTIONS.SET_YAML_TEXT,
        payload: text,
      })

      if (!skipValidation) {
        validateYaml(text, { force: forceValidate })
      }
    },
    [validateYaml],
  )

  const applyTemplate = useCallback(
    (templateKey, options = {}) => {
      const { forceValidate = true } = options

      let templateValue = null

      if (typeof templateKey === 'string') {
        templateValue = state.templates?.[templateKey] ?? null
      }

      if (templateValue == null && typeof options.value === 'string') {
        templateValue = options.value
      }

      if (typeof templateValue !== 'string') {
        return null
      }

      replaceYaml(templateValue, { forceValidate })
      return templateValue
    },
    [replaceYaml, state.templates],
  )

  const clearParseError = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_PARSE_ERROR })
  }, [])

  const stateWithMeta = useMemo(
    () => ({
      ...state,
      isDirty: state.yamlText !== state.lastValidated,
    }),
    [state],
  )

  const contextValue = useMemo(
    () => ({
      state: stateWithMeta,
      actions: {
        setYamlText,
        validateYaml,
        replaceYaml,
        applyTemplate,
        clearParseError,
      },
    }),
    [stateWithMeta, setYamlText, validateYaml, replaceYaml, applyTemplate, clearParseError],
  )

  return <AppStateContext.Provider value={contextValue}>{children}</AppStateContext.Provider>
}

export const useAppState = () => {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }

  return context
}

export default AppStateContext
