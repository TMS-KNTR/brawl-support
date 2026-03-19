import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

/** URLハッシュフラグメントからエラー情報をパース */
function parseHashError(): { code: string; description: string } | null {
  const hash = window.location.hash.substring(1);
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const error = params.get('error');
  if (!error) return null;
  return {
    code: params.get('error_code') || error,
    description: params.get('error_description')?.replace(/\+/g, ' ') || 'エラーが発生しました',
  };
}

const ERROR_MESSAGES: Record<string, string> = {
  otp_expired: 'リンクの有効期限が切れています。もう一度メールアドレス変更を行ってください。',
  access_denied: '認証が拒否されました。もう一度お試しください。',
};

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // まずハッシュのエラーをチェック
    const hashError = parseHashError();
    if (hashError) {
      console.error('[auth/callback] hash error:', hashError);
      const message = ERROR_MESSAGES[hashError.code] || hashError.description;
      setError(message);
      return;
    }

    let subscription: { unsubscribe: () => void } | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let handled = false;

    const done = (path: string) => {
      if (handled) return;
      handled = true;
      if (timeoutId) clearTimeout(timeoutId);
      subscription?.unsubscribe();
      navigate(path, { replace: true });
    };

    // URLにハッシュフラグメント（トークン）があるかチェック
    const hasHashTokens = window.location.hash.includes('access_token') ||
      window.location.hash.includes('token_hash') ||
      window.location.hash.includes('type=');

    // 先にonAuthStateChangeを設定してイベントを逃さないようにする
    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[auth/callback] onAuthStateChange', event);
      if (handled) return;

      // パスワードリセットコールバック
      if (event === 'PASSWORD_RECOVERY') {
        if (session) {
          done('/account');  // account ページでパスワード変更を促す
        }
        return;
      }

      // メール変更完了 or サインイン
      if (event === 'USER_UPDATED' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          done('/account');
        }
      }
    });
    subscription = sub;

    // リスナー設定後にセッションをチェック
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session && !hasHashTokens) {
          done('/account');
        }
      } catch {
        done('/login');
      }
    };

    checkSession();

    // 15秒待ってもイベントが来なければログインへ
    timeoutId = setTimeout(() => {
      if (!handled) {
        console.warn('[auth/callback] timeout - redirecting to login');
        done('/login');
      }
    }, 15000);

    return () => {
      handled = true;
      if (timeoutId) clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [navigate]);

  // エラー表示
  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-[#FEF2F2] flex items-center justify-center">
            <i className="ri-error-warning-line text-[20px] text-[#DC2626]"></i>
          </div>
          <p className="text-[15px] font-bold text-[#111] mb-2">認証エラー</p>
          <p className="text-[13px] text-[#666] leading-relaxed mb-6">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="px-5 py-2.5 text-[13px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors cursor-pointer"
          >
            ログインページに戻る
          </button>
        </div>
      </div>
    );
  }

  // ローディング
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-8 h-8 mx-auto mb-3">
          <div className="absolute inset-0 border-2 border-[#E5E5E5] rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-[#111] rounded-full animate-spin" />
        </div>
        <p className="text-[13px] text-[#888]">認証を確認しています...</p>
      </div>
    </div>
  );
}
