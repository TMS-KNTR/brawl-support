import { BrowserRouter } from 'react-router-dom'
import { Suspense } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { AppRoutes } from './router'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <HelmetProvider>
    <BrowserRouter>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen text-gray-500">
              読み込み中...
            </div>
          }
        >
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
    </HelmetProvider>
  )
}

export default App
