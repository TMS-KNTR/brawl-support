import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

type PaymentStatus = 'loading' | 'success' | 'pending' | 'awaiting_async' | 'error'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')
  const navigate = useNavigate()
  const { user } = useAuth()
  const [status, setStatus] = useState<PaymentStatus>('loading')
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [paymentDeadline, setPaymentDeadline] = useState<string | null>(null)
  const [chatThreadId, setChatThreadId] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      setStatus('error')
      return
    }
    if (!user) return // userロード待ち（loadingのまま）

    // まず注文を1回取得して、決済方法によって分岐
    const checkInitialStatus = async () => {
      try {
        const { data: order } = await supabase
          .from('orders')
          .select('id, status, payment_method, payment_deadline')
          .eq('id', orderId)
          .maybeSingle()

        if (!order) {
          setStatus('error')
          return
        }

        setPaymentMethod(order.payment_method ?? null)
        setPaymentDeadline(order.payment_deadline ?? null)

        // 既に paid 以降なら即座に success
        if (['paid', 'assigned', 'in_progress', 'completed', 'confirmed'].includes(order.status)) {
          setStatus('success')
          return
        }

        // pending_payment の場合、決済方法で分岐
        if (order.status === 'pending_payment') {
          if (order.payment_method === 'konbini' || order.payment_method === 'bank_transfer') {
            // 非同期決済: 入金待ち画面を即座に表示（ポーリングしない）
            setStatus('awaiting_async')
            return
          }
          // クレカ: webhook で更新されるまでポーリング
          startCreditCardPolling()
          return
        }

        // それ以外（payment_failed/cancelled等）
        setStatus('error')
      } catch {
        setStatus('error')
      }
    }

    const startCreditCardPolling = () => {
      let attempts = 0
      const maxAttempts = 15
      const poll = async () => {
        try {
          const { data } = await supabase
            .from('orders')
            .select('id, status')
            .eq('id', orderId)
            .in('status', ['paid', 'assigned', 'in_progress', 'completed', 'confirmed'])
            .maybeSingle()

          if (data) {
            setStatus('success')
            return
          }

          attempts++
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000)
          } else {
            setStatus('pending')
          }
        } catch {
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000)
          } else {
            setStatus('pending')
          }
        }
      }
      poll()
    }

    checkInitialStatus()
  }, [orderId, user])

  // order_id に対応する chat_thread_id を取得
  useEffect(() => {
    if (!user || status !== 'success' || !orderId) return
    const fetchChatThread = async () => {
      const { data, error } = await supabase
        .from('chat_threads')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle()
      if (!error && data?.id) setChatThreadId(data.id)
    }
    fetchChatThread()
  }, [user, status, orderId])

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

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5E5E5] p-7 text-center">
          <div className="w-14 h-14 rounded-full bg-[#FEF3C7] flex items-center justify-center mx-auto mb-4">
            <i className="ri-time-line text-[24px] text-[#F59E0B]"></i>
          </div>
          <h1 className="text-[18px] font-bold text-[#111] mb-2">決済を確認しています</h1>
          <p className="text-[13px] text-[#888] mb-6 leading-relaxed">
            決済処理に時間がかかっています。数分後にダッシュボードで注文状況をご確認ください。<br />
            決済が完了していない場合、注文は自動的にキャンセルされます。
          </p>
          <Link to="/dashboard/customer"
            className="inline-block px-6 py-2.5 text-[13px] font-bold bg-[#111] text-white rounded-xl hover:bg-[#333] transition-colors">
            ダッシュボードへ
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'awaiting_async') {
    const methodLabel = paymentMethod === 'konbini' ? 'コンビニ決済' : '銀行振込'
    const icon = paymentMethod === 'konbini' ? 'ri-store-2-line' : 'ri-bank-line'
    const deadlineStr = paymentDeadline
      ? new Date(paymentDeadline).toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : null

    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5E5E5] p-7">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-[#DBEAFE] flex items-center justify-center mx-auto mb-4">
              <i className={`${icon} text-[26px] text-[#2563EB]`}></i>
            </div>
            <h1 className="text-[20px] font-bold text-[#111] mb-1">{methodLabel}の手続きをお願いします</h1>
            <p className="text-[13px] text-[#888] mb-6">ご注文を受け付けました</p>
          </div>

          {/* 支払い手順 */}
          <div className="rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] px-5 py-4 mb-5">
            <p className="text-[14px] font-bold text-[#1E3A8A] mb-2 flex items-center gap-2">
              <i className="ri-mail-line text-[16px]"></i>
              お支払い手順
            </p>
            {paymentMethod === 'konbini' ? (
              <ol className="text-[12px] text-[#1E3A8A] leading-relaxed list-decimal list-inside space-y-1">
                <li>UnivaPayから支払い情報のメールが届きます</li>
                <li>メール記載のコンビニと支払い番号で期限内にお支払いください</li>
                <li>入金確認後、自動的に代行が開始されます</li>
              </ol>
            ) : (
              <ol className="text-[12px] text-[#1E3A8A] leading-relaxed list-decimal list-inside space-y-1">
                <li>UnivaPayから振込先口座情報のメールが届きます</li>
                <li>指定口座に期限内に指定金額をお振込みください</li>
                <li>入金確認後、自動的に代行が開始されます</li>
              </ol>
            )}
          </div>

          {/* 支払い期限 */}
          {deadlineStr && (
            <div className="rounded-xl bg-[#FFFBEB] border border-[#FDE68A] px-5 py-3 mb-5 text-center">
              <p className="text-[11px] text-[#92400E] font-medium mb-0.5">お支払い期限</p>
              <p className="text-[14px] font-bold text-[#92400E]">{deadlineStr}</p>
              <p className="text-[10px] text-[#B45309] mt-1">期限までにお支払いがない場合、注文は自動的にキャンセルされます</p>
            </div>
          )}

          {/* アクションボタン */}
          <Link to="/dashboard/customer"
            className="block w-full py-3.5 text-[13px] font-bold bg-[#111] text-white rounded-xl hover:bg-[#333] transition-colors text-center">
            ダッシュボードで確認
          </Link>

          <p className="text-[10px] text-[#94A3B8] text-center mt-3 leading-relaxed">
            入金確認後、通知でお知らせします<br />
            不明点がある場合はサポートまでお問い合わせください
          </p>
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
