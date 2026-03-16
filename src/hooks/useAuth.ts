import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Role = 'customer' | 'employee' | 'admin'
export type ProfileStatus = 'idle' | 'loading' | 'ready' | 'error'

export type UserProfile = {
  id: string
  role: Role | null
  is_banned?: boolean
  warning_count?: number
  [key: string]: any
}

export function normalizeRole(role: any): Role | null {
  const r = String(role ?? '').toLowerCase()
  if (r === 'client') return 'customer'
  if (r === 'worker') return 'employee'
  if (r === 'customer') return 'customer'
  if (r === 'employee') return 'employee'
  if (r === 'admin') return 'admin'
  return null
}

/** タイムアウト付きPromise */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | { __timeout: true }> {
  return Promise.race([
    promise,
    new Promise<{ __timeout: true }>((resolve) =>
      setTimeout(() => resolve({ __timeout: true }), ms)
    ),
  ])
}

const PROFILE_CACHE_KEY = 'brawl_support_profile'
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000 // 5分

function getProfileFromCache(userId: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY)
    if (!raw) return null
    const { id, profile, at } = JSON.parse(raw)
    if (id !== userId || !profile) return null
    if (Date.now() - (at || 0) > PROFILE_CACHE_TTL_MS) return null
    return { ...profile, id: userId, role: normalizeRole(profile.role) }
  } catch {
    return null
  }
}

function setProfileCache(userId: string, profile: UserProfile) {
  try {
    localStorage.setItem(
      PROFILE_CACHE_KEY,
      JSON.stringify({ id: userId, profile: { ...profile, id: userId }, at: Date.now() })
    )
  } catch {
    /* ignore */
  }
}

function clearProfileCache() {
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY)
  } catch {
    /* ignore */
  }
}

export function useAuthImpl() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('idle')
  const [profileError, setProfileError] = useState<string | null>(null)

  const activeProfileReqId = useRef(0)
  /** 最後に正常取得したプロフィール。タイムアウト時に上書きしないために使用 */
  const lastKnownProfileRef = useRef<UserProfile | null>(null)

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      clearProfileCache()
      lastKnownProfileRef.current = null
      setUser(null)
      setUserProfile(null)
      setProfileStatus('idle')
      setProfileError(null)
      setAuthLoading(false)
    }
  }, [])

  // ================================
  // fetchUserProfile（タイムアウト付き安全版）
  // ================================
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    const reqId = ++activeProfileReqId.current
    setProfileError(null)

    const cached = getProfileFromCache(userId)
    if (cached) {
      lastKnownProfileRef.current = cached
      setUserProfile(cached)
      setProfileStatus('ready')
      setAuthLoading(false)
      // バックグラウンドで最新を取得（結果で上書き）
      supabase.from('profiles').select('*').eq('id', userId).single().then(({ data }) => {
        if (reqId !== activeProfileReqId.current) return
        if (data) {
          const normalized: UserProfile = { ...data, id: userId, role: normalizeRole(data?.role) }
          lastKnownProfileRef.current = normalized
          setUserProfile(normalized)
          setProfileCache(userId, normalized)
        }
      }).catch(() => {})
      return cached
    }

    setProfileStatus('loading')
    const PROFILE_TIMEOUT_MS = 15000

    const doFetch = () =>
      withTimeout(
        supabase.from('profiles').select('*').eq('id', userId).single(),
        PROFILE_TIMEOUT_MS
      )

    try {
      console.log('[fetchUserProfile] start', userId)
      let queryResult = await doFetch()

      if (reqId !== activeProfileReqId.current) {
        console.log('[fetchUserProfile] stale request, skipping')
        return null
      }

      if (queryResult && '__timeout' in queryResult) {
        const fromCache = getProfileFromCache(userId)
        if (fromCache) {
          lastKnownProfileRef.current = fromCache
          setUserProfile(fromCache)
          setProfileStatus('ready')
          return fromCache
        }
        if (lastKnownProfileRef.current?.id === userId) {
          setProfileStatus('ready')
          return lastKnownProfileRef.current
        }
        queryResult = await doFetch()
        if (reqId !== activeProfileReqId.current) return null
        if (queryResult && '__timeout' in queryResult) {
          const fromCache2 = getProfileFromCache(userId)
          if (fromCache2) {
            lastKnownProfileRef.current = fromCache2
            setUserProfile(fromCache2)
            setProfileStatus('ready')
            return fromCache2
          }
          console.warn('[fetchUserProfile] TIMEOUT after retry - using fallback role')
          const fallback: UserProfile = { id: userId, role: 'customer' }
          setUserProfile(fallback)
          setProfileStatus('ready')
          return fallback
        }
      }

      const { data, error } = queryResult as any

      console.log('[fetchUserProfile] response:', { data, error })

      // エラーがある場合
      if (error) {
        console.error('[fetchUserProfile] query error:', error.code, error.message)

        // PGRST116 = プロフィールが存在しない → 自動作成
        if (error.code === 'PGRST116') {
          console.log('[fetchUserProfile] no profile found, auto-creating')
          return await autoCreateProfile(userId, reqId)
        }

        if (lastKnownProfileRef.current?.id === userId) {
          setProfileStatus('ready')
          return lastKnownProfileRef.current
        }
        const fromCache = getProfileFromCache(userId)
        if (fromCache) {
          lastKnownProfileRef.current = fromCache
          setUserProfile(fromCache)
          setProfileStatus('ready')
          return fromCache
        }
        console.warn('[fetchUserProfile] using fallback due to error')
        const fallback: UserProfile = { id: userId, role: 'customer' }
        setUserProfile(fallback)
        setProfileStatus('ready')
        return fallback
      }

      // データが無い場合
      if (!data) {
        console.log('[fetchUserProfile] no data, auto-creating')
        return await autoCreateProfile(userId, reqId)
      }

      // 正常取得
      const normalized: UserProfile = {
        ...(data ?? {}),
        id: userId,
        role: normalizeRole(data?.role),
      }

      console.log('[fetchUserProfile] SUCCESS, role=', normalized.role)
      lastKnownProfileRef.current = normalized
      setProfileCache(userId, normalized)
      setUserProfile(normalized)
      setProfileStatus('ready')
      return normalized

    } catch (e: any) {
      console.error('[fetchUserProfile] catch:', e)
      if (reqId !== activeProfileReqId.current) return null
      if (lastKnownProfileRef.current?.id === userId) {
        setProfileStatus('ready')
        return lastKnownProfileRef.current
      }
      const fromCache = getProfileFromCache(userId)
      if (fromCache) {
        lastKnownProfileRef.current = fromCache
        setUserProfile(fromCache)
        setProfileStatus('ready')
        return fromCache
      }
      const fallback: UserProfile = { id: userId, role: 'customer' }
      setUserProfile(fallback)
      setProfileStatus('ready')
      return fallback
    }
  }, [])

  /** プロフィール自動作成 */
  const autoCreateProfile = useCallback(async (userId: string, reqId: number): Promise<UserProfile | null> => {
    try {
      console.log('[autoCreateProfile] inserting...')

      const insertResult = await withTimeout(
        supabase
          .from('profiles')
          .insert({
            id: userId,
            role: 'customer',
            warning_count: 0,
            is_banned: false,
          }),
        5000
      )

      if (insertResult && '__timeout' in insertResult) {
        console.error('[autoCreateProfile] insert timeout')
        const fallback: UserProfile = { id: userId, role: 'customer' }
        setUserProfile(fallback)
        setProfileStatus('ready')
        return fallback
      }

      const { error: insertError } = insertResult as any

      if (insertError) {
        console.error('[autoCreateProfile] insert failed:', insertError.message)
      }

      // 再取得
      const refetchResult = await withTimeout(
        supabase.from('profiles').select('*').eq('id', userId).single(),
        5000
      )

      if (reqId !== activeProfileReqId.current) return null

      if (refetchResult && '__timeout' in refetchResult) {
        const fallback: UserProfile = { id: userId, role: 'customer' }
        setUserProfile(fallback)
        setProfileStatus('ready')
        return fallback
      }

      const { data: created, error: refetchError } = refetchResult as any

      if (refetchError || !created) {
        console.warn('[autoCreateProfile] refetch failed, using fallback')
        const fallback: UserProfile = { id: userId, role: 'customer' }
        setUserProfile(fallback)
        setProfileStatus('ready')
        return fallback
      }

      const normalized: UserProfile = {
        ...(created ?? {}),
        id: userId,
        role: normalizeRole(created?.role),
      }

      console.log('[autoCreateProfile] success, role=', normalized.role)
      lastKnownProfileRef.current = normalized
      setProfileCache(userId, normalized)
      setUserProfile(normalized)
      setProfileStatus('ready')
      return normalized
    } catch (e: any) {
      console.error('[autoCreateProfile] catch:', e)
      if (reqId !== activeProfileReqId.current) return null
      const fallback: UserProfile = { id: userId, role: 'customer' }
      setUserProfile(fallback)
      setProfileStatus('ready')
      return fallback
    }
  }, [])

  // ================================
  // auth init
  // ================================
  useEffect(() => {
    let mounted = true
    let initialSessionHandled = false

    setAuthLoading(true)

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      const sessionUser = session?.user ?? null
      console.log('[auth] onAuthStateChange', event, sessionUser?.id)

      setUser(sessionUser)

      // INITIAL_SESSIONフラグは、セッションの有無にかかわらず設定する
      if (event === 'INITIAL_SESSION') {
        initialSessionHandled = true
      }

      if (!sessionUser?.id) {
        setUserProfile(null)
        setProfileStatus('idle')
        setAuthLoading(false)
        return
      }

      // INITIAL_SESSION: ページ読み込み時の最初のイベント。ここでprofile取得。
      if (event === 'INITIAL_SESSION') {
        await fetchUserProfile(sessionUser.id)
        if (mounted) setAuthLoading(false)
        return
      }

      // SIGNED_IN: ページ読み込み時にINITIAL_SESSIONより先に来ることがある。
      // その場合はスキップ（INITIAL_SESSIONで取得するため）。
      // ログインボタンを押した時（initialSessionHandled=true）のみ取得。
      if (event === 'SIGNED_IN') {
        if (!initialSessionHandled) {
          console.log('[auth] SIGNED_IN skipped (waiting for INITIAL_SESSION)')
          return
        }
        console.log('[auth] SIGNED_IN processing profile fetch')
        setAuthLoading(true)
        await fetchUserProfile(sessionUser.id)
        if (mounted) setAuthLoading(false)
        return
      }

      // TOKEN_REFRESHED / USER_UPDATED（タブ・ブラウザ切替で発火しやすい）
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (lastKnownProfileRef.current?.id === sessionUser.id) {
          setProfileStatus('ready')
          if (mounted) setAuthLoading(false)
          return
        }
        await fetchUserProfile(sessionUser.id)
        if (mounted) setAuthLoading(false)
      }
    })

    return () => {
      mounted = false
      sub?.subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  const loading = authLoading || profileStatus === 'loading'

  return useMemo(
    () => ({
      user,
      userProfile,
      loading,
      profileStatus,
      profileError,
      fetchUserProfile,
      signOut,
    }),
    [user, userProfile, loading, profileStatus, profileError, fetchUserProfile, signOut]
  )
}
