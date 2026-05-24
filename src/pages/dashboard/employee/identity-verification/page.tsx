import { useState, useEffect } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { supabase } from '../../../../lib/supabase';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';

type DocumentType = 'drivers_license' | 'mynumber_card' | 'passport' | 'residence_card';

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  drivers_license: '運転免許証（表 + 裏）',
  mynumber_card: 'マイナンバーカード（表のみ。裏面は撮影禁止）',
  passport: 'パスポート（顔写真ページ + 所持人記入欄）',
  residence_card: '在留カード（表 + 裏）',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];

export default function IdentityVerificationPage() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <p className="text-[12px] text-[#999]">読み込み中...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const role = userProfile?.role;
  if (role !== 'employee' && role !== 'admin' && role !== 'worker') {
    return <Navigate to="/" replace />;
  }

  return (
    <ProtectedRoute allowedRoles={['employee', 'admin']}>
      <Content />
    </ProtectedRoute>
  );
}

function Content() {
  const { user, userProfile, fetchUserProfile } = useAuth();
  const navigate = useNavigate();

  const status = userProfile?.identity_verification_status ?? 'unsubmitted';

  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState<DocumentType | ''>('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([]);
  const [fullNameKana, setFullNameKana] = useState('');
  const [fullNameKanji, setFullNameKanji] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latestRejectedReason, setLatestRejectedReason] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'rejected' && user?.id) {
      supabase
        .from('identity_verifications')
        .select('rejected_reason')
        .eq('employee_id', user.id)
        .eq('status', 'rejected')
        .order('reviewed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.rejected_reason) setLatestRejectedReason(data.rejected_reason);
        });
    }
  }, [status, user?.id]);

  if (status === 'approved') {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Header />
        <div className="max-w-2xl mx-auto px-6 pt-28 pb-16">
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 text-center">
            <i className="ri-shield-check-line text-4xl text-[#059669] mb-3 block"></i>
            <h1 className="text-[18px] font-bold text-[#111] mb-2">本人確認が完了しています</h1>
            <p className="text-[13px] text-[#666] mb-6">案件の受注が可能です。</p>
            <button
              onClick={() => navigate('/dashboard/employee')}
              className="px-5 py-2.5 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (status === 'pending_review') {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Header />
        <div className="max-w-2xl mx-auto px-6 pt-28 pb-16">
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-8 text-center">
            <i className="ri-time-line text-4xl text-[#D97706] mb-3 block"></i>
            <h1 className="text-[18px] font-bold text-[#111] mb-2">本人確認を審査中です</h1>
            <p className="text-[13px] text-[#666] mb-6">通常1〜3営業日で審査結果をお知らせします。</p>
            <button
              onClick={() => navigate('/dashboard/employee')}
              className="px-5 py-2.5 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  async function handleFilesSelect(selected: FileList | null) {
    if (!selected) return;
    setErrorMessage(null);
    const list: File[] = [];
    for (let i = 0; i < selected.length; i++) {
      const f = selected[i];
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setErrorMessage(`${f.name}: 対応していない形式です（JPG/PNG/HEICのみ）`);
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setErrorMessage(`${f.name}: ファイルサイズが5MBを超えています`);
        return;
      }
      list.push(f);
    }
    setFiles([...files, ...list].slice(0, 4));
  }

  function removeFile(idx: number) {
    setFiles(files.filter((_, i) => i !== idx));
  }

  async function uploadFilesToStorage(): Promise<string[]> {
    if (!user?.id) throw new Error('未ログイン');
    const paths: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;
      const { error } = await supabase
        .storage
        .from('identity-documents')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        console.error('upload error:', error);
        throw new Error('画像のアップロードに失敗しました');
      }
      paths.push(path);
    }
    return paths;
  }

  async function handleSubmit() {
    if (submitting) return;
    setErrorMessage(null);
    setSubmitting(true);
    try {
      const paths = uploadedPaths.length > 0 ? uploadedPaths : await uploadFilesToStorage();
      if (uploadedPaths.length === 0) setUploadedPaths(paths);

      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('submit-identity-verification', {
        body: {
          document_type: documentType,
          document_image_paths: paths,
          full_name_kana: fullNameKana,
          full_name_kanji: fullNameKanji,
          date_of_birth: dateOfBirth,
          address,
          agreement_accepted: agreementAccepted,
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (res.error || !res.data?.success) {
        const errMsg = res.data?.error || '提出に失敗しました';
        setErrorMessage(errMsg);
        return;
      }

      if (user?.id) await fetchUserProfile(user.id);
      alert('本人確認の提出が完了しました。審査結果は通知でお知らせします。');
      navigate('/dashboard/employee');
    } catch (err: any) {
      console.error('submit error:', err);
      setErrorMessage(err?.message || '提出に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  const canGoStep2 = !!documentType;
  const canGoStep3 = files.length > 0;
  const canGoStep4 = !!fullNameKana && !!fullNameKanji && !!dateOfBirth && !!address;
  const canSubmit = agreementAccepted && canGoStep2 && canGoStep3 && canGoStep4;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header />

      <div className="max-w-2xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-6">
          <h1 className="text-[20px] font-bold text-[#111]">本人確認の提出</h1>
          <p className="text-[12px] text-[#888] mt-1">案件を受注するには本人確認が必要です。</p>
        </div>

        {status === 'rejected' && latestRejectedReason && (
          <div className="mb-6 px-4 py-3 rounded-lg border border-[#FCA5A5]/40 bg-[#FEF2F2]">
            <p className="text-[12px] font-semibold text-[#991B1B]">前回の提出が差戻されました</p>
            <p className="text-[12px] text-[#7F1D1D] mt-1">理由: {latestRejectedReason}</p>
            <p className="text-[12px] text-[#7F1D1D] mt-1">再提出をお願いします。</p>
          </div>
        )}

        {/* ステップインジケータ */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step >= n ? 'bg-[#111] text-white' : 'bg-[#E5E5E5] text-[#999]'
                }`}
              >
                {n}
              </div>
              {n < 4 && <div className={`flex-1 h-0.5 ${step > n ? 'bg-[#111]' : 'bg-[#E5E5E5]'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
          {step === 1 && (
            <>
              <h2 className="text-[14px] font-bold text-[#111] mb-4">ステップ1: 身分証の種類を選択</h2>
              <div className="space-y-2">
                {(Object.keys(DOCUMENT_LABELS) as DocumentType[]).map((t) => (
                  <label
                    key={t}
                    className={`flex items-start gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                      documentType === t
                        ? 'border-[#111] bg-[#FAFAFA]'
                        : 'border-[#E5E5E5] hover:border-[#CCC]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="documentType"
                      value={t}
                      checked={documentType === t}
                      onChange={() => setDocumentType(t)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-[13px] font-semibold text-[#111]">{DOCUMENT_LABELS[t]}</p>
                    </div>
                  </label>
                ))}
              </div>
              {documentType === 'mynumber_card' && (
                <div className="mt-4 px-3.5 py-2.5 rounded-lg border border-[#FCD34D]/40 bg-[#FFFBEB]">
                  <p className="text-[12px] font-semibold text-[#92400E]">マイナンバーカードの裏面（個人番号）は絶対に撮影しないでください</p>
                  <p className="text-[11px] text-[#A16207] mt-1">表面のみアップロードしてください。裏面が含まれていた場合、差戻しとなります。</p>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-[14px] font-bold text-[#111] mb-4">ステップ2: 身分証画像のアップロード</h2>
              <p className="text-[12px] text-[#888] mb-3">JPG / PNG / HEIC、各5MB以下、最大4枚まで</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/heic,image/heif"
                multiple
                onChange={(e) => handleFilesSelect(e.target.files)}
                className="block w-full text-[12px] text-[#666] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-[#111] file:text-white hover:file:bg-[#333] file:cursor-pointer cursor-pointer"
              />
              {files.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {files.map((f, idx) => (
                    <div key={idx} className="relative border border-[#E5E5E5] rounded-lg overflow-hidden">
                      <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-32 object-cover" />
                      <button
                        onClick={() => removeFile(idx)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-[12px] flex items-center justify-center hover:bg-black/80"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                      <p className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/50 text-white text-[10px] truncate">
                        {f.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-[14px] font-bold text-[#111] mb-4">ステップ3: 本人情報の入力</h2>
              <p className="text-[12px] text-[#888] mb-4">身分証に記載されている情報を正確に入力してください。</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1">氏名（カナ）</label>
                  <input
                    type="text"
                    value={fullNameKana}
                    onChange={(e) => setFullNameKana(e.target.value)}
                    placeholder="例: ヤマダ タロウ"
                    className="w-full border border-[#E5E5E5] rounded-lg p-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1">氏名（漢字）</label>
                  <input
                    type="text"
                    value={fullNameKanji}
                    onChange={(e) => setFullNameKanji(e.target.value)}
                    placeholder="例: 山田 太郎"
                    className="w-full border border-[#E5E5E5] rounded-lg p-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1">生年月日</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    className="w-full border border-[#E5E5E5] rounded-lg p-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#666] mb-1">住所</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="例: 東京都渋谷区〇〇1-2-3"
                    className="w-full border border-[#E5E5E5] rounded-lg p-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#111]/10 focus:border-[#111]"
                  />
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-[14px] font-bold text-[#111] mb-4">ステップ4: 業務委託契約への同意</h2>
              <p className="text-[12px] text-[#888] mb-3">
                提出には業務委託契約への同意が必要です。下記リンクから契約書全文をご確認ください。
              </p>
              <Link
                to="/legal/contractor-agreement"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-[#111] border border-[#E5E5E5] rounded-lg hover:bg-[#FAFAFA] transition-colors mb-4"
              >
                <i className="ri-file-text-line"></i>
                業務委託契約書を読む（新しいタブ）
              </Link>

              <label className="flex items-start gap-3 px-4 py-3 border border-[#E5E5E5] rounded-lg cursor-pointer hover:bg-[#FAFAFA] mb-4">
                <input
                  type="checkbox"
                  checked={agreementAccepted}
                  onChange={(e) => setAgreementAccepted(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-[12px] text-[#333]">業務委託契約書の内容を確認し、同意します。</span>
              </label>

              <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-4 space-y-2 text-[12px] text-[#555]">
                <p className="font-semibold text-[#111]">提出内容の確認</p>
                <p>身分証: <span className="text-[#111]">{documentType ? DOCUMENT_LABELS[documentType] : '—'}</span></p>
                <p>画像: <span className="text-[#111]">{files.length}枚</span></p>
                <p>氏名（カナ）: <span className="text-[#111]">{fullNameKana || '—'}</span></p>
                <p>氏名（漢字）: <span className="text-[#111]">{fullNameKanji || '—'}</span></p>
                <p>生年月日: <span className="text-[#111]">{dateOfBirth || '—'}</span></p>
                <p>住所: <span className="text-[#111]">{address || '—'}</span></p>
              </div>
            </>
          )}

          {errorMessage && (
            <p className="text-[12px] text-[#DC2626] mt-4">{errorMessage}</p>
          )}

          <div className="flex justify-between gap-3 mt-6 pt-6 border-t border-[#F0F0F0]">
            <button
              onClick={() => (step === 1 ? navigate('/dashboard/employee') : setStep(step - 1))}
              disabled={submitting}
              className="px-4 py-2 text-[12px] font-semibold text-[#666] rounded-lg hover:bg-[#F5F5F5] transition-colors disabled:opacity-40"
            >
              {step === 1 ? 'キャンセル' : '戻る'}
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !canGoStep2) ||
                  (step === 2 && !canGoStep3) ||
                  (step === 3 && !canGoStep4)
                }
                className="px-5 py-2 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                次へ
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="px-5 py-2 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? '送信中...' : '提出する'}
              </button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
