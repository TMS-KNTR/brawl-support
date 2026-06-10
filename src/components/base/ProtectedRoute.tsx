import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { normalizeRole } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

type Props = {
  children: React.ReactNode;
  allowedRoles: Array<'customer' | 'employee' | 'admin'>;
  /**
   * 管理者ロールでAAL2（2段階認証完了）を必須にするか。
   * - true（デフォルト）: admin かつ MFA factor 登録済みなら AAL2 必須。未登録なら警告表示で通す。
   * - false: 2FA設定ページ自身など、AAL2必須にすると詰むページで指定。
   */
  requireAdminAAL2?: boolean;
};

type AalState =
  | { status: 'loading' }
  | { status: 'ok' }
  | { status: 'challenge' } // AAL1だがfactorありで昇格必要
  | { status: 'no-factor' } // adminだがMFA未設定（警告表示で通す）
  | { status: 'skip' }; // adminではない or 評価対象外

export default function ProtectedRoute({
  children,
  allowedRoles,
  requireAdminAAL2 = true,
}: Props) {
  const { user, userProfile, loading, profileStatus } = useAuth();
  const [aal, setAal] = useState<AalState>({ status: 'loading' });

  const role = userProfile ? normalizeRole(userProfile.role) : null;
  const needsAalCheck = !!user && role === 'admin' && requireAdminAAL2;

  useEffect(() => {
    let mounted = true;

    if (!needsAalCheck) {
      setAal({ status: 'skip' });
      return;
    }

    setAal({ status: 'loading' });
    (async () => {
      try {
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (!mounted) return;
        if (aalData?.currentLevel === 'aal2') {
          setAal({ status: 'ok' });
          return;
        }
        if (aalData?.nextLevel === 'aal2') {
          setAal({ status: 'challenge' });
          return;
        }
        setAal({ status: 'no-factor' });
      } catch {
        if (!mounted) return;
        // 取得失敗時は通す（factor評価できない場合に詰まないように）
        setAal({ status: 'no-factor' });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [needsAalCheck, user?.id]);

  // 認証ロード中
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        認証確認中...
      </div>
    );
  }

  // 未ログイン
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // プロファイル取得エラー
  if (profileStatus === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-500 gap-3">
        <p>プロファイルの取得に失敗しました</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
        >
          再読み込み
        </button>
      </div>
    );
  }

  // プロファイル未取得
  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        プロファイル取得中...
      </div>
    );
  }

  // role不正 or 権限なし
  if (!role || !allowedRoles.includes(role)) {
    console.warn('[ProtectedRoute] role blocked', { role, allowedRoles });
    return <Navigate to="/" replace />;
  }

  // 管理者のAAL2チェック
  if (needsAalCheck) {
    if (aal.status === 'loading') {
      return (
        <div className="flex items-center justify-center min-h-screen text-gray-500">
          認証レベル確認中...
        </div>
      );
    }
    if (aal.status === 'challenge') {
      return <Navigate to="/auth/mfa-challenge" replace />;
    }
    if (aal.status === 'no-factor') {
      return (
        <>
          <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium shadow-md">
            ⚠️ 管理者アカウントの2段階認証が未設定です。
            <a href="/dashboard/admin/security/2fa" className="underline ml-2 font-bold">
              今すぐ設定する →
            </a>
          </div>
          <div className="pt-10">{children}</div>
        </>
      );
    }
  }

  return <>{children}</>;
}