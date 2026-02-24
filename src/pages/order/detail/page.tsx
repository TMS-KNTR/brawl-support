import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

export default function OrderDetailPage() {
  const { id } = useParams();
  const { userProfile } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // dispute
  const [showDispute, setShowDispute] = useState(false);
  const [reason, setReason] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (!error) setOrder(data);
      setLoading(false);
    };

    load();
  }, [id]);

  if (loading) return <div className="p-6">読み込み中...</div>;
  if (!order) return <div className="p-6">注文が見つかりません</div>;

  const createDispute = async () => {
    if (!reason) {
      alert('理由を入力してください');
      return;
    }

    const { error } = await supabase.from('disputes').insert({
      order_id: order.id,
      customer_id: userProfile?.id,
      employee_id: order.assigned_employee_id,
      status: 'open',
      reason,
      description: desc,
    });

    if (error) {
      alert(error.message);
    } else {
      alert('紛争を作成しました');
      setShowDispute(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">注文詳細</h1>

      <div className="border p-4 rounded mb-4">
        <p><b>ID:</b> {order.id}</p>
        <p><b>Status:</b> {order.status}</p>
      </div>

      {/* 紛争作成ボタン */}
      {userProfile?.role === 'customer' && (
        <button
          onClick={() => setShowDispute(true)}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          ⚖ 紛争を作成
        </button>
      )}

      {/* 紛争モーダル */}
      {showDispute && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-md">
            <h2 className="font-bold mb-3">紛争作成</h2>

            <input
              className="border w-full p-2 mb-2"
              placeholder="理由"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <textarea
              className="border w-full p-2 mb-2"
              placeholder="詳細"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDispute(false)} className="border px-3 py-1 rounded">
                キャンセル
              </button>
              <button onClick={createDispute} className="bg-red-600 text-white px-3 py-1 rounded">
                作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}