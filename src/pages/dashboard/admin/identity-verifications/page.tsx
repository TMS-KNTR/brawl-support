import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';

type Verification = {
  id: string;
  employee_id: string;
  document_type: string;
  document_images: string[];
  full_name_kana: string;
  full_name_kanji: string;
  date_of_birth: string;
  address: string;
  agreement_accepted_at: string;
  status: 'pending_review' | 'approved' | 'rejected';
  rejected_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  drivers_license: '運転免許証',
  mynumber_card: 'マイナンバーカード',
  passport: 'パスポート',
  residence_card: '在留カード',
};

const REJECTED_REASONS = [
  '画像が不鮮明',
  '氏名が一致しない',
  '有効期限切れ',
  '裏面画像の提出はお控えください',
  'その他',
];

const STATUS_TABS = [
  { key: 'pending_review' as const, label: '審査待ち' },
  { key: 'approved' as const, label: '承認済み' },
  { key: 'rejected' as const, label: '差戻し' },
];

export default function AdminIdentityVerificationsPage() {
  const [tab, setTab] = useState<'pending_review' | 'approved' | 'rejected'>('pending_review');
  const [list, setList] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Verification | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('status', tab)
      .order('created_at', { ascending: false });
    setList((data as Verification[]) ?? []);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 max-w-5xl mx-auto w-full px-4 pt-28 pb-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">本人確認審査</h1>
              <p className="text-sm text-gray-600">代行者の本人確認提出を審査します</p>
            </div>
            <Link to="/dashboard/admin" className="text-sm text-gray-600 hover:text-gray-900">← ダッシュボード</Link>
          </div>

          {/* タブ */}
          <div className="flex gap-2 mb-4">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  tab === t.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 一覧 */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-sm text-gray-500">読み込み中...</p>
            </div>
          ) : list.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-sm text-gray-500">該当する本人確認はありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelected(v)}
                  className="w-full text-left bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {v.full_name_kanji}（{v.full_name_kana}）
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {DOCUMENT_TYPE_LABELS[v.document_type] ?? v.document_type} ・ {Array.isArray(v.document_images) ? v.document_images.length : 0}枚 ・ 提出 {new Date(v.created_at).toLocaleString('ja-JP')}
                      </p>
                      {v.status === 'rejected' && v.rejected_reason && (
                        <p className="text-xs text-red-600 mt-1">差戻し理由: {v.rejected_reason}</p>
                      )}
                    </div>
                    <span className={`shrink-0 px-2 py-1 text-xs font-semibold rounded ${
                      v.status === 'pending_review' ? 'bg-amber-100 text-amber-800'
                      : v.status === 'approved' ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                    }`}>
                      {v.status === 'pending_review' ? '審査待ち' : v.status === 'approved' ? '承認済み' : '差戻し'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <Footer />

        {selected && (
          <DetailModal
            verification={selected}
            onClose={() => setSelected(null)}
            onReviewed={() => {
              setSelected(null);
              fetchList();
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

function DetailModal({
  verification,
  onClose,
  onReviewed,
}: {
  verification: Verification;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});
  const [imageError, setImageError] = useState<Record<number, string>>({});
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectedReason, setRejectedReason] = useState<string>(REJECTED_REASONS[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  async function loadImageUrl(idx: number) {
    if (imageUrls[idx] || imageLoading[idx]) return;
    setImageLoading((prev) => ({ ...prev, [idx]: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('get-identity-document-url', {
        body: { verification_id: verification.id, document_index: idx },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.data?.success && res.data.signed_url) {
        setImageUrls((prev) => ({ ...prev, [idx]: res.data.signed_url }));
      } else {
        setImageError((prev) => ({ ...prev, [idx]: res.data?.error || '画像の取得に失敗しました' }));
      }
    } catch (err) {
      console.error('loadImageUrl error:', err);
      setImageError((prev) => ({ ...prev, [idx]: '画像の取得に失敗しました' }));
    } finally {
      setImageLoading((prev) => ({ ...prev, [idx]: false }));
    }
  }

  useEffect(() => {
    const images = Array.isArray(verification.document_images) ? verification.document_images : [];
    images.forEach((_, idx) => loadImageUrl(idx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verification.id]);

  async function handleReview() {
    if (!action || submitting) return;
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('review-identity-verification', {
        body: {
          verification_id: verification.id,
          action,
          ...(action === 'reject' ? { rejected_reason: rejectedReason } : {}),
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error || !res.data?.success) {
        alert(res.data?.error || '審査結果の送信に失敗しました');
        return;
      }
      alert(action === 'approve' ? '承認しました' : '差戻しました');
      onReviewed();
    } finally {
      setSubmitting(false);
    }
  }

  const images = Array.isArray(verification.document_images) ? verification.document_images : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">本人確認の審査</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {DOCUMENT_TYPE_LABELS[verification.document_type] ?? verification.document_type} ・ 提出 {new Date(verification.created_at).toLocaleString('ja-JP')}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <i className="ri-close-line text-lg text-gray-500"></i>
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {/* 画像 */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">提出画像（{images.length}枚）</p>
            <div className="grid grid-cols-2 gap-3">
              {images.map((_, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  {imageLoading[idx] && (
                    <div className="h-48 flex items-center justify-center text-xs text-gray-500">読み込み中...</div>
                  )}
                  {imageError[idx] && (
                    <div className="h-48 flex items-center justify-center text-xs text-red-600 px-2 text-center">{imageError[idx]}</div>
                  )}
                  {imageUrls[idx] && (
                    <a href={imageUrls[idx]} target="_blank" rel="noopener noreferrer">
                      <img src={imageUrls[idx]} alt={`document ${idx + 1}`} className="w-full h-48 object-contain bg-white" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* フォーム情報 */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <p className="font-semibold text-gray-700 mb-2">申告内容</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <p className="text-gray-500">氏名（漢字）</p>
              <p className="text-gray-900">{verification.full_name_kanji}</p>
              <p className="text-gray-500">氏名（カナ）</p>
              <p className="text-gray-900">{verification.full_name_kana}</p>
              <p className="text-gray-500">生年月日</p>
              <p className="text-gray-900">{verification.date_of_birth}</p>
              <p className="text-gray-500">住所</p>
              <p className="text-gray-900">{verification.address}</p>
              <p className="text-gray-500">契約同意日時</p>
              <p className="text-gray-900">{new Date(verification.agreement_accepted_at).toLocaleString('ja-JP')}</p>
            </div>
          </div>

          {/* 既に審査済の場合の情報 */}
          {verification.status !== 'pending_review' && (
            <div className={`rounded-lg p-4 text-sm ${
              verification.status === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`font-semibold ${verification.status === 'approved' ? 'text-green-800' : 'text-red-800'}`}>
                {verification.status === 'approved' ? '承認済み' : '差戻し済み'}
              </p>
              {verification.reviewed_at && (
                <p className="text-xs text-gray-600 mt-1">審査日時: {new Date(verification.reviewed_at).toLocaleString('ja-JP')}</p>
              )}
              {verification.rejected_reason && (
                <p className="text-xs text-red-700 mt-1">差戻し理由: {verification.rejected_reason}</p>
              )}
            </div>
          )}

          {/* 審査アクション */}
          {verification.status === 'pending_review' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">審査</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setAction('approve')}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                    action === 'approve' ? 'bg-green-600 text-white' : 'bg-white border border-green-600 text-green-700 hover:bg-green-50'
                  }`}
                >
                  承認する
                </button>
                <button
                  onClick={() => setAction('reject')}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                    action === 'reject' ? 'bg-red-600 text-white' : 'bg-white border border-red-600 text-red-700 hover:bg-red-50'
                  }`}
                >
                  差戻す
                </button>
              </div>

              {action === 'reject' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">差戻し理由</label>
                  <select
                    value={rejectedReason}
                    onChange={(e) => setRejectedReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  >
                    {REJECTED_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {verification.status === 'pending_review' && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-40"
            >
              キャンセル
            </button>
            <button
              onClick={handleReview}
              disabled={!action || submitting}
              className="px-5 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? '送信中...' : action === 'approve' ? '承認を確定' : action === 'reject' ? '差戻しを確定' : '審査を確定'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
