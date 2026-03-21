import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { normalizeRole } from '../../hooks/useAuth';

type Props = {
  children: React.ReactNode;
  allowedRoles: Array<'customer' | 'employee' | 'admin'>;
};

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, userProfile, loading, profileStatus } = useAuth();

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

  const role = normalizeRole(userProfile.role);

  // role不正 or 権限なし
  if (!role || !allowedRoles.includes(role)) {
    console.warn('[ProtectedRoute] role blocked', { role, allowedRoles });
    return <Navigate to="/" replace />;
  }

  // OK
  return <>{children}</>;
}