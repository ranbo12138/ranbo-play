# Architecture Overview

This document describes the architecture, code structure, and data flow of the ranbo-play application.

## 🏗️ Project Structure

```
ranbo-play/
├── mvu-generator/          # Main React application
│   ├── src/
│   │   ├── components/     # React UI components
│   │   ├── context/        # React context providers
│   │   ├── services/       # API and external service integrations
│   │   ├── utils/          # Utility functions and helpers
│   │   ├── assets/         # Static assets
│   │   ├── App.jsx         # Root application component
│   │   └── main.jsx        # Application entry point
│   ├── public/             # Public static files
│   ├── index.html          # HTML template
│   ├── vite.config.js      # Vite build configuration
│   └── package.json        # Dependencies and scripts
├── src/                    # Shared modules and utilities
│   ├── services/           # OpenAI service integration
│   ├── storage.js          # localStorage management
│   └── utils/              # Prompt utilities
└── docs/                   # Documentation
```

## 🧩 Core Components

### Layout Component (`mvu-generator/src/components/Layout.jsx`)

The main application layout that orchestrates all panels:

```jsx
const Layout = () => {
  // Theme management
  const { theme, toggleTheme } = useTheme()
  
  // Grid layout with responsive design
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header>
        {/* App header with theme toggle */}
      </header>
      <main className="grid lg:grid-cols-12">
        <VariableEditor />     {/* lg:col-span-3, lg:row-span-2 */}
        <ChatInterface />     {/* lg:col-span-5 */}
        <PreviewPanel />      {/* lg:col-span-4, lg:row-span-2 */}
        <CodeOutput />        {/* lg:col-span-5 */}
      </main>
    </div>
  )
}
```

**Features:**
- Responsive grid layout using Tailwind CSS
- Theme switching with smooth transitions
- Component isolation and modularity
- Accessibility considerations (ARIA labels, semantic HTML)

### ChatInterface Component (`mvu-generator/src/components/ChatInterface.jsx`)

AI chat interface for testing MVU prompts and variable interactions:

```jsx
const ChatInterface = () => {
  // Chat state management
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  
  // API integration
  const handleSendMessage = async () => {
    // Assemble prompt with MVU context
    const prompt = assemblePrompt({
      userInput: input,
      variableSummary,
      context: selectedContext
    })
    
    // Call OpenAI API
    const response = await createChatCompletion({
      messages: prompt.messages,
      ...apiSettings
    })
    
    // Update chat history
    setMessages(prev => [...prev, userMessage, assistantMessage])
  }
  
  return (
    <div className="flex h-full flex-col">
      {/* Chat messages display */}
      {/* Input area with send button */}
    </div>
  )
}
```

**Current State**: Placeholder implementation for future development.

### CodeEditor Component (`mvu-generator/src/components/CodeEditor.jsx`)

Monaco editor integration for code editing with syntax highlighting:

```jsx
import Editor from '@monaco-editor/react'

const CodeEditor = ({ language, value, onChange, options, readOnly }) => {
  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={onChange}
      options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: 'on',
        ...options
      }}
      theme={isDark ? 'vs-dark' : 'light'}
      readOnly={readOnly}
    />
  )
}
```

**Features:**
- Multi-language support (JavaScript, YAML, JSON, etc.)
- Theme-aware syntax highlighting
- Configurable editor options
- Read-only mode for display purposes

### VariableEditor Component (`mvu-generator/src/components/VariableEditor.jsx`)

YAML variable definition editor with Monaco integration:

```jsx
const VariableEditor = () => {
  const [variables, setVariables] = useState('')
  const [parsedVariables, setParsedVariables] = useState({})
  
  // Parse YAML and update variable summary
  const handleVariableChange = (value) => {
    setVariables(value)
    try {
      const parsed = parseVariableSummary(value)
      setParsedVariables(parsed)
      saveVariableSummary({ raw: value, parsed })
    } catch (error) {
      console.error('Failed to parse variables:', error)
    }
  }
  
  return (
    <div className="flex h-full flex-col">
      <CodeEditor
        language="yaml"
        value={variables}
        onChange={handleVariableChange}
        options={{ lineNumbers: 'on' }}
      />
    </div>
  )
}
```

### PreviewPanel Component (`mvu-generator/src/components/PreviewPanel.jsx`)

Live preview of generated status bars and UI components:

```jsx
const PreviewPanel = () => {
  const [template, setTemplate] = useState('')
  const [previewData, setPreviewData] = useState({})
  
  // Inject variables into template
  const renderPreview = () => {
    // Variable substitution logic
    // Template rendering with current variable values
  }
  
  return (
    <div className="preview-container">
      {/* Rendered template preview */}
      {/* Theme switching for preview */}
    </div>
  )
}
```

**Current State**: Placeholder implementation for future development.

## 🔧 Services Layer

### OpenAI Service (`src/services/openai.js`)

Comprehensive OpenAI-compatible API client with streaming support:

```javascript
export async function createChatCompletion({
  apiKey,
  providerType = 'openai',
  baseUrl = 'https://api.openai.com/v1',
  model = 'gpt-3.5-turbo',
  messages = [],
  temperature = 0.7,
  stream = false,
  onToken,
  onComplete,
  onError
} = {}) {
  // Request preparation
  const url = `${normaliseBaseUrl(baseUrl)}${buildEndpointPath(endpointPath)}`
  const requestBody = { model, messages, temperature, ... }
  
  // Streaming vs non-streaming execution
  if (stream && onToken) {
    return await executeStreamingRequest(url, requestInit, { onToken, onComplete })
  } else {
    return await executeStandardRequest(url, requestInit)
  }
}
```

**Key Features:**
- Multi-provider support (OpenAI, Azure, OpenRouter)
- Automatic streaming fallback
- Provider-specific header handling
- Error handling and retry logic
- Request/response transformation

### Storage Service (`src/storage.js`)

localStorage management with base64 encoding for sensitive data:

```javascript
// Storage keys with namespace
const STORAGE_NAMESPACE = 'mvuChat'
const API_SETTINGS_KEY = `${STORAGE_NAMESPACE}:apiSettings`
const CHAT_HISTORY_KEY = `${STORAGE_NAMESPACE}:chatHistory`
const VARIABLE_SUMMARY_KEY = `${STORAGE_NAMESPACE}:variableSummary`

// Secret encoding/decoding
function encodeSecret(value) {
  if (typeof btoa === 'function') {
    return btoa(toBinaryString(value))
  }
  // Fallback for Node.js environments
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf-8').toString('base64')
  }
}

// API settings management
export function getApiSettings() {
  const stored = readJSON(API_SETTINGS_KEY, null)
  const { encodedKey, apiKey, ...rest } = stored || {}
  const decodedKey = decodeSecret(encodedKey || apiKey)
  
  return {
    ...DEFAULT_SETTINGS,
    ...rest,
    apiKey: decodedKey
  }
}
```

**Features:**
- Namespaced storage keys
- Base64 encoding for API keys
- JSON serialization with error handling
- Default value fallbacks
- Cross-browser compatibility

## 🛠️ Utilities

### Prompt Utilities (`src/utils/prompts.js`)

MVU-aligned prompt assembly and template management:

```javascript
export function assemblePrompt({
  userInput,
  history = [],
  variableSummary = {},
  context = {},
  includeSystem = true
} = {}) {
  // Parse variable summary
  const parsedSummary = variableSummary?.parsed || variableSummary
  
  // Build system prompt with variable glance
  const systemPrompt = includeSystem
    ? applyTemplate(SYSTEM_PROMPT_TEMPLATE, {
        VARIABLE_GLANCE: buildVariableGlance(parsedSummary)
      })
    : ''
  
  // Build context sections (stat_data, lorebook, memory)
  const contextSections = buildContextSections(parsedSummary, context)
  
  // Assemble user prompt with context
  const userPrompt = applyTemplate(USER_PROMPT_TEMPLATE, {
    USER_INPUT: userInput.trim(),
    CONTEXT_BLOCK: contextSections.join('\n\n')
  })
  
  // Construct message array
  const messages = []
  if (includeSystem && systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push(...history)
  messages.push({ role: 'user', content: userPrompt })
  
  return { systemPrompt, userPrompt, contextSections, messages }
}
```

**Key Functions:**
- `assemblePrompt()` - Complete prompt construction
- `parseVariableSummary()` - Variable parsing from YAML/JSON
- `buildVariableGlance()` - Variable overview generation
- `buildContextSections()` - MVU context assembly
- `applyTemplate()` - Template variable substitution

**MVU Context Macros:**
```javascript
const CONTEXT_MACROS = {
  statData: '{{get_message_variable::stat_data.summary}}',
  lorebook: '{{get_message_variable::world_book.active_nodes}}',
  memory: '{{get_message_variable::memory.shards}}'
}
```

## 🔄 Data Flow

### Application Initialization Flow

```
1. App.jsx mounts
   ↓
2. Layout component loads
   ↓
3. Theme context initializes
   ↓
4. Components load initial data:
   - VariableEditor: load from localStorage
   - ChatInterface: load chat history
   - PreviewPanel: load last template
   ↓
5. API settings loaded from storage
   ↓
6. Application ready for user interaction
```

### Chat Interaction Flow

```
User Input
   ↓
VariableEditor → Variable Summary
   ↓
ChatInterface → assemblePrompt()
   ↓
Prompt Assembly:
   - System prompt with variable glance
   - Context sections (stat_data, etc.)
   - User input
   ↓
OpenAI Service → API Request
   ↓
Response Processing:
   - Stream tokens to UI (if streaming)
   - Update chat history
   - Extract generated code
   ↓
CodeEditor → Display generated code
   ↓
PreviewPanel → Update preview
```

### Variable Management Flow

```
YAML Input (VariableEditor)
   ↓
parseVariableSummary()
   ↓
saveVariableSummary() → localStorage
   ↓
buildVariableGlance() → Prompt context
   ↓
Template Rendering (PreviewPanel)
   ↓
Variable substitution in templates
```

## 🎨 UI/UX Architecture

### Component Hierarchy

```
App
└── Layout
    ├── Header
    │   ├── App Title
    │   └── Theme Toggle
    └── Main Grid
        ├── VariableEditor
        │   ├── Panel Header
        │   └── CodeEditor (YAML)
        ├── ChatInterface
        │   ├── Panel Header
        │   ├── Message List
        │   └── Input Area
        ├── PreviewPanel
        │   ├── Panel Header
        │   └── Preview Content
        └── CodeOutput
            ├── Panel Header
            └── CodeEditor (JavaScript)
```

### Theme System

```javascript
// Theme context provider
const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => 
    localStorage.getItem('theme') || 'light'
  )
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
```

### Responsive Design

- **Mobile** (< 640px): Single column layout
- **Tablet** (640px - 1024px): Two-column layout
- **Desktop** (> 1024px): Four-column grid layout

## 🔌 Integration Points

### External APIs

1. **OpenAI-compatible APIs**
   - Chat completions
   - Streaming support
   - Multiple provider support

2. **MVU Framework** (Future)
   - Variable management
   - Template rendering
   - Status bar generation

### Browser APIs

1. **localStorage** - Persistent configuration and data
2. **Fetch API** - HTTP requests to AI services
3. **Web Workers** - Monaco editor language workers

## 🧪 Testing Strategy

### Component Testing
- Unit tests for utility functions
- Component rendering tests
- User interaction simulations

### Integration Testing
- API service integration
- Storage layer functionality
- Prompt assembly accuracy

### E2E Testing
- Complete user workflows
- Cross-browser compatibility
- Performance benchmarks

## 🚀 Performance Considerations

### Monaco Editor Optimization
- Lazy loading of language workers
- Worker thread management
- Syntax highlighting performance

### Chat Performance
- Message history pagination
- Streaming response handling
- Memory management for long conversations

### Storage Optimization
- localStorage quota management
- Data compression for large histories
- Cleanup strategies for old data

## 🔒 Security Considerations

### API Key Storage
- Base64 encoding (obfuscation, not encryption)
- No exposure in client-side logs
- Secure transmission over HTTPS

### Content Security
- Input sanitization for user content
- XSS prevention in rendered templates
- CORS configuration for API endpoints

## 📈 Scalability

### Frontend Architecture
- Component-based modularity
- Lazy loading for large components
- State management patterns

### Backend Integration
- API abstraction layers
- Provider-agnostic design
- Caching strategies for API responses

---

This architecture provides a solid foundation for building a comprehensive MVU development environment with room for future enhancements and integrations.