import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import { useAuth } from '../../../../contexts/AuthContext';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';

export default function AdminInterventionChatPage() {
  const { disputeId } = useParams();
  const { user } = useAuth();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  // ======================
  // メッセージ取得
  // ======================
  useEffect(() => {
    if (!disputeId) return;

    fetchMessages();

    const channel = supabase
      .channel('admin-intervention')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dispute_messages',
          filter: `dispute_id=eq.${disputeId}`,
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [disputeId]);

  async function fetchMessages() {
    const { data } = await supabase
      .from('dispute_messages')
      .select('*')
      .eq('dispute_id', disputeId)
      .order('created_at');

    setMessages(data || []);
  }

  // ======================
  // 送信
  // ======================
  async function send() {
    if (!text.trim()) return;

    await supabase.from('dispute_messages').insert({
      dispute_id: disputeId,
      sender_id: user?.id,
      content: text,
    });

    setText('');
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        <div className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col">
          <h1 className="text-2xl font-bold mb-4">管理者介入チャット</h1>

          {/* メッセージ一覧 */}
          <div className="flex-1 bg-white rounded p-4 overflow-y-auto border mb-4">
            {messages.map((m) => (
              <div key={m.id} className="mb-2">
                <span className="text-xs text-gray-500">{m.sender_id}</span>
                <div className="bg-gray-100 rounded px-3 py-2">
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          {/* 入力 */}
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="メッセージ入力..."
            />
            <button
              onClick={send}
              className="bg-purple-600 text-white px-4 rounded"
            >
              送信
            </button>
          </div>
        </div>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}