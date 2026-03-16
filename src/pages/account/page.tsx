import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import ProtectedRoute from '../../components/base/ProtectedRoute';

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Password
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwAttempts, setPwAttempts] = useState(0);
  const [pwLockedUntil, setPwLockedUntil] = useState<number | null>(null);

  // Email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emailAttempts, setEmailAttempts] = useState(0);
  const [emailLockedUntil, setEmailLockedUntil] = useState<number | null>(null);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteProcessing, setDeleteProcessing] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{ type: 'error'; text: string } | null>(null);

  const roleLabel =
    userProfile?.role === 'customer' || userProfile?.role === 'client'
      ? '依頼者'
      : userProfile?.role === 'employee' || userProfile?.role === 'worker'
        ? '代行者'
        : userProfile?.role === 'admin'
          ? '管理者'
          : '—';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSignOut = async () => {
    if (!window.confirm('ログアウトしますか？')) return;
    setIsSigningOut(true);
    await signOut();
    navigate('/');
  };

  // ── Password change ──
  const passwordChecks = [
    { test: (p: string) => p.length >= 8, label: '8文字以上' },
    { test: (p: string) => /[a-zA-Z]/.test(p), label: '英字を含む' },
    { test: (p: string) => /[0-9]/.test(p), label: '数字を含む' },
  ];
  const allChecksPassed = passwordChecks.every((c) => c.test(newPassword));

  const handleChangePassword = async () => {
    setPasswordMsg(null);
    if (!currentPassword) { setPasswordMsg({ type: 'error', text: '現在のパスワードを入力してください' }); return; }
    if (!allChecksPassed) { setPasswordMsg({ type: 'error', text: 'パスワード要件を満たしてください' }); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg({ type: 'error', text: 'パスワードが一致しません' }); return; }
    if (currentPassword === newPassword) { setPasswordMsg({ type: 'error', text: '現在と同じパスワードには変更できません' }); return; }

    // レート制限チェック
    if (pwLockedUntil && Date.now() < pwLockedUntil) {
      const remaining = Math.ceil((pwLockedUntil - Date.now()) / 1000);
      setPasswordMsg({ type: 'error', text: `試行回数が多すぎます。${remaining}秒後にお試しください` });
      return;
    }

    setPasswordSaving(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '', password: currentPassword,
      });
      if (signInError) {
        const next = pwAttempts + 1;
        setPwAttempts(next);
        if (next >= 3) {
          setPwLockedUntil(Date.now() + 60_000);
          setPwAttempts(0);
          setPasswordMsg({ type: 'error', text: '現在のパスワードが正しくありません。1分間ロックされます' });
        } else {
          setPasswordMsg({ type: 'error', text: `現在のパスワードが正しくありません（${next}/3）` });
        }
        return;
      }
      setPwAttempts(0);

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setShowPasswordModal(false);
      showToast('パスワードを変更しました');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'パスワードの変更に失敗しました' });
    } finally { setPasswordSaving(false); }
  };

  // ── Email change ──
  const handleChangeEmail = async () => {
    setEmailMsg(null);
    if (!newEmail) { setEmailMsg({ type: 'error', text: '新しいメールアドレスを入力してください' }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setEmailMsg({ type: 'error', text: '有効なメールアドレスを入力してください' }); return; }
    if (newEmail === user?.email) { setEmailMsg({ type: 'error', text: '現在と同じメールアドレスです' }); return; }
    if (!emailPassword) { setEmailMsg({ type: 'error', text: 'パスワードを入力してください' }); return; }

    // レート制限チェック
    if (emailLockedUntil && Date.now() < emailLockedUntil) {
      const remaining = Math.ceil((emailLockedUntil - Date.now()) / 1000);
      setEmailMsg({ type: 'error', text: `試行回数が多すぎます。${remaining}秒後にお試しください` });
      return;
    }

    setEmailSaving(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '', password: emailPassword,
      });
      if (signInError) {
        const next = emailAttempts + 1;
        setEmailAttempts(next);
        if (next >= 3) {
          setEmailLockedUntil(Date.now() + 60_000);
          setEmailAttempts(0);
          setEmailMsg({ type: 'error', text: 'パスワードが正しくありません。1分間ロックされます' });
        } else {
          setEmailMsg({ type: 'error', text: `パスワードが正しくありません（${next}/3）` });
        }
        return;
      }
      setEmailAttempts(0);

      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: `${window.location.origin}/auth/callback` }
      );
      if (error) throw error;

      // 旧アドレスに通知（Edge Function経由）
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.functions.invoke('create-notification', {
          body: {
            user_id: user?.id,
            type: 'security',
            title: 'メールアドレス変更リクエスト',
            body: `新しいメールアドレス（${newEmail.slice(0, 3)}***）への変更がリクエストされました。心当たりがない場合はサポートに連絡してください。`,
          },
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
      } catch { /* 通知失敗は変更自体をブロックしない */ }

      setNewEmail(''); setEmailPassword('');
      setShowEmailModal(false);
      showToast('確認メールを送信しました。現在のメールアドレスに届いたリンクをクリックして変更を完了してください。');
    } catch (err: any) {
      setEmailMsg({ type: 'error', text: err.message || 'メールアドレスの変更に失敗しました' });
    } finally { setEmailSaving(false); }
  };

  // ── Delete account ──
  const handleDeleteAccount = async () => {
    setDeleteMsg(null);
    if (!deletePassword) { setDeleteMsg({ type: 'error', text: 'パスワードを入力してください' }); return; }
    if (deleteConfirmText !== '退会する') { setDeleteMsg({ type: 'error', text: '「退会する」と入力してください' }); return; }

    setDeleteProcessing(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '', password: deletePassword,
      });
      if (signInError) { setDeleteMsg({ type: 'error', text: 'パスワードが正しくありません' }); return; }

      // Edge Functionで注文キャンセル・データ匿名化・auth user削除を実行
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error && !res.data) throw new Error(res.error.message);
      if (!res.data?.success) throw new Error(res.data?.error || 'アカウント削除に失敗しました');

      await signOut();
      navigate('/');
    } catch (err: any) {
      setDeleteMsg({ type: 'error', text: err.message || 'アカウント削除に失敗しました' });
    } finally { setDeleteProcessing(false); }
  };

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <ProtectedRoute allowedRoles={['customer', 'client', 'employee', 'worker', 'admin']}>
      <div className="min-h-screen bg-[#FAFAFA]">
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translate(-50%, 12px); }
            to   { opacity: 1; transform: translate(-50%, 0); }
          }
        `}</style>
        <Header />

        <section className="pt-[72px] border-b border-[#E5E5E5] bg-white">
          <div className="max-w-3xl mx-auto px-6 pt-5 pb-6">
            <h1 className="text-[22px] font-bold text-[#111] tracking-tight">アカウント</h1>
            <p className="text-[13px] text-[#888] mt-1">アカウント情報の確認と設定</p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
          {/* Profile info */}
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-5">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center shrink-0">
                <i className="ri-user-3-fill text-[20px] text-[#999]"></i>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-[#111] truncate">{user?.email || '—'}</p>
                <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F5F5] text-[#666]">
                  {roleLabel}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#F0F0F0]">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#888]">メールアドレス</span>
                <span className="text-[12px] font-medium text-[#111]">{user?.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#888]">ロール</span>
                <span className="text-[12px] font-medium text-[#111]">{roleLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#888]">登録日</span>
                <span className="text-[12px] font-medium text-[#111]">{createdAt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#888]">ユーザーID</span>
                <span className="text-[11px] font-mono text-[#999] truncate ml-4 max-w-[180px]">{user?.id || '—'}</span>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-5">
            <p className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-1">セキュリティ</p>
            <button onClick={() => { setShowEmailModal(true); setEmailMsg(null); setNewEmail(''); setEmailPassword(''); }}
              className="w-full flex items-center justify-between py-2.5 text-[13px] text-[#111] hover:bg-[#FAFAFA] -mx-2 px-2 rounded-lg transition-colors cursor-pointer">
              <span className="flex items-center gap-2.5">
                <i className="ri-mail-line text-[15px] text-[#999]"></i>
                メールアドレスを変更
              </span>
              <i className="ri-arrow-right-s-line text-[16px] text-[#CCC]"></i>
            </button>
            <button onClick={() => { setShowPasswordModal(true); setPasswordMsg(null); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
              className="w-full flex items-center justify-between py-2.5 text-[13px] text-[#111] hover:bg-[#FAFAFA] -mx-2 px-2 rounded-lg transition-colors cursor-pointer">
              <span className="flex items-center gap-2.5">
                <i className="ri-lock-line text-[15px] text-[#999]"></i>
                パスワードを変更
              </span>
              <i className="ri-arrow-right-s-line text-[16px] text-[#CCC]"></i>
            </button>
          </div>

          {/* Logout */}
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-5">
            <button onClick={handleSignOut} disabled={isSigningOut}
              className="w-full flex items-center gap-2.5 py-2.5 text-[13px] text-[#111] hover:bg-[#FAFAFA] -mx-2 px-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
              <i className="ri-logout-box-r-line text-[15px] text-[#999]"></i>
              {isSigningOut ? 'ログアウト中...' : 'ログアウト'}
            </button>
          </div>

          {/* Delete account */}
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-5">
            <p className="text-[11px] font-semibold text-[#999] uppercase tracking-wider mb-1">退会</p>
            <button onClick={() => { setShowDeleteModal(true); setDeleteMsg(null); setDeletePassword(''); setDeleteConfirmText(''); }}
              className="w-full flex items-center gap-2.5 py-2.5 text-[13px] text-[#DC2626] hover:bg-[#FEF2F2] -mx-2 px-2 rounded-lg transition-colors cursor-pointer">
              <i className="ri-delete-bin-line text-[15px]"></i>
              アカウントを削除する
            </button>
            <p className="text-[10px] text-[#BBB] mt-1 ml-0.5">アカウントを削除すると、すべてのデータが失われます。この操作は取り消せません。</p>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm px-5 py-3 bg-[#111] text-white text-[13px] font-medium rounded-lg shadow-lg flex items-center gap-2 animate-[fadeUp_0.3s_ease]">
            <i className="ri-check-line text-[#059669] text-[14px] shrink-0"></i>
            {toast}
          </div>
        )}

        {/* ═══ Password Modal ═══ */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="relative bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-[#F0F0F0]">
                <h2 className="text-[15px] font-bold text-[#111]">パスワードを変更</h2>
                <p className="text-[11px] text-[#999] mt-0.5">新しいパスワードを入力してください</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1.5">現在のパスワード</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border border-[#E5E5E5] rounded-lg p-3 text-[13px] text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors"
                    placeholder="現在のパスワード" autoComplete="current-password" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1.5">新しいパスワード</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-[#E5E5E5] rounded-lg p-3 text-[13px] text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors"
                    placeholder="8文字以上・英字+数字" autoComplete="new-password" />
                  {newPassword && (
                    <div className="flex gap-3 mt-2">
                      {passwordChecks.map((c) => (
                        <span key={c.label} className={`text-[10px] font-medium flex items-center gap-1 ${c.test(newPassword) ? 'text-[#059669]' : 'text-[#CCC]'}`}>
                          <i className={`${c.test(newPassword) ? 'ri-check-line' : 'ri-close-line'} text-[10px]`}></i>
                          {c.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1.5">新しいパスワード（確認）</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-[#E5E5E5] rounded-lg p-3 text-[13px] text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors"
                    placeholder="もう一度入力" autoComplete="new-password" />
                </div>
                {passwordMsg && (
                  <p className={`text-[12px] font-medium ${passwordMsg.type === 'success' ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                    {passwordMsg.text}
                  </p>
                )}
                <div className="flex justify-end gap-2.5 pt-1">
                  <button onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-[12px] font-semibold text-[#666] rounded-lg hover:bg-[#F5F5F5] transition-colors cursor-pointer">
                    キャンセル
                  </button>
                  <button onClick={handleChangePassword} disabled={passwordSaving || !currentPassword || !allChecksPassed || !confirmPassword}
                    className="px-4 py-2 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                    {passwordSaving ? '変更中...' : '変更する'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Email Modal ═══ */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowEmailModal(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="relative bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-[#F0F0F0]">
                <h2 className="text-[15px] font-bold text-[#111]">メールアドレスを変更</h2>
                <p className="text-[11px] text-[#999] mt-0.5">確認メールが新しいアドレスに送信されます</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1.5">現在のメールアドレス</label>
                  <input type="email" value={user?.email || ''} disabled
                    className="w-full border border-[#E5E5E5] rounded-lg p-3 text-[13px] text-[#999] bg-[#FAFAFA]" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1.5">新しいメールアドレス</label>
                  <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full border border-[#E5E5E5] rounded-lg p-3 text-[13px] text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors"
                    placeholder="new@example.com" autoComplete="email" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1.5">パスワード（本人確認）</label>
                  <input type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)}
                    className="w-full border border-[#E5E5E5] rounded-lg p-3 text-[13px] text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111] transition-colors"
                    placeholder="現在のパスワード" autoComplete="current-password" />
                </div>
                {emailMsg && (
                  <p className={`text-[12px] font-medium ${emailMsg.type === 'success' ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                    {emailMsg.text}
                  </p>
                )}
                <div className="flex justify-end gap-2.5 pt-1">
                  <button onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 text-[12px] font-semibold text-[#666] rounded-lg hover:bg-[#F5F5F5] transition-colors cursor-pointer">
                    キャンセル
                  </button>
                  <button onClick={handleChangeEmail} disabled={emailSaving || !newEmail || !emailPassword}
                    className="px-4 py-2 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                    {emailSaving ? '送信中...' : '変更する'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Delete Account Modal ═══ */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="relative bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-[#FCA5A5]/30 bg-[#FEF2F2]">
                <h2 className="text-[15px] font-bold text-[#DC2626]">アカウントを削除</h2>
                <p className="text-[11px] text-[#DC2626]/60 mt-0.5">この操作は取り消せません</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5]/20">
                  <p className="text-[12px] text-[#DC2626] leading-relaxed">
                    アカウントを削除すると、以下のデータが失われます：
                  </p>
                  <ul className="mt-2 space-y-1">
                    <li className="text-[11px] text-[#DC2626]/80 flex items-center gap-1.5">
                      <i className="ri-close-circle-line text-[11px]"></i>注文履歴・チャット履歴
                    </li>
                    <li className="text-[11px] text-[#DC2626]/80 flex items-center gap-1.5">
                      <i className="ri-close-circle-line text-[11px]"></i>アカウント情報・評価
                    </li>
                    <li className="text-[11px] text-[#DC2626]/80 flex items-center gap-1.5">
                      <i className="ri-close-circle-line text-[11px]"></i>進行中の注文がある場合はキャンセルされます
                    </li>
                  </ul>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1.5">パスワード（本人確認）</label>
                  <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full border border-[#E5E5E5] rounded-lg p-3 text-[13px] text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]/10 focus:border-[#DC2626] transition-colors"
                    placeholder="現在のパスワード" autoComplete="current-password" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1.5">
                    確認のため「<span className="text-[#DC2626]">退会する</span>」と入力してください
                  </label>
                  <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full border border-[#E5E5E5] rounded-lg p-3 text-[13px] text-[#111] bg-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]/10 focus:border-[#DC2626] transition-colors"
                    placeholder="退会する" />
                </div>
                {deleteMsg && (
                  <p className="text-[12px] font-medium text-[#DC2626]">{deleteMsg.text}</p>
                )}
                <div className="flex justify-end gap-2.5 pt-1">
                  <button onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-[12px] font-semibold text-[#666] rounded-lg hover:bg-[#F5F5F5] transition-colors cursor-pointer">
                    キャンセル
                  </button>
                  <button onClick={handleDeleteAccount}
                    disabled={deleteProcessing || !deletePassword || deleteConfirmText !== '退会する'}
                    className="px-4 py-2 text-[12px] font-semibold bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                    {deleteProcessing ? '処理中...' : 'アカウントを削除'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
