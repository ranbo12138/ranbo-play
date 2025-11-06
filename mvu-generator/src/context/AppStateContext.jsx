/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useReducer } from 'react'
import {
  DEFAULT_GENERATOR_OPTIONS,
  generateCodeArtifacts,
  normaliseVariablePayload,
} from '../services/codeGenerator.js'
import { getVariableSource, saveVariableSource } from '../utils/storage.js'
import { parseYamlToState, cleanInitvarFormat, generateExampleVariables } from '../utils/yamlParser.js'

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
  LOAD_EXAMPLE_VARIABLES: 'LOAD_EXAMPLE_VARIABLES',
  PASTE_INITVAR_CONTENT: 'PASTE_INITVAR_CONTENT',
  RESET_VARIABLES: 'RESET_VARIABLES',
}

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

function safeParseVariables(source) {
  return parseYamlToState(source)
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

// Load saved variable source from storage or use initial example
const savedVariableSource = getVariableSource() || INITIAL_VARIABLE_SOURCE
const initialParseResult = safeParseVariables(savedVariableSource)
const initialNormalised = normaliseVariablePayload(initialParseResult.parsed || {})
const baseGeneratorOptions = mergeGeneratorOptions(DEFAULT_GENERATOR_OPTIONS, {})
const derivedInitialOptions = deriveOptionsFromVariables(initialParseResult.parsed, baseGeneratorOptions)
const initialUserOptions = derivedInitialOptions ?? baseGeneratorOptions
const initialArtifacts = generateCodeArtifacts({
  parsedVariables: initialParseResult.parsed || {},
  userOptions: initialUserOptions,
})

const initialState = {
  variableSource: savedVariableSource,
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
    case ACTIONS.LOAD_EXAMPLE_VARIABLES: {
      const exampleSource = generateExampleVariables()
      const result = safeParseVariables(exampleSource)
      
      // Save to storage
      saveVariableSource(exampleSource)

      if (result.error) {
        return {
          ...state,
          variableSource: exampleSource,
          variableParseError: result.error.message,
        }
      }

      const normalised = normaliseVariablePayload(result.parsed || {})
      const derivedOptions = deriveOptionsFromVariables(result.parsed, state.userOptions)

      return {
        ...state,
        variableSource: exampleSource,
        variableParseError: null,
        parsedVariables: result.parsed || {},
        statData: normalised.statData,
        metadata: normalised.metadata,
        triggers: normalised.triggers,
        userOptions: derivedOptions ?? state.userOptions,
        lastParsedAt: new Date().toISOString(),
      }
    }
    case ACTIONS.PASTE_INITVAR_CONTENT: {
      const { content } = action.payload
      const cleanedContent = cleanInitvarFormat(content)
      const result = safeParseVariables(cleanedContent)
      
      // Save to storage
      saveVariableSource(cleanedContent)

      if (result.error) {
        return {
          ...state,
          variableSource: cleanedContent,
          variableParseError: result.error.message,
        }
      }

      const normalised = normaliseVariablePayload(result.parsed || {})
      const derivedOptions = deriveOptionsFromVariables(result.parsed, state.userOptions)

      return {
        ...state,
        variableSource: cleanedContent,
        variableParseError: null,
        parsedVariables: result.parsed || {},
        statData: normalised.statData,
        metadata: normalised.metadata,
        triggers: normalised.triggers,
        userOptions: derivedOptions ?? state.userOptions,
        lastParsedAt: new Date().toISOString(),
      }
    }
    case ACTIONS.RESET_VARIABLES: {
      const resetSource = ''
      saveVariableSource(resetSource)
      
      return {
        ...state,
        variableSource: resetSource,
        variableParseError: null,
        parsedVariables: {},
        statData: {},
        metadata: {},
        triggers: [],
        lastParsedAt: null,
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

      // Save to storage
      saveVariableSource(nextSource)

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

  const loadExampleVariables = useCallback(() => {
    dispatch({ type: ACTIONS.LOAD_EXAMPLE_VARIABLES })
  }, [])

  const pasteInitvarContent = useCallback((content) => {
    dispatch({ 
      type: ACTIONS.PASTE_INITVAR_CONTENT, 
      payload: { content } 
    })
  }, [])

  const resetVariables = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_VARIABLES })
  }, [])

  const value = useMemo(
    () => ({
      state,
      actions: {
        updateVariableSource,
        updateUserOptions,
        setAiAssistantResponse,
        generateCode,
        loadExampleVariables,
        pasteInitvarContent,
        resetVariables,
      },
    }),
    [generateCode, setAiAssistantResponse, state, updateUserOptions, updateVariableSource, loadExampleVariables, pasteInitvarContent, resetVariables],
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
