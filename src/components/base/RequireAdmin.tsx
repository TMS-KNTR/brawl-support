import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function RequireAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return <div className="p-6">認証確認中...</div>;
  }

  if (String(userProfile.role) !== 'admin') {
    return <Navigate to="/dashboard/customer" replace />;
  }

  return <>{children}</>;
}