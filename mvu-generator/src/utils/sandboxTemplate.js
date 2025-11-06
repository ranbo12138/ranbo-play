export function getSandboxTemplate({ theme = 'light', deviceStyle = 'ios', codeUrl = '' }) {
  const isDark = theme === 'dark'
  const bgColor = isDark ? '#0f172a' : '#f1f5f9'
  const textColor = isDark ? '#e2e8f0' : '#0f172a'
  const errorBg = isDark ? '#1e293b' : '#ffffff'
  const errorText = isDark ? '#fca5a5' : '#dc2626'
  const errorBorder = isDark ? '#ef4444' : '#fca5a5'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview Sandbox</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      background: ${bgColor};
      color: ${textColor};
      padding: 16px;
      min-height: 100vh;
      overflow: auto;
    }

    .status-bar-container {
      ${deviceStyle === 'ios' ? 'border-radius: 12px;' : ''}
      overflow: hidden;
    }

    #error-overlay {
      display: none;
      position: fixed;
      top: 16px;
      left: 16px;
      right: 16px;
      background: ${errorBg};
      border: 2px solid ${errorBorder};
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      max-height: calc(100vh - 32px);
      overflow: auto;
    }

    #error-overlay.visible {
      display: block;
    }

    .error-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-weight: 600;
      color: ${errorText};
    }

    .error-icon {
      font-size: 20px;
    }

    .error-message {
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
      color: ${textColor};
    }

    .error-dismiss {
      margin-top: 12px;
      padding: 6px 12px;
      background: ${isDark ? '#334155' : '#e2e8f0'};
      border: none;
      border-radius: 4px;
      color: ${textColor};
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
    }

    .error-dismiss:hover {
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div id="error-overlay">
    <div class="error-header">
      <span class="error-icon">⚠️</span>
      <span>Runtime Error</span>
    </div>
    <div class="error-message" id="error-message"></div>
    <button class="error-dismiss" onclick="dismissError()">Dismiss</button>
  </div>

  <div id="app" class="status-bar-container"></div>

  <script>
    let errorCount = 0;

    function showError(message) {
      const overlay = document.getElementById('error-overlay');
      const messageEl = document.getElementById('error-message');
      messageEl.textContent = message;
      overlay.classList.add('visible');
      
      window.parent.postMessage({
        type: 'runtime-error',
        error: message,
        timestamp: Date.now()
      }, '*');
    }

    function dismissError() {
      const overlay = document.getElementById('error-overlay');
      overlay.classList.remove('visible');
    }

    window.onerror = function(message, source, lineno, colno, error) {
      errorCount++;
      const errorMsg = error ? error.stack || error.message : message;
      showError(errorMsg);
      return true;
    };

    window.addEventListener('unhandledrejection', function(event) {
      errorCount++;
      showError('Unhandled Promise Rejection: ' + (event.reason?.message || event.reason));
    });

    const originalConsoleError = console.error;
    console.error = function(...args) {
      originalConsoleError.apply(console, args);
      errorCount++;
      showError(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '));
    };

    window.parent.postMessage({ type: 'sandbox-ready' }, '*');

    ${codeUrl ? `
    try {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = '${codeUrl}';
      script.onerror = function(e) {
        showError('Failed to load user code: ' + e.message);
      };
      document.body.appendChild(script);
    } catch (e) {
      showError('Failed to initialize: ' + e.message);
    }
    ` : ''}
  </script>
</body>
</html>`
}

export default getSandboxTemplate
