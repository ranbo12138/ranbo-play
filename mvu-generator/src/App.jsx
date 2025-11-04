import { useMemo } from 'react'
import Layout from './components/Layout.jsx'
import { AppStateProvider, createInitialAppState } from './context/AppStateContext.jsx'

const App = () => {
  const initialState = useMemo(() => createInitialAppState(), [])

  return (
    <AppStateProvider initialState={initialState}>
      <Layout />
    </AppStateProvider>
  )
}

export default App
