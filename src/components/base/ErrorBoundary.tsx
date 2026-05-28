import React from 'react'
import ErrorFallback from './ErrorFallback'

type Props = { children: React.ReactNode }
type State = { hasError: boolean; error: Error | null; isChunkError: boolean }

const CHUNK_ERROR_PATTERNS = [
  /Loading chunk \S+ failed/i,
  /Loading CSS chunk \S+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /not a valid JavaScript MIME type/i,
  /Importing a module script failed/i,
  /ChunkLoadError/i,
  /Unexpected token '<'/i,
]

function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false
  const haystack = `${error.name || ''} ${error.message || ''}`
  return CHUNK_ERROR_PATTERNS.some((p) => p.test(haystack))
}

const RELOAD_FLAG_KEY = 'gemusuke-chunk-reload-attempted'

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, isChunkError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isChunkError: isChunkLoadError(error) }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)

    if (isChunkLoadError(error)) {
      try {
        const alreadyAttempted = sessionStorage.getItem(RELOAD_FLAG_KEY)
        if (!alreadyAttempted) {
          sessionStorage.setItem(RELOAD_FLAG_KEY, '1')
          window.location.reload()
        }
      } catch {
        window.location.reload()
      }
    } else {
      try { sessionStorage.removeItem(RELOAD_FLAG_KEY) } catch { /* ignore */ }
    }
  }

  private handleReload = () => {
    try { sessionStorage.removeItem(RELOAD_FLAG_KEY) } catch { /* ignore */ }
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback isChunkError={this.state.isChunkError} onReload={this.handleReload} />
    }
    return this.props.children
  }
}
