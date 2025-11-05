# Preview Sandbox Feature

## Overview

The Preview Sandbox feature provides a live, isolated environment for testing and previewing MVU status bar code within the application. It offers real-time feedback with safety guarantees and comprehensive error reporting.

## Components

### 1. PreviewSandbox Component
**Location**: `src/components/PreviewSandbox.jsx`

A React component that renders user code in an isolated iframe sandbox.

**Props**:
- `code` (string): User's MVU code to execute
- `theme` ('light' | 'dark'): Color theme for preview
- `deviceStyle` (string): Device styling preset (e.g., 'ios')
- `height` (string | number): Height of the iframe
- `onRuntimeError` (function): Callback for runtime errors

**Security Features**:
- Sandboxed iframe with restricted permissions (`allow-scripts`, `allow-modals`)
- No top-level navigation or form submission
- Code execution via Blob URL (no inline eval)
- postMessage-based communication

**Error Handling**:
- Captures `window.onerror` events
- Handles unhandled promise rejections
- Intercepts `console.error` calls
- Displays errors in overlay inside iframe
- Reports errors to parent via postMessage

### 2. CodeWorkspace Component
**Location**: `src/components/CodeWorkspace.jsx`

Integrates the Monaco code editor with the preview sandbox in a split-pane layout.

**Features**:
- Side-by-side editor and preview
- Debounced updates (400ms delay)
- Automatic code persistence to localStorage
- Real-time error feedback
- Resizable panes

### 3. SplitPane Component
**Location**: `src/components/SplitPane.jsx`

A resizable split pane container with drag-to-resize functionality.

**Props**:
- `leftContent`: React node for left pane
- `rightContent`: React node for right pane
- `minLeftWidth`: Minimum width for left pane (default: 200px)
- `minRightWidth`: Minimum width for right pane (default: 200px)
- `defaultSplit`: Initial split percentage (default: 50)
- `onSplitChange`: Callback when split changes

### 4. useDebouncedValue Hook
**Location**: `src/hooks/useDebouncedValue.js`

Custom React hook for debouncing values.

**Usage**:
```javascript
const debouncedCode = useDebouncedValue(code, 400)
```

**Parameters**:
- `value`: The value to debounce
- `delay`: Debounce delay in milliseconds (default: 300ms)

### 5. Sandbox Template Utility
**Location**: `src/utils/sandboxTemplate.js`

Generates the HTML template for the iframe sandbox.

**Function**: `getSandboxTemplate({ theme, deviceStyle, codeUrl })`

Returns a complete HTML document with:
- Themed styling based on light/dark mode
- Error overlay infrastructure
- Console interception and error forwarding
- Script loader for user code

### 6. Storage Utilities
**Location**: `src/utils/storage.js`

Provides localStorage helpers for persisting preview code.

**Functions**:
- `getPreviewCode()`: Retrieves saved code
- `savePreviewCode(code)`: Saves code to localStorage
- `clearPreviewCode()`: Clears saved code

**Storage Key**: `mvu-generator:preview:code`

## Architecture

### Communication Flow

```
Parent Window (React App)
    ↓ (sets srcdoc with Blob URL)
Iframe Sandbox
    ↓ (postMessage)
Parent receives:
  - 'sandbox-ready': Iframe loaded
  - 'runtime-error': Error occurred
  - 'code-executed-successfully': Code ran without errors
```

### Update Flow

```
User types in Editor
    ↓
State updates (code)
    ↓
Debounce (400ms)
    ↓
Debounced code prop
    ↓
PreviewSandbox receives new code
    ↓
Creates Blob URL
    ↓
Generates new srcdoc
    ↓
Iframe reloads with new code
    ↓
Code executes in sandbox
    ↓
Success/Error reported back
```

## Security Considerations

### Iframe Sandbox Attributes
- `allow-scripts`: Allows JavaScript execution
- `allow-modals`: Allows alert/confirm/prompt
- **Disallowed**: 
  - Top navigation
  - Form submission
  - Same-origin access
  - Popups without user interaction

### Code Injection Prevention
- User code is never directly injected into HTML
- Code is wrapped in try-catch and stored as Blob
- Blob URL is used as script source
- No `eval()` or `innerHTML` with user content

### Error Containment
- Errors are caught and displayed without crashing parent
- Multiple error types handled (runtime, promise rejections, console errors)
- Error messages sanitized before display

## Usage Example

```javascript
import PreviewSandbox from './components/PreviewSandbox'
import { useDebouncedValue } from './hooks/useDebouncedValue'

function MyComponent() {
  const [code, setCode] = useState('')
  const debouncedCode = useDebouncedValue(code, 400)
  
  const handleError = (error) => {
    if (error) {
      console.error('Preview error:', error)
    }
  }
  
  return (
    <PreviewSandbox
      code={debouncedCode}
      theme="dark"
      deviceStyle="ios"
      height="100%"
      onRuntimeError={handleError}
    />
  )
}
```

## Styling

Custom styles are defined in `src/components/PreviewSandbox.css`:
- `.preview-sandbox-wrapper`: Container styling
- `.preview-sandbox-frame`: Iframe styling
- `.preview-sandbox-loading`: Loading indicator
- `.preview-sandbox-ios-chrome`: iOS-style chrome
- `.preview-error-banner`: Error banner styling

## Performance Considerations

- **Debouncing**: Updates are debounced to prevent excessive re-rendering
- **Blob URL Cleanup**: URLs are properly revoked to prevent memory leaks
- **Minimal Re-renders**: useCallback and useMemo used where appropriate
- **Lazy Loading**: Monaco editor loads on demand

## Future Enhancements

Potential improvements for future iterations:
- Export to image/HTML
- Code templates and snippets
- Version history/undo
- Collaborative editing
- Performance profiling
- Network request interception
- Console output display in parent
