import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[SUPABASE] 環境変数が設定されていません。.envファイルを確認してください。')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Supabase Edge Function を呼ぶヘルパー
 * フロントからEdge Functionを呼ぶときはこれを使う
 *
 * 使い方:
 *   const result = await invokeEdgeFunction('create-order-payment', { ... })
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body: Record<string, any>,
  options?: { requireAuth?: boolean }
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': supabaseAnonKey,
  }

  // 認証が必要な場合、JWTトークンを付ける
  if (options?.requireAuth !== false) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
  }

  const url = `${supabaseUrl}/functions/v1/${functionName}`

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(errorData.error || `Edge Function error: ${res.status}`)
  }

  return res.json()
}
