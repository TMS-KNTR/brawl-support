import { BrowserRouter, useLocation } from 'react-router-dom'
import { Suspense, useState, useEffect } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { AppRoutes } from './router'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/base/ErrorBoundary'

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  if (!offline) return null
  return (
    <div className="fixed top-0 inset-x-0 z-[9999] bg-[#DC2626] text-white text-center py-2 text-[13px] font-bold">
      インターネットに接続されていません
    </div>
  )
}

function App() {
  return (
    <HelmetProvider>
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
      <OfflineBanner />
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
      </ErrorBoundary>
    </BrowserRouter>
    </HelmetProvider>
  )
}

export default App
