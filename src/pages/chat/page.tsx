import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, invokeEdgeFunction } from '../../lib/supabase';

export default function ChatPage() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [threadInfo, setThreadInfo] = useState<any>(null);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const CHAT_BUCKET = 'chat-attachments';
  const SIGNED_URL_TTL = 3600; // 1時間
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [ngWords, setNgWords] = useState<string[]>([]);

  useEffect(() => { if (user && threadId) checkAccess(); }, [user, threadId]);

  useEffect(() => {
    supabase.from('system_settings').select('value').eq('key', 'ng_words').maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          try {
            let words = data.value;
            while (typeof words === 'string') words = JSON.parse(words);
            if (Array.isArray(words)) setNgWords(words);
          } catch { /* ignore */ }
        }
      });
  }, []);

  useEffect(() => {
    if (orderId) {
      fetchMessages();
      let sub: any = null;
      try {
        sub = supabase.channel(`messages:${orderId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `order_id=eq.${orderId}` }, () => fetchMessages())
          .subscribe();
      } catch (e) {
        console.warn('Realtime subscription failed, falling back to polling:', e);
        // WebSocketが使えない場合はポーリングでメッセージを取得
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
      }
      return () => { sub?.unsubscribe(); };
    }
  }, [orderId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const checkAccess = async () => {
    if (!user || !threadId) return;
    try {
      const { data: thread, error } = await supabase
        .from('chat_threads').select('*, order:orders(id, user_id, employee_id, status)').eq('id', threadId).single();
      if (error || !thread) { setHasAccess(false); setLoading(false); return; }
      setThreadInfo(thread);
      const order = thread.order;
      if (!order) { setHasAccess(false); setLoading(false); return; }
      setOrderId(order.id);
      const isCustomer = order.user_id === user.id;
      const isWorker = order.employee_id === user.id;
      const isAdmin = userProfile?.role === 'admin';
      if (!isCustomer && !isWorker && !isAdmin) { setHasAccess(false); setLoading(false); return; }
      setHasAccess(true);
      if (isAdmin) setReceiverId(order.user_id);
      else setReceiverId(isCustomer ? order.employee_id : order.user_id);
    } catch { setHasAccess(false); } finally { setLoading(false); }
  };

  const fetchMessages = async () => {
    if (!orderId) return;
    try {
      const { data: msgs, error } = await supabase.from('messages').select('*').eq('order_id', orderId).order('created_at', { ascending: true });
      if (error) throw error;
      const senderIds = [...new Set(msgs?.map(m => m.sender_id) || [])];
      let profiles: any[] = [];
      if (senderIds.length > 0) {
        try {
          const result = await invokeEdgeFunction<{ success: boolean; data?: any[]; error?: string }>('chat-data', { action: 'get-sender-profiles', user_ids: senderIds, order_id: orderId });
          if (result.success) profiles = result.data || [];
        } catch (e) { console.error('プロフィール取得エラー:', e); }
      }
      const pMap = new Map(profiles.map((p: any) => [p.id, p]));
      const enriched = msgs?.map(m => ({ ...m, sender: pMap.get(m.sender_id) || null })) || [];
      setMessages(enriched);

      // Private バケットの添付画像用に署名付きURLを一括生成
      const pathsToSign = enriched
        .filter(m => m.attachment_url && !m.attachment_url.startsWith('http'))
        .map(m => m.attachment_url as string);
      if (pathsToSign.length > 0) {
        const { data: signed } = await supabase.storage.from(CHAT_BUCKET).createSignedUrls(pathsToSign, SIGNED_URL_TTL);
        if (signed) {
          const urlMap: Record<string, string> = {};
          signed.forEach((s) => { if (s.signedUrl && s.path) urlMap[s.path] = s.signedUrl; });
          setSignedUrls(prev => ({ ...prev, ...urlMap }));
        }
      }

      if (user) {
        await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('order_id', orderId).eq('receiver_id', user.id).is('read_at', null);
      }
    } catch (e) { console.error('メッセージ取得エラー:', e); }
  };

  const containsPersonalInfo = (msg: string) => [/\d{2,4}-\d{2,4}-\d{4}/, /LINE\s*ID|ライン|らいん/i, /Discord|ディスコード/i, /Twitter|ツイッター/i, /Instagram|インスタ/i].some(p => p.test(msg));
  const containsBannedContent = (msg: string) => /(gametrade|ゲームトレード|x\.com|twitter\.com|discord\.gg|line\.me|https?:\/\/)/i.test(msg);
  const detectNgWord = (msg: string): string | null => { const l = msg.toLowerCase(); for (const w of ngWords) { if (l.includes(w.toLowerCase())) return w; } return null; };

  const reportViolation = async (message: string, matchedWord: string) => {
    try {
      await supabase.from('chat_violations').insert({ user_id: user?.id, order_id: orderId, thread_id: threadId, message_content: message, matched_word: matchedWord });
      let admins: any[] = [];
      try {
        const adminResult = await invokeEdgeFunction<{ success: boolean; data?: any[]; error?: string }>('chat-data', { action: 'get-admin-ids' });
        if (adminResult.success) admins = adminResult.data || [];
      } catch {}
      if (admins.length) {
        const { data: { session } } = await supabase.auth.getSession();
        for (const a of admins) {
          try { await supabase.functions.invoke('create-notification', { body: { user_id: a.id, type: 'ng_word_violation', title: 'NGワード検知', body: `NGワード「${matchedWord}」を検知`, link_url: `/chat/${threadId}` }, headers: { Authorization: `Bearer ${session?.access_token}` } }); } catch {}
        }
      }
    } catch (e) { console.error('違反記録エラー:', e); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = newMessage.trim().length > 0;
    const hasImage = !!attachmentFile;
    if ((!hasText && !hasImage) || !user || !orderId || sending) return;
    if (userProfile?.is_banned) { alert('アカウント停止中のためメッセージを送信できません。'); return; }
    if (hasText) {
      const matched = detectNgWord(newMessage);
      if (matched) reportViolation(newMessage, matched);
      if (containsBannedContent(newMessage)) { reportViolation(newMessage, 'banned_content'); alert('プラットフォーム外への誘導やリンクの送信は禁止されています。'); return; }
      if (containsPersonalInfo(newMessage)) { reportViolation(newMessage, 'personal_info'); alert('安全のため、電話番号やSNSアカウント等の個人情報の交換はご遠慮ください。'); return; }
    }
    setSending(true);
    try {
      let attachmentUrl: string | null = null;
      if (attachmentFile) {
        const ext = attachmentFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'jpg';
        const path = `${orderId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
        const { error: upErr } = await supabase.storage.from(CHAT_BUCKET).upload(path, attachmentFile, { contentType: attachmentFile.type, upsert: false });
        if (upErr) throw upErr;
        // Private バケット: パスを保存し、表示時に署名付きURLを生成
        attachmentUrl = path;
      }
      const { error } = await supabase.from('messages').insert({ sender_id: user.id, receiver_id: receiverId ?? null, order_id: orderId, content: newMessage.trim() || '', ...(attachmentUrl && { attachment_url: attachmentUrl }) });
      if (error) throw error;
      if (receiverId && threadId) {
        const body = newMessage.trim() ? newMessage.trim().slice(0, 60) + (newMessage.trim().length > 60 ? '...' : '') : '画像が送信されました';
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await supabase.functions.invoke('create-notification', { body: { user_id: receiverId, type: 'chat_message', title: 'チャットに新しいメッセージ', body, link_url: `/chat/${threadId}` }, headers: { Authorization: `Bearer ${session?.access_token}` } });
          if (res.data?.id) await supabase.functions.invoke('send-notification-email', { body: { notification_id: res.data.id }, headers: { Authorization: `Bearer ${session?.access_token}` } });
        } catch {}
      }
      setNewMessage(''); setAttachmentFile(null); setAttachmentPreview(null); fetchMessages();
    } catch (err: any) { alert(err?.message?.includes('Bucket') ? '画像のアップロードに失敗しました。' : 'メッセージの送信に失敗しました'); }
    finally { setSending(false); }
  };

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!ALLOWED_TYPES.includes(file.type)) { alert('対応形式: JPEG, PNG, GIF, WebP のみ'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('画像は5MB以下にしてください。'); return; }
    // マジックバイトで実際のファイルタイプを検証
    const header = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(header);
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    const isGif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
    const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === undefined; // RIFF header
    if (!isJpeg && !isPng && !isGif && !isWebp) { alert('不正なファイル形式です。画像ファイルを選択してください。'); return; }
    setAttachmentFile(file);
    const reader = new FileReader();
    reader.onload = () => setAttachmentPreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearAttachment = () => { setAttachmentFile(null); setAttachmentPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  // ── Loading / No access ──
  if (!user || loading) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <XHeader onBack={() => navigate(userProfile?.role === 'admin' ? '/dashboard/admin' : userProfile?.role === 'employee' || userProfile?.role === 'worker' ? '/dashboard/employee' : '/dashboard/customer', { replace: true })} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#111] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }
  if (!hasAccess) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <XHeader onBack={() => navigate(userProfile?.role === 'admin' ? '/dashboard/admin' : userProfile?.role === 'employee' || userProfile?.role === 'worker' ? '/dashboard/employee' : '/dashboard/customer', { replace: true })} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-6">
            <p className="text-[15px] font-bold text-[#0F1419] mb-1">アクセス権限がありません</p>
            <p className="text-[13px] text-[#536471] mb-4">このチャットにアクセスする権限がありません</p>
            <button onClick={() => navigate(userProfile?.role === 'admin' ? '/dashboard/admin' : userProfile?.role === 'employee' || userProfile?.role === 'worker' ? '/dashboard/employee' : '/dashboard/customer')}
              className="px-5 py-2 text-[14px] font-bold bg-[#0F1419] text-white rounded-full hover:bg-[#272C30] cursor-pointer transition-colors">
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Helpers ──
  const order = threadInfo?.order;
  const orderClosed = order && ['cancelled', 'disputed', 'refunded'].includes(order.status?.toLowerCase());
  const getSenderLabel = (sid: string) => {
    if (sid === order?.user_id) return '依頼者';
    if (sid === order?.employee_id) return '代行者';
    return '管理者';
  };
  const isAdminSender = (sid: string) => sid !== order?.user_id && sid !== order?.employee_id;
  const myMsgs = messages.filter(m => m.sender_id === user?.id);
  const lastMyId = myMsgs[myMsgs.length - 1]?.id || null;

  // Group messages by date
  const shouldShowDate = (idx: number) => {
    if (idx === 0) return true;
    const prev = new Date(messages[idx - 1].created_at).toDateString();
    const cur = new Date(messages[idx].created_at).toDateString();
    return prev !== cur;
  };
  const formatDate = (d: string) => {
    const date = new Date(d);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return '今日';
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return '昨日';
    return date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
  };

  return (
    <div className="h-screen flex flex-col bg-[#F5F5F5]">
      {/* ── Header ── */}
      <XHeader onBack={() => navigate(userProfile?.role === 'admin' ? '/dashboard/admin' : userProfile?.role === 'employee' || userProfile?.role === 'worker' ? '/dashboard/employee' : '/dashboard/customer', { replace: true })} />

      {/* ── Messages ── */}
      <style>{`.chat-scroll::-webkit-scrollbar{display:none} .chat-scroll{scrollbar-width:none;}`}</style>
      <div className="chat-scroll flex-1 overflow-y-auto bg-[#F5F5F5]">
        <div className="max-w-[600px] mx-auto px-4 py-2 min-h-full bg-white border-x border-[#EFF3F4]">
          {/* アカウント共有ガイド（依頼者のみ） */}
          {threadInfo?.order?.user_id === user?.id && <AccountGuide />}

          {messages.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 rounded-full bg-[#F7F9F9] flex items-center justify-center mx-auto mb-3">
                <i className="ri-message-3-line text-[22px] text-[#536471]"></i>
              </div>
              <p className="text-[15px] font-bold text-[#0F1419] mb-1">まだメッセージがありません</p>
              <p className="text-[13px] text-[#536471]">以下の手順に沿ってアカウント情報を送信してください</p>
            </div>
          ) : (
            <div>
              {messages.map((message, idx) => {
                const showDate = shouldShowDate(idx);

                if (message.is_system) {
                  return (
                    <div key={message.id}>
                      {showDate && <DateSeparator label={formatDate(message.created_at)} />}
                      <div className="text-center py-3">
                        <span className="text-[13px] text-[#536471]">{message.content}</span>
                      </div>
                    </div>
                  );
                }

                const isMine = message.sender_id === user?.id;
                const isAdmin = isAdminSender(message.sender_id);
                const isLastMine = isMine && message.id === lastMyId;
                const time = new Date(message.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

                // Check grouping: first / middle / last in consecutive same-sender run
                const prevMsg = messages[idx - 1];
                const nextMsg = messages[idx + 1];
                const isFirstInGroup = !prevMsg || prevMsg.sender_id !== message.sender_id || prevMsg.is_system || shouldShowDate(idx);
                const isLastInGroup = !nextMsg || nextMsg.sender_id !== message.sender_id || nextMsg.is_system;

                return (
                  <div key={message.id}>
                    {showDate && <DateSeparator label={formatDate(message.created_at)} />}
                    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-2.5' : 'mb-[3px]'}`}>
                      {/* Avatar for received messages (only last in group) */}
                      {!isMine && (
                        <div className="w-8 shrink-0 self-end mr-2">
                          {isLastInGroup && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${
                              isAdmin ? 'bg-[#DC2626] text-white' : 'bg-[#EFF3F4] text-[#536471]'
                            }`}>
                              {isAdmin ? '管' : getSenderLabel(message.sender_id).charAt(0)}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="max-w-[75%] sm:max-w-[65%]">
                        {/* Sender label (first in group only) */}
                        {!isMine && isFirstInGroup ? (
                          <div className="flex items-center gap-1.5 mb-1 ml-1">
                            <span className="text-[13px] font-bold text-[#0F1419]">{getSenderLabel(message.sender_id)}</span>
                            {isAdmin && <span className="text-[11px] text-[#536471]">管理者</span>}
                          </div>
                        ) : null}

                        {/* Bubble */}
                        <div className={`${
                          isMine
                            ? isAdmin
                              ? 'bg-[#DC2626] text-white'
                              : 'bg-[#536471] text-white'
                            : 'bg-[#EFF3F4] text-[#0F1419]'
                        } ${
                          isMine
                            ? isLastInGroup ? 'rounded-[20px] rounded-br-[4px]' : 'rounded-[20px]'
                            : isLastInGroup ? 'rounded-[20px] rounded-bl-[4px]' : 'rounded-[20px]'
                        } px-3 py-2`}>
                          {message.attachment_url && (() => {
                            // 既存の公開URL（http）はそのまま、パスは署名付きURLに変換
                            const imgUrl = message.attachment_url.startsWith('http')
                              ? message.attachment_url
                              : signedUrls[message.attachment_url] || '';
                            if (!imgUrl) return null;
                            return (
                            <div className="relative group mb-1.5 rounded-xl overflow-hidden -mx-1 -mt-0.5">
                              <a href={imgUrl} target="_blank" rel="noopener noreferrer">
                                <img src={imgUrl} alt="添付画像"
                                  className="max-w-full max-h-[280px] object-contain" />
                              </a>
                              <button type="button" onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const res = await fetch(imgUrl);
                                    const blob = await res.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = (message.attachment_url as string).split('/').pop() || 'image.jpg';
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  } catch { alert('ダウンロードに失敗しました'); }
                                }}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/70">
                                <i className="ri-download-line text-[14px]"></i>
                              </button>
                            </div>
                            );
                          })()}
                          {message.content && (
                            <p className="text-[15px] leading-[20px] whitespace-pre-wrap break-words">{message.content}</p>
                          )}
                        </div>

                        {/* Time + Read (last in group) */}
                        {isLastInGroup && (
                          <div className={`flex items-center gap-1.5 mt-0.5 ${isMine ? 'justify-end mr-1' : 'ml-1'}`}>
                            <span className="text-[11px] text-[#536471]">{time}</span>
                            {isLastMine && message.read_at && (
                              <i className="ri-check-double-line text-[12px] text-[#111]"></i>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── Banned / Closed ── */}
      {(userProfile?.is_banned || orderClosed) && (
        <div className="border-t border-[#EFF3F4] bg-[#F5F5F5]">
          <div className="max-w-[600px] mx-auto px-4 py-3 border-x border-[#EFF3F4] bg-white text-center">
            <p className="text-[13px] text-[#536471] font-medium">
              {userProfile?.is_banned ? 'アカウント停止中のためメッセージを送信できません' : 'この注文は終了したため、チャットは閲覧のみです'}
            </p>
          </div>
        </div>
      )}

      {/* ── Input ── */}
      {!userProfile?.is_banned && !orderClosed && (
        <div className="border-t border-[#EFF3F4] bg-[#F5F5F5]">
          <div className="max-w-[600px] mx-auto px-2 py-2 border-x border-[#EFF3F4] bg-white">
            {attachmentPreview && (
              <div className="flex items-start gap-2 mb-2 ml-11">
                <div className="relative">
                  <img src={attachmentPreview} alt="プレビュー" className="h-20 w-20 object-cover rounded-2xl" />
                  <button type="button" onClick={clearAttachment}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0F1419] text-white flex items-center justify-center cursor-pointer hover:bg-[#272C30]">
                    <i className="ri-close-line text-[10px]"></i>
                  </button>
                </div>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-end gap-1">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAttachmentChange} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sending}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#111] hover:bg-[#F5F5F5] transition-colors cursor-pointer disabled:opacity-40 shrink-0">
                <i className="ri-image-line text-[18px]"></i>
              </button>
              <div className="flex-1 flex items-end bg-[#EFF3F4] rounded-2xl px-3 py-1.5 min-h-[36px]">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="メッセージを入力"
                  className="flex-1 bg-transparent text-[15px] text-[#0F1419] placeholder:text-[#536471] focus:outline-none leading-[22px] py-0.5"
                  disabled={sending}
                />
              </div>
              <button type="submit"
                disabled={(!newMessage.trim() && !attachmentFile) || sending}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#111] hover:bg-[#F5F5F5] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0">
                {sending
                  ? <i className="ri-loader-4-line text-[18px] animate-spin"></i>
                  : <i className="ri-send-plane-2-fill text-[18px]"></i>
                }
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── X-style Header ── */
function XHeader({ onBack, name, detail, isAdmin }: {
  onBack: () => void;
  name?: string;
  detail?: string;
  isAdmin?: boolean;
}) {
  return (
    <div className="border-b border-[#EFF3F4] bg-[#F5F5F5] shrink-0 sticky top-0 z-10">
      <div className="max-w-[600px] mx-auto px-2 h-[53px] flex items-center gap-2 border-x border-[#EFF3F4] bg-white">
        <button onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#0F1419] hover:bg-[#EFF3F4] transition-colors cursor-pointer">
          <i className="ri-arrow-left-line text-[20px]"></i>
        </button>
        <div className="flex-1 min-w-0 ml-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[17px] font-extrabold text-[#0F1419] truncate leading-tight">{name || 'チャット'}</span>
            {isAdmin && <span className="text-[11px] font-bold text-[#536471]">管理者</span>}
          </div>
          {detail && <p className="text-[13px] text-[#536471] truncate leading-tight">{detail}</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Date Separator ── */
function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-3">
      <span className="text-[13px] font-medium text-[#536471]">{label}</span>
    </div>
  );
}

/* ── Account Guide ── */
function AccountGuide() {
  const [searchParams] = useSearchParams();
  const guideOpen = searchParams.get('guide') === 'open';
  const [collapsed, setCollapsed] = useState(() => guideOpen ? false : localStorage.getItem('guide_collapsed') === '1');
  const toggleCollapsed = (v: boolean) => { setCollapsed(v); if (v) localStorage.setItem('guide_collapsed', '1'); };
  const [zoomImg, setZoomImg] = useState<string | null>(null);

  const steps = [
    {
      img: '/guide/step1_supercell_id.jpg',
      text: <>ブロスタを開き、<strong>Supercell ID 設定画面</strong>を開く</>,
    },
    {
      img: '/guide/step1.jpg',
      text: <>設定画面で「代行するアカウント」の<strong>メールアドレスをコピー</strong></>,
    },
    {
      img: '/guide/step2.png',
      text: <>設定画面の「<strong>ログアウト</strong>」をタップしてアカウントからログアウト</>,
    },
    {
      img: '/guide/step3.png',
      text: <>ログイン画面でメアドを入力し「<strong>認証コードを送信</strong>」→ メールに届いたコードを確認</>,
    },
    {
      img: '/guide/step4.jpg',
      text: <>このチャットに<strong>メールアドレス</strong>と<strong>認証コード</strong>を送信</>,
    },
  ];

  if (collapsed) {
    return (
      <button onClick={() => setCollapsed(false)}
        className="w-full my-3 px-4 py-2.5 rounded-xl bg-[#F7F9F9] border border-[#EFF3F4] flex items-center justify-between cursor-pointer hover:bg-[#EFF3F4] transition-colors">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-[#536471]">
          <i className="ri-shield-keyhole-line text-[14px]"></i>
          ブロスタアカウント共有手順を表示
        </span>
        <i className="ri-arrow-down-s-line text-[16px] text-[#536471]"></i>
      </button>
    );
  }

  return (
    <>
      <div className="my-3 rounded-xl bg-[#F7F9F9] border border-[#EFF3F4] overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-[13px] font-bold text-[#0F1419]">
            <i className="ri-shield-keyhole-line text-[14px] text-[#536471]"></i>
            ブロスタアカウント共有手順
          </span>
          <button onClick={() => toggleCollapsed(true)}
            className="px-2.5 py-1 rounded-full border border-[#CFD9DE] flex items-center gap-1 hover:bg-[#E1E8ED] cursor-pointer transition-colors">
            <span className="text-[11px] font-medium text-[#536471]">閉じる</span>
            <i className="ri-arrow-up-s-line text-[14px] text-[#536471]"></i>
          </button>
        </div>
        <div className="px-4 pb-4 space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <span className="w-[22px] h-[22px] rounded-full bg-[#0F1419] text-white flex items-center justify-center text-[10px] font-bold">
                  {i + 1}
                </span>
                {i < steps.length - 1 && <div className="w-[2px] flex-1 bg-[#E1E8ED] mt-1 rounded-full" />}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <p className="text-[13px] text-[#536471] leading-relaxed mb-2">{step.text}</p>
                <button type="button" onClick={() => setZoomImg(step.img)}
                  className="block rounded-lg overflow-hidden border border-[#EFF3F4] hover:border-[#CFD9DE] transition-colors cursor-pointer">
                  <img src={step.img} alt={`手順${i + 1}`}
                    className="w-full max-w-[240px] h-auto object-contain bg-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zoom overlay */}
      {zoomImg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setZoomImg(null)}>
          <div className="relative max-w-lg w-full">
            <img src={zoomImg} alt="拡大表示" className="w-full rounded-xl shadow-2xl" />
            <button onClick={() => setZoomImg(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-[#0F1419] flex items-center justify-center shadow-lg cursor-pointer hover:bg-[#F7F9F9]">
              <i className="ri-close-line text-[18px]"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Status Banner ── */
function StatusBanner({ status }: { status?: string }) {
  const s = (status || '').toLowerCase();
  const config: Record<string, { icon: string; text: string; bg: string; border: string; color: string }> = {
    paid:             { icon: 'ri-time-line',       text: 'チャットの"アカウント共有手順"に沿って認証コードを送信し、代行者の受注をお待ちください', bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', color: 'text-[#1E40AF]' },
    paid_unassigned:  { icon: 'ri-time-line',       text: 'チャットの"アカウント共有手順"に沿って認証コードを送信し、代行者の受注をお待ちください', bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', color: 'text-[#1E40AF]' },
    open:             { icon: 'ri-time-line',       text: 'チャットの"アカウント共有手順"に沿って認証コードを送信し、代行者の受注をお待ちください', bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', color: 'text-[#1E40AF]' },
    assigned:         { icon: 'ri-user-follow-line', text: '代行者が決まりました。認証コードがまだの場合はチャットから送信してください。代行の開始をお待ちください', bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', color: 'text-[#1E40AF]' },
    claimed:          { icon: 'ri-user-follow-line', text: '代行者が決まりました。認証コードがまだの場合はチャットから送信してください。代行の開始をお待ちください', bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', color: 'text-[#1E40AF]' },
    in_progress:      { icon: 'ri-loader-4-line',   text: '代行作業中です。完了までお待ちください', bg: 'bg-[#FFFBEB]', border: 'border-[#FDE68A]', color: 'text-[#92400E]' },
    completed:        { icon: 'ri-check-line',       text: '代行が完了しました。ゲームを開いて結果を確認し、"完了を確認"を押してください', bg: 'bg-[#ECFDF5]', border: 'border-[#A7F3D0]', color: 'text-[#065F46]' },
    delivered:        { icon: 'ri-check-line',       text: '代行が完了しました。ゲームを開いて結果を確認し、"完了を確認"を押してください', bg: 'bg-[#ECFDF5]', border: 'border-[#A7F3D0]', color: 'text-[#065F46]' },
    confirmed:        { icon: 'ri-check-double-line', text: 'お取引完了です。ありがとうございました', bg: 'bg-[#F7F9F9]', border: 'border-[#EFF3F4]', color: 'text-[#536471]' },
  };
  const c = config[s];
  if (!c) return null;
  return (
    <div className={`${c.bg} border-b ${c.border}`}>
      <div className="max-w-[600px] mx-auto px-4 py-2.5 flex items-start gap-2">
        <i className={`${c.icon} text-[15px] ${c.color} shrink-0 mt-0.5`}></i>
        <p className={`text-[12px] ${c.color} leading-relaxed`}>{c.text}</p>
      </div>
    </div>
  );
}
