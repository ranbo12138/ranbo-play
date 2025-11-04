import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'

const resolvedMonacoPlugin =
  typeof monacoEditorPlugin === 'function' ? monacoEditorPlugin : monacoEditorPlugin?.default

if (typeof resolvedMonacoPlugin !== 'function') {
  throw new Error('vite-plugin-monaco-editor failed to load')
}

export default defineConfig({
  plugins: [
    react(),
    resolvedMonacoPlugin({
      languageWorkers: ['editorWorkerService', 'json', 'html', 'css', 'typescript'],
      customWorkers: [{ label: 'yaml', entry: 'monaco-yaml/yaml.worker' }],
    }),
  ],
})
