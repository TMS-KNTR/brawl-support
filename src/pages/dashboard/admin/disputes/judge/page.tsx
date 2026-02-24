import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../../../lib/supabase';
import RequireAdmin from '../../../../../components/base/RequireAdmin';

type Dispute = {
  id: string;
  order_id: string;
  status: string;
  reason: string | null;
  description: string | null;
  customer_id: string;
  employee_id: string;
  admin_assigned: string | null;
  evidence_urls: any;
  created_at: string;
};

export default function AdminDisputeJudgePage() {
  const { disputeId } = useParams();
  const navigate = useNavigate();

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('disputes')
      .select('*')
      .eq('id', disputeId)
      .single();

    if (!error) setDispute(data as Dispute);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [disputeId]);

  // ===== 裁定アクション =====

  const resolveForCustomer = async () => {
    if (!dispute) return;
    if (!confirm('依頼者側勝訴（返金・キャンセル）を実行しますか？')) return;

    setActionLoading(true);

    await supabase.from('orders').update({
      status: 'cancelled',
    }).eq('id', dispute.order_id);

    await supabase.from('disputes').update({
      status: 'resolved_customer',
    }).eq('id', dispute.id);

    setActionLoading(false);
    alert('依頼者勝訴として裁定完了');
    navigate('/dashboard/admin/disputes');
  };

  const resolveForEmployee = async () => {
    if (!dispute) return;
    if (!confirm('従業員側勝訴（強制完了）を実行しますか？')) return;

    setActionLoading(true);

    await supabase.from('orders').update({
      status: 'completed',
    }).eq('id', dispute.order_id);

    await supabase.from('disputes').update({
      status: 'resolved_employee',
    }).eq('id', dispute.id);

    setActionLoading(false);
    alert('従業員勝訴として裁定完了');
    navigate('/dashboard/admin/disputes');
  };

  const forceCancel = async () => {
    if (!dispute) return;
    if (!confirm('強制キャンセル（中立裁定）を実行しますか？')) return;

    setActionLoading(true);

    await supabase.from('orders').update({
      status: 'cancelled',
    }).eq('id', dispute.order_id);

    await supabase.from('disputes').update({
      status: 'neutral_cancel',
    }).eq('id', dispute.id);

    setActionLoading(false);
    alert('中立キャンセル裁定完了');
    navigate('/dashboard/admin/disputes');
  };

  const banCustomer = async () => {
    if (!dispute) return;
    if (!confirm('依頼者をBANしますか？')) return;

    await supabase.from('profiles').update({
      is_banned: true,
      ban_reason: 'dispute abuse',
      banned_at: new Date().toISOString(),
    }).eq('id', dispute.customer_id);

    alert('依頼者BAN完了');
  };

  const banEmployee = async () => {
    if (!dispute) return;
    if (!confirm('従業員をBANしますか？')) return;

    await supabase.from('profiles').update({
      is_banned: true,
      ban_reason: 'dispute abuse',
      banned_at: new Date().toISOString(),
    }).eq('id', dispute.employee_id);

    alert('従業員BAN完了');
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!dispute) return <div className="p-6">Dispute not found</div>;

  return (
    <RequireAdmin>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">⚖ 裁定パネル</h1>

        <div className="border rounded p-4 space-y-2">
          <div><b>Dispute ID:</b> {dispute.id}</div>
          <div><b>Order ID:</b> {dispute.order_id}</div>
          <div><b>Status:</b> {dispute.status}</div>
          <div><b>Reason:</b> {dispute.reason}</div>
          <div><b>Description:</b> {dispute.description}</div>
          <div><b>Customer:</b> {dispute.customer_id}</div>
          <div><b>Employee:</b> {dispute.employee_id}</div>
        </div>

        {/* 証拠 */}
        <div className="border rounded p-4">
          <h2 className="font-bold mb-2">📎 証拠ログ</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify(dispute.evidence_urls, null, 2)}
          </pre>
        </div>

        {/* 裁定ボタン */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button
            disabled={actionLoading}
            onClick={resolveForCustomer}
            className="bg-green-600 text-white p-3 rounded hover:bg-green-700"
          >
            🧑‍💼 依頼者勝訴
          </button>

          <button
            disabled={actionLoading}
            onClick={resolveForEmployee}
            className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
          >
            👷 従業員勝訴
          </button>

          <button
            disabled={actionLoading}
            onClick={forceCancel}
            className="bg-yellow-600 text-white p-3 rounded hover:bg-yellow-700"
          >
            ⚖ 中立キャンセル
          </button>

          <button
            onClick={banCustomer}
            className="bg-red-600 text-white p-3 rounded hover:bg-red-700"
          >
            🚫 依頼者BAN
          </button>

          <button
            onClick={banEmployee}
            className="bg-red-800 text-white p-3 rounded hover:bg-red-900"
          >
            🚫 従業員BAN
          </button>

          <button
            onClick={() => navigate(-1)}
            className="bg-gray-500 text-white p-3 rounded hover:bg-gray-600"
          >
            ⬅ 戻る
          </button>
        </div>
      </div>
    </RequireAdmin>
  );
}