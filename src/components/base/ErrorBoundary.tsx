import React from 'react'

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
      const isChunk = this.state.isChunkError
      return (
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5E5E5] p-7 text-center">
            <div className="w-14 h-14 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="text-[18px] font-bold text-[#111] mb-2">
              {isChunk ? '新しいバージョンが利用可能です' : 'エラーが発生しました'}
            </h1>
            <p className="text-[13px] text-[#888] mb-5">
              {isChunk
                ? 'ページを再読み込みすると、最新版に更新されます。'
                : '予期しないエラーが発生しました。ページを再読み込みしてください。'}
            </p>
            <button
              onClick={this.handleReload}
              className="inline-block px-6 py-2.5 text-[13px] font-bold bg-[#111] text-white rounded-xl hover:bg-[#333] transition-colors cursor-pointer"
            >
              再読み込み
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
