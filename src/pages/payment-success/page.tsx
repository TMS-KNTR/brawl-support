import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const navigate = useNavigate()
  const { user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [chatThreadId, setChatThreadId] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      return
    }
    if (!user) return // userロード待ち（loadingのまま）

    // DBで注文の支払いステータスを確認（Webhookで更新されるまでリトライ）
    let attempts = 0
    const maxAttempts = 15
    const checkPayment = async () => {
      try {
        // session_id で直接検索（より正確）
        const { data } = await supabase
          .from('orders')
          .select('id, status')
          .eq('stripe_checkout_session_id', sessionId)
          .maybeSingle()

        if (data) {
          setStatus('success')
          return
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkPayment, 2000)
        } else {
          // Webhookが遅延しても一応成功表示（session_idがあるため）
          setStatus('success')
        }
      } catch {
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkPayment, 2000)
        } else {
          setStatus('success')
        }
      }
    }
    checkPayment()
  }, [sessionId, user])

  // session_id に対応する注文の chat_thread_id を取得
  useEffect(() => {
    if (!user || status !== 'success' || !sessionId) return
    const fetchChatThread = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, chat_threads:chat_threads(id)')
        .eq('stripe_checkout_session_id', sessionId)
        .maybeSingle()
      if (!error && data) {
        const thread = Array.isArray(data.chat_threads) ? data.chat_threads[0] : data.chat_threads
        if (thread?.id) setChatThreadId(thread.id)
      }
    }
    fetchChatThread()
  }, [user, status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-8 h-8 mx-auto mb-3">
            <div className="absolute inset-0 border-2 border-[#E5E5E5] rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-[#111] rounded-full animate-spin" />
          </div>
          <p className="text-[13px] text-[#888]">決済情報を確認中...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5E5E5] p-7 text-center">
          <div className="w-14 h-14 rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-4">
            <i className="ri-close-line text-[24px] text-[#DC2626]"></i>
          </div>
          <h1 className="text-[18px] font-bold text-[#111] mb-2">決済情報が確認できません</h1>
          <p className="text-[13px] text-[#888] mb-6">このページに直接アクセスした場合、決済情報を取得できません。</p>
          <Link to="/"
            className="inline-block px-6 py-2.5 text-[13px] font-bold bg-[#111] text-white rounded-xl hover:bg-[#333] transition-colors">
            ホームに戻る
          </Link>
        </div>
      </div>
    )
  }

  const handleNext = () => {
    if (chatThreadId) {
      navigate(`/chat/${chatThreadId}?guide=open`)
    } else {
      navigate('/dashboard/customer')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-7 text-center">
          {/* 決済完了 */}
          <style>{`
            @keyframes successRingScale {
              0% { transform: scale(0); opacity: 0; }
              50% { transform: scale(1.15); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes successCheckDraw {
              0% { stroke-dashoffset: 24; opacity: 0; }
              40% { opacity: 1; }
              100% { stroke-dashoffset: 0; opacity: 1; }
            }
            @keyframes successRingPulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(5,150,105,0.25); }
              50% { box-shadow: 0 0 0 10px rgba(5,150,105,0); }
            }
            .success-ring {
              animation: successRingScale 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both,
                         successRingPulse 1.8s ease-in-out 0.7s both;
            }
            .success-check {
              stroke-dasharray: 24;
              stroke-dashoffset: 24;
              animation: successCheckDraw 0.4s cubic-bezier(0.65,0,0.35,1) 0.45s forwards;
            }
          `}</style>
          <div className="success-ring w-14 h-14 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path className="success-check" d="M7.5 14.5L12 19L20.5 9.5" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-[20px] font-bold text-[#111] mb-1">決済が完了しました</h1>
          <p className="text-[13px] text-[#888] mb-6">ご注文ありがとうございます</p>

          {/* まだ終わりではありません */}
          <div className="rounded-xl bg-[#FFFBEB] border border-[#FDE68A] px-5 py-4 mb-6">
            <div className="flex items-center gap-2 justify-center mb-1.5">
              <i className="ri-error-warning-fill text-[16px] text-[#F59E0B]"></i>
              <p className="text-[15px] font-bold text-[#92400E]">まだ終わりではありません</p>
            </div>
            <p className="text-[13px] text-[#92400E] leading-relaxed">
              代行を開始するにはアカウントの共有が必要です。<br />
              チャット画面の手順に沿って進めてください。
            </p>
          </div>

          {/* 次に進むボタン */}
          <button onClick={handleNext}
            className="flex items-center justify-center gap-2 w-full py-3.5 text-[14px] font-bold bg-[#F59E0B] text-white rounded-xl hover:bg-[#D97706] transition-colors cursor-pointer">
            次に進む
            <i className="ri-arrow-right-line text-[16px]"></i>
          </button>
        </div>
      </div>
    </div>
  )
}
