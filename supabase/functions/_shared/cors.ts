/**
 * CORS ヘルパー — SITE_URL のオリジンのみ許可
 */

const RAW_SITE_URL = Deno.env.get('SITE_URL') || ''
// SITE_URL からオリジンを安全に抽出
let ALLOWED_ORIGIN = ''
try { ALLOWED_ORIGIN = RAW_SITE_URL ? new URL(RAW_SITE_URL).origin : '' } catch { /* invalid URL */ }

console.log('[CORS] SITE_URL =', RAW_SITE_URL, '| ALLOWED_ORIGIN =', ALLOWED_ORIGIN)

export function getCorsHeaders(req?: Request): Record<string, string> {
  const requestOrigin = req?.headers.get('origin') ?? ''

  let origin = ''
  if (ALLOWED_ORIGIN && requestOrigin === ALLOWED_ORIGIN) {
    // SITE_URL と一致 → 許可
    origin = requestOrigin
  } else if (!requestOrigin && ALLOWED_ORIGIN) {
    // Origin ヘッダーがない場合（サーバー間通信等）
    origin = ALLOWED_ORIGIN
  }
  // それ以外（不一致）は origin を設定しない → ブロック

  return {
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature, x-internal-secret',
    'Vary': 'Origin',
  }
}

/** OPTIONS プリフライト用レスポンスを返す */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }
  return null
}
