import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import type { Notification } from '../hooks/useNotifications';

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

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { list, unreadCount, fetchList, fetchUnreadCount, markAsRead } = useNotifications(user?.id);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchUnreadCount();
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    if (open && user) fetchList(10);
  }, [open, user, fetchList]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClickNotification = (n: Notification) => {
    if (!n.read_at) markAsRead(n.id);
    setOpen(false);
    if (n.link_url && n.link_url.startsWith('/')) navigate(n.link_url);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <style>{`
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(14deg); }
          30% { transform: rotate(-12deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-8deg); }
          75% { transform: rotate(4deg); }
        }
        .bell-ring:hover i { animation: bellRing 0.6s ease; }
      `}</style>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`bell-ring relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
          open
            ? 'bg-[#5B3AE8] text-white shadow-[0_0_12px_rgba(91,58,232,0.35)]'
            : 'bg-[#F5F5F5] text-[#666] hover:bg-[#EBEBEB] hover:text-[#111]'
        }`}
        aria-label="通知"
      >
        <i className="ri-notification-3-fill text-[14px]"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center bg-[#DC2626] text-white text-[9px] font-bold rounded-full px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-[#E5E5E5] shadow-lg z-50 overflow-hidden"
          style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
          <div className="px-4 py-3 border-b border-[#F0F0F0] flex justify-between items-center">
            <span className="text-[14px] font-bold text-[#111]">通知</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); navigate('/notifications'); }}
              className="text-[11px] font-medium text-[#888] hover:text-[#111] transition-colors cursor-pointer"
            >
              すべて見る
            </button>
          </div>
          <div className="overflow-y-auto max-h-80">
            {list.length === 0 ? (
              <div className="py-10 text-center">
                <i className="ri-notification-3-line text-[24px] text-[#DDD] block mb-2"></i>
                <p className="text-[12px] text-[#999]">通知はありません</p>
              </div>
            ) : (
              list.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClickNotification(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-[#FAFAFA] transition-colors cursor-pointer border-b border-[#F5F5F5] last:border-0 ${
                    !n.read_at ? 'bg-[#F8F8FF]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!n.read_at && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#111] shrink-0 mt-1.5"></span>
                    )}
                    <div className={`min-w-0 flex-1 ${n.read_at ? 'ml-[18px]' : ''}`}>
                      <p className={`text-[13px] truncate ${!n.read_at ? 'font-bold text-[#111]' : 'font-medium text-[#333]'}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-[11px] text-[#888] truncate mt-0.5">{n.body}</p>
                      )}
                      <p className="text-[10px] text-[#BBB] mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
