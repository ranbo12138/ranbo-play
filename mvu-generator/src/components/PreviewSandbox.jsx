/*
 * PreviewSandbox Component
 * 
 * Renders user-generated MVU code in an isolated iframe sandbox.
 * 
 * Isolation Strategy:
 * - Uses iframe with sandbox attributes (allow-scripts, allow-modals)
 * - Prevents top-level navigation and form submission
 * - Communicates with parent via postMessage API
 * - User code is injected via Blob URL to avoid inline eval
 * 
 * Error Handling:
 * - Captures window.onerror and unhandledrejection events
 * - Intercepts console.error calls
 * - Forwards errors to parent via postMessage
 * - Displays error overlay inside iframe
 * 
 * Props:
 * - code: string - User's MVU code to execute
 * - theme: 'light' | 'dark' - Color theme for preview
 * - deviceStyle: string - Device styling (e.g., 'ios')
 * - height: string | number - Height of iframe
 * - onRuntimeError: (error: string | null) => void - Error callback
 */

import { useEffect, useRef, useState } from 'react'
import getSandboxTemplate from '../utils/sandboxTemplate.js'
import './PreviewSandbox.css'

const PreviewSandbox = ({
  code = '',
  theme = 'light',
  deviceStyle = 'ios',
  height = '100%',
  onRuntimeError,
}) => {
  const iframeRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [externalError, setExternalError] = useState(null)
  const blobUrlRef = useRef(null)

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'sandbox-ready') {
        setIsReady(true)
      } else if (event.data?.type === 'runtime-error') {
        const errorMsg = event.data.error || 'Unknown error'
        setExternalError(errorMsg)
        if (onRuntimeError) {
          onRuntimeError(errorMsg)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [onRuntimeError])

  useEffect(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }

    if (!code?.trim()) {
      if (iframeRef.current) {
        const template = getSandboxTemplate({ theme, deviceStyle, codeUrl: '' })
        iframeRef.current.srcdoc = template
      }
      setExternalError(null)
      if (onRuntimeError) {
        onRuntimeError(null)
      }
      return
    }

    try {
      const wrappedCode = `
try {
  ${code}
  
  if (typeof window !== 'undefined' && window.parent) {
    window.parent.postMessage({ type: 'code-executed-successfully' }, '*');
  }
} catch (error) {
  console.error('Code execution error:', error.message || error);
  if (typeof window !== 'undefined' && window.parent) {
    window.parent.postMessage({
      type: 'runtime-error',
      error: error.stack || error.message || String(error)
    }, '*');
  }
}
`

      const blob = new Blob([wrappedCode], { type: 'application/javascript' })
      const blobUrl = URL.createObjectURL(blob)
      blobUrlRef.current = blobUrl

      const template = getSandboxTemplate({ theme, deviceStyle, codeUrl: blobUrl })

      if (iframeRef.current) {
        setIsReady(false)
        setExternalError(null)
        if (onRuntimeError) {
          onRuntimeError(null)
        }
        iframeRef.current.srcdoc = template
      }
    } catch (error) {
      const errorMsg = `Failed to prepare sandbox: ${error.message}`
      setExternalError(errorMsg)
      if (onRuntimeError) {
        onRuntimeError(errorMsg)
      }
    }

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [code, theme, deviceStyle, onRuntimeError])

  const containerClass = `preview-sandbox-wrapper ${
    deviceStyle === 'ios' ? 'preview-sandbox-ios-chrome' : ''
  }`.trim()

  return (
    <div className={containerClass} style={{ height }}>
      {!isReady && !externalError && (
        <div className="preview-sandbox-loading">Loading preview...</div>
      )}
      {externalError && (
        <div className="preview-error-banner">
          <div className="preview-error-banner-header">
            <span className="preview-error-banner-icon">⚠️</span>
            <span>Runtime Error</span>
          </div>
          {externalError}
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="preview-sandbox-frame"
        sandbox="allow-scripts allow-modals"
        title="Preview Sandbox"
      />
    </div>
  )
}

export default PreviewSandbox
