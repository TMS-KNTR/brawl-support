import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link_url: string | null;
  read_at: string | null;
  email_sent_at?: string | null;
  created_at: string;
};

export function useNotifications(userId: string | undefined) {
  const [list, setList] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);
    if (error) {
      console.warn('通知未読数取得エラー:', error.message);
      return;
    }
    setUnreadCount(count ?? 0);
  }, [userId]);

  const fetchList = useCallback(async (limit = 20) => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    setLoading(false);
    if (error) {
      console.warn('通知一覧取得エラー:', error.message);
      return;
    }
    setList((data as Notification[]) ?? []);
  }, [userId]);

  const markAsRead = useCallback(async (id: string) => {
    if (!userId) return;
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);
    setList((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchUnreadCount();
  }, [userId, fetchUnreadCount]);

  useEffect(() => {
    if (!userId) return;
    let channel: ReturnType<typeof supabase.channel>;
    try {
      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('通知 Realtime 購読スキップ:', e);
      return;
    }
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, fetchUnreadCount]);

  return {
    list,
    unreadCount,
    loading,
    fetchList,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
}
