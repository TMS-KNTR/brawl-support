import { useNavigate, useRoutes } from 'react-router-dom'
import { useEffect } from 'react'
import routes from './config'

declare global {
  interface Window {
    REACT_APP_NAVIGATE?: (path: string) => void
  }
}

/**
 * グローバルナビゲート（レガシー互換）
 * 多くのページが window.REACT_APP_NAVIGATE を使っているため、
 * 全ファイル書き換えるまで残す。
 * 新しいページでは useNavigate() を直接使うこと。
 */
export function AppRoutes() {
  const navigate = useNavigate()
  const element = useRoutes(routes)

  useEffect(() => {
    window.REACT_APP_NAVIGATE = navigate
  }, [navigate])

  return element
}
