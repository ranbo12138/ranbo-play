/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useReducer } from 'react'
import { parse } from 'yaml'
import {
  DEFAULT_GENERATOR_OPTIONS,
  generateCodeArtifacts,
  normaliseVariablePayload,
} from '../services/codeGenerator.js'

export const INITIAL_VARIABLE_SOURCE = `metadata:
  title: 极光旅店状态栏
  version: 0.3.0
  locale: zh-CN
stat_data:
  hp: 78
  hp_max: 100
  stamina: 62
  mood: 舒缓
  focus: 88
  status_label: 极光旅店·前台值守
  last_updated: 2025-02-14T20:30:00+08:00
  summary: >
    络络正在极光旅店前台值守，保持笑容接待访客。
  shards:
    - label: 最近剧情
      detail: >
        玩家刚刚归还了旅店钥匙，络络递上新的欢迎饮品，提醒其查看状态栏。
    - label: 支持频道
      detail: "{{get_message_variable::support.escalation_channel}}"
world_book:
  active_nodes:
    - id: SB-GUIDE
      label: 状态栏输出规范
      anchors:
        - <status_block>
      instruction: |
        输出始终在 <status_block> 中完成，强调变量引用。
generator:
  options:
    accentColor: '#60a5fa'
    layout: compact
    showTimestamp: true
    statusTag: status_block
  triggers:
    - 状态栏
    - status block
`

const AppStateContext = createContext(null)

const ACTIONS = {
  UPDATE_VARIABLE_SOURCE: 'UPDATE_VARIABLE_SOURCE',
  SET_USER_OPTIONS: 'SET_USER_OPTIONS',
  SET_AI_RESPONSE: 'SET_AI_RESPONSE',
  GENERATE_CODE: 'GENERATE_CODE',
}

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

function safeParseVariables(source) {
  if (!source || !source.trim()) {
    return { parsed: {}, error: null }
  }

  try {
    const parsed = parse(source)
    if (isPlainObject(parsed)) {
      return { parsed, error: null }
    }

    return {
      parsed: {},
      error: new Error('变量内容需为 YAML 对象结构'),
    }
  } catch (error) {
    return { parsed: null, error }
  }
}

function mergeGeneratorOptions(baseOptions = DEFAULT_GENERATOR_OPTIONS, patch = {}) {
  const next = { ...baseOptions }
  if (!isPlainObject(patch)) {
    return next
  }

  Object.keys(DEFAULT_GENERATOR_OPTIONS).forEach((key) => {
    if (patch[key] !== undefined) {
      next[key] = patch[key]
    }
  })

  return next
}

function deriveOptionsFromVariables(parsed, fallbackOptions) {
  if (!isPlainObject(parsed)) {
    return null
  }

  const candidate =
    (isPlainObject(parsed.generator?.options) && parsed.generator.options) ||
    (isPlainObject(parsed.options) && parsed.options) ||
    null

  if (!isPlainObject(candidate)) {
    return null
  }

  return mergeGeneratorOptions(fallbackOptions, candidate)
}

const initialParseResult = safeParseVariables(INITIAL_VARIABLE_SOURCE)
const initialNormalised = normaliseVariablePayload(initialParseResult.parsed || {})
const baseGeneratorOptions = mergeGeneratorOptions(DEFAULT_GENERATOR_OPTIONS, {})
const derivedInitialOptions = deriveOptionsFromVariables(initialParseResult.parsed, baseGeneratorOptions)
const initialUserOptions = derivedInitialOptions ?? baseGeneratorOptions
const initialArtifacts = generateCodeArtifacts({
  parsedVariables: initialParseResult.parsed || {},
  userOptions: initialUserOptions,
})

const initialState = {
  variableSource: INITIAL_VARIABLE_SOURCE,
  variableParseError: initialParseResult.error ? initialParseResult.error.message : null,
  parsedVariables: initialParseResult.parsed || {},
  statData: initialNormalised.statData,
  metadata: initialNormalised.metadata,
  triggers: initialNormalised.triggers,
  userOptions: initialUserOptions,
  aiAssistantResponse: '',
  generatedArtifacts: {
    html: initialArtifacts.html,
    yaml: initialArtifacts.yaml,
    script: initialArtifacts.script,
    regex: initialArtifacts.regex,
  },
  generationMeta: initialArtifacts.meta,
  lastGeneratedAt: initialArtifacts.meta?.generatedAt ?? null,
  lastParsedAt: initialParseResult.error ? null : initialArtifacts.meta?.generatedAt ?? null,
}

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.UPDATE_VARIABLE_SOURCE: {
      const {
        source,
        parsed,
        statData,
        metadata,
        triggers,
        error,
        parsedAt,
        userOptions,
      } = action.payload

      return {
        ...state,
        variableSource: source,
        variableParseError: error ? (typeof error === 'string' ? error : error.message || '解析失败') : null,
        parsedVariables: parsed ?? state.parsedVariables,
        statData: statData ?? state.statData,
        metadata: metadata ?? state.metadata,
        triggers: triggers ?? state.triggers,
        userOptions: userOptions ?? state.userOptions,
        lastParsedAt: parsed && !error ? parsedAt ?? state.lastParsedAt : state.lastParsedAt,
      }
    }
    case ACTIONS.SET_USER_OPTIONS:
      return {
        ...state,
        userOptions: action.payload ?? state.userOptions,
      }
    case ACTIONS.SET_AI_RESPONSE:
      return {
        ...state,
        aiAssistantResponse: action.payload ?? '',
      }
    case ACTIONS.GENERATE_CODE: {
      const { artifacts, meta, rawAiResponse, userOptions, parsedVariables, statData, metadata, triggers } =
        action.payload

      return {
        ...state,
        generatedArtifacts: {
          html: artifacts.html,
          yaml: artifacts.yaml,
          script: artifacts.script,
          regex: artifacts.regex,
        },
        generationMeta: meta,
        lastGeneratedAt: meta?.generatedAt ?? state.lastGeneratedAt,
        aiAssistantResponse: rawAiResponse ?? state.aiAssistantResponse,
        userOptions: userOptions ?? state.userOptions,
        parsedVariables: parsedVariables ?? state.parsedVariables,
        statData: statData ?? state.statData,
        metadata: metadata ?? state.metadata,
        triggers: triggers ?? state.triggers,
      }
    }
    default:
      return state
  }
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const updateVariableSource = useCallback(
    (nextSource) => {
      const result = safeParseVariables(nextSource)

      if (result.error) {
        dispatch({
          type: ACTIONS.UPDATE_VARIABLE_SOURCE,
          payload: {
            source: nextSource,
            error: result.error,
          },
        })
        return
      }

      const normalised = normaliseVariablePayload(result.parsed || {})
      const derivedOptions = deriveOptionsFromVariables(result.parsed, state.userOptions)

      dispatch({
        type: ACTIONS.UPDATE_VARIABLE_SOURCE,
        payload: {
          source: nextSource,
          parsed: result.parsed || {},
          statData: normalised.statData,
          metadata: normalised.metadata,
          triggers: normalised.triggers,
          userOptions: derivedOptions ?? state.userOptions,
          error: null,
          parsedAt: new Date().toISOString(),
        },
      })
    },
    [state.userOptions],
  )

  const updateUserOptions = useCallback(
    (patch) => {
      if (!isPlainObject(patch)) {
        return
      }
      const nextOptions = mergeGeneratorOptions(state.userOptions, patch)
      dispatch({ type: ACTIONS.SET_USER_OPTIONS, payload: nextOptions })
    },
    [state.userOptions],
  )

  const setAiAssistantResponse = useCallback((response) => {
    dispatch({ type: ACTIONS.SET_AI_RESPONSE, payload: response })
  }, [])

  const generateCode = useCallback(
    ({ aiResponse, options, variables } = {}) => {
      const nextParsed = isPlainObject(variables) ? variables : state.parsedVariables
      const mergedOptions = mergeGeneratorOptions(state.userOptions, options || {})
      const rawGuidance = aiResponse ?? state.aiAssistantResponse

      const artifacts = generateCodeArtifacts({
        parsedVariables: nextParsed,
        userOptions: mergedOptions,
        aiAssistantGuidance: rawGuidance,
      })

      const normalised = normaliseVariablePayload(nextParsed)

      dispatch({
        type: ACTIONS.GENERATE_CODE,
        payload: {
          artifacts,
          meta: artifacts.meta,
          rawAiResponse: rawGuidance,
          userOptions: mergedOptions,
          parsedVariables: nextParsed,
          statData: normalised.statData,
          metadata: normalised.metadata,
          triggers: normalised.triggers,
        },
      })
    },
    [state.aiAssistantResponse, state.parsedVariables, state.userOptions],
  )

  const value = useMemo(
    () => ({
      state,
      actions: {
        updateVariableSource,
        updateUserOptions,
        setAiAssistantResponse,
        generateCode,
      },
    }),
    [generateCode, setAiAssistantResponse, state, updateUserOptions, updateVariableSource],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}
