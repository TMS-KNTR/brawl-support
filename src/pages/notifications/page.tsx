import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import type { Notification } from '../../hooks/useNotifications';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'たった今';
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}日前`;
  return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

function getIcon(type?: string): string {
  switch (type) {
    case 'chat_message': return 'ri-message-3-line';
    case 'order_status': return 'ri-file-list-3-line';
    case 'security': return 'ri-shield-check-line';
    case 'ng_word_violation': return 'ri-alarm-warning-line';
    default: return 'ri-notification-3-line';
  }
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { list, unreadCount, loading, fetchList, markAsRead, markAllAsRead } = useNotifications(user?.id);

  useEffect(() => {
    if (user) fetchList(50);
  }, [user, fetchList]);

  const handleClick = (n: Notification) => {
    if (!n.read_at) markAsRead(n.id);
    if (n.link_url) navigate(n.link_url);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-[72px]">
          <div className="text-center px-6">
            <p className="text-[13px] text-[#888] mb-4">ログインすると通知を確認できます</p>
            <button onClick={() => navigate('/login')}
              className="px-5 py-2 text-[12px] font-semibold bg-[#111] text-white rounded-lg hover:bg-[#333] cursor-pointer transition-colors">
              ログイン
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Header />

      <section className="pt-[72px] border-b border-[#E5E5E5] bg-white">
        <div className="max-w-3xl mx-auto px-6 pt-5 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[22px] font-bold text-[#111] tracking-tight">お知らせ</h1>
              <p className="text-[13px] text-[#888] mt-1">
                {unreadCount > 0 ? `${unreadCount}件の未読があります` : '通知はすべて確認済みです'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllAsRead}
                className="text-[12px] font-medium text-[#888] hover:text-[#111] transition-colors cursor-pointer">
                すべて既読にする
              </button>
            )}
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {loading ? (
            <div className="py-20 text-center">
              <div className="relative w-8 h-8 mx-auto mb-3">
                <div className="absolute inset-0 border-2 border-[#E5E5E5] rounded-full" />
                <div className="absolute inset-0 border-2 border-transparent border-t-[#111] rounded-full animate-spin" />
              </div>
              <p className="text-[12px] text-[#999]">読み込み中...</p>
            </div>
          ) : list.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-[#F5F5F5] mx-auto mb-4 flex items-center justify-center">
                <i className="ri-notification-3-line text-xl text-[#CCC]"></i>
              </div>
              <p className="text-[15px] font-semibold text-[#111] mb-1">通知はありません</p>
              <p className="text-[13px] text-[#888]">新しい通知が届くとここに表示されます</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-[#E5E5E5] overflow-hidden">
              {list.map((n, idx) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-5 py-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer ${
                    idx > 0 ? 'border-t border-[#F0F0F0]' : ''
                  } ${!n.read_at ? 'bg-[#FAFCFF]' : ''}`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      !n.read_at ? 'bg-[#111] text-white' : 'bg-[#F5F5F5] text-[#999]'
                    }`}>
                      <i className={`${getIcon(n.type)} text-[14px]`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-[13px] truncate ${!n.read_at ? 'font-bold text-[#111]' : 'font-medium text-[#333]'}`}>
                          {n.title}
                        </p>
                        {!n.read_at && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#111] shrink-0"></span>
                        )}
                      </div>
                      {n.body && (
                        <p className="text-[12px] text-[#888] mt-0.5 line-clamp-2">{n.body}</p>
                      )}
                      <p className="text-[10px] text-[#BBB] mt-1.5">{timeAgo(n.created_at)}</p>
                    </div>
                    {n.link_url && (
                      <i className="ri-arrow-right-s-line text-[16px] text-[#CCC] shrink-0 mt-1"></i>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
