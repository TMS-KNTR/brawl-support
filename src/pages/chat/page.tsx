import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';

export default function ChatPage() {
  const { threadId } = useParams();
  const { user, userProfile, signOut } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [threadInfo, setThreadInfo] = useState(null);
  const [receiverId, setReceiverId] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const messagesEndRef = useRef(null);

  const handleLogout = async () => {
    try {
      await signOut();
      window.REACT_APP_NAVIGATE('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      alert('ログアウトに失敗しました');
    }
  };

  useEffect(() => {
    if (user && threadId) {
      checkAccess();
    }
  }, [user, threadId]);

  useEffect(() => {
    if (orderId) {
      fetchMessages();
      
      // リアルタイム更新の設定
      const subscription = supabase
        .channel(`messages:${orderId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'messages',
            filter: `order_id=eq.${orderId}`
          }, 
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAccess = async () => {
    if (!user || !threadId) return;

    try {
      // チャットスレッド取得（order情報をリレーションで取得）
      const { data: thread, error } = await supabase
        .from('chat_threads')
        .select(`
          *,
          order:orders(id, user_id, employee_id)
        `)
        .eq('id', threadId)
        .single();

      if (error || !thread) {
        console.error("チャットスレッド取得エラー:", error);
        setHasAccess(false);
        setLoading(false);
        return;
      }

      console.log("thread data:", thread);
      console.log("current user:", user.id);

      setThreadInfo(thread);

      // order情報から権限チェック
      const order = thread.order;
      if (!order) {
        console.error("注文情報が見つかりません");
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // 注文IDを保存
      setOrderId(order.id);

      // user_id（依頼者）、employee_id（代行者）、または管理者であればアクセス許可
      const isCustomer = order.user_id === user.id;
      const isWorker = order.employee_id === user.id;
      const isAdmin = userProfile?.role === 'admin';

      console.log("isCustomer:", isCustomer, "isWorker:", isWorker, "isAdmin:", isAdmin);

      if (!isCustomer && !isWorker && !isAdmin) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // アクセス権限あり
      setHasAccess(true);

      // 相手IDを設定（管理者の場合は依頼者をreceiver_idにする）
      if (isAdmin) {
        setReceiverId(order.user_id);
      } else {
        const otherId = isCustomer ? order.employee_id : order.user_id;
        setReceiverId(otherId);
      }
    } catch (e) {
      console.error("権限チェックエラー:", e);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!orderId) return;

    try {
      // メッセージを取得（order_idで絞り込み）
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // 送信者IDのリストを作成
      const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];

      // 送信者情報を取得
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, role')
        .in('id', senderIds);

      if (profilesError) throw profilesError;

      // プロフィール情報をマップに変換
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // メッセージに送信者情報を追加
      const messagesWithSender = messagesData?.map(message => ({
        ...message,
        sender: profilesMap.get(message.sender_id) || null
      })) || [];

      setMessages(messagesWithSender);

      // 【追加】自分宛ての未読メッセージを既読にする
      if (user) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("order_id", orderId)
          .eq("receiver_id", user.id)
          .is("read_at", null);
      }
    } catch (error) {
      console.error('メッセージ取得エラー:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const containsPersonalInfo = (message) => {
    const patterns = [
      /\d{2,4}-\d{2,4}-\d{4}/,  // 電話番号
      /LINE\s*ID|ライン|らいん/i,  // LINE ID
      /Discord|ディスコード/i,  // Discord
      /Twitter|ツイッター/i,  // Twitter
      /Instagram|インスタ/i,  // Instagram
    ];
    
    return patterns.some(pattern => pattern.test(message));
  };

  const containsBannedContent = (message) => {
    const bannedPatterns = /(gametrade|ゲームトレード|x\.com|twitter\.com|discord\.gg|line\.me|https?:\/\/)/i;
    return bannedPatterns.test(message);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !receiverId || !orderId || sending) return;

    // アカウント停止中のチェック
    if (userProfile?.is_banned) {
      alert('アカウント停止中のためメッセージを送信できません。');
      return;
    }

    // 外部サイトへの誘導やURLリンクの検知
    if (containsBannedContent(newMessage)) {
      alert('プラットフォーム外への誘導やリンクの送信は禁止されています。サイト内でやり取りしてください。');
      return;
    }

    // 個人情報の検知
    if (containsPersonalInfo(newMessage)) {
      alert('安全のため、電話番号やSNSアカウント等の個人情報の交換はご遠慮ください。アカウント引き継ぎ用のメールアドレスは送信可能です。');
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          order_id: orderId,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages(); // メッセージを再取得
    } catch (error) {
      console.error('メッセージ送信エラー:', error);
      alert('メッセージの送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">ログインが必要です</h1>
          <button
            onClick={() => window.REACT_APP_NAVIGATE('/login')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            ログインページへ
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">アクセス権限がありません</h1>
          <p className="text-gray-600 mb-6">このチャットにアクセスする権限がありません。</p>
          <button
            onClick={() => window.REACT_APP_NAVIGATE('/')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onLogout={handleLogout} />
      
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* チャットヘッダー */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                代行チャット
              </h1>
              <p className="text-gray-600">
                依頼に関するメッセージのやり取り
              </p>
              {userProfile?.role === 'admin' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-medium">管理者モード</span>
                  <span className="text-sm text-gray-500">仲裁として参加中</span>
                </div>
              )}
            </div>
            {orderId && (
              <button
                onClick={() => window.REACT_APP_NAVIGATE(`/order/${orderId}`)}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                依頼詳細を見る
              </button>
            )}
          </div>
        </div>

        {/* チャットエリア */}
        <div className="bg-white rounded-lg shadow-sm flex flex-col h-96">
          {/* メッセージ一覧 */}
          <div className="flex-1 p-6 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <i className="ri-message-3-line text-4xl text-gray-300 mb-2"></i>
                <p className="text-gray-600">まだメッセージがありません</p>
                <p className="text-sm text-gray-500">最初のメッセージを送信してみましょう</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  // 自分が送ったメッセージのリストを取得
                  const myMessages = messages.filter((m) => m.sender_id === user?.id);
                  // 自分の最後のメッセージのIDを取得
                  const lastMyMessageId = myMessages[myMessages.length - 1]?.id || null;

                  return messages.map((message) => {
                    // システムメッセージの場合は中央揃えで表示
                    if (message.is_system) {
                      return (
                        <div key={message.id} className="text-center text-xs text-gray-400 my-2">
                          {message.content}
                        </div>
                      );
                    }

                    const isMine = message.sender_id === user?.id;
                    const isLastMyMessage = isMine && message.id === lastMyMessageId;
                    const order = threadInfo?.order;
                    const isAdminMessage = message.sender_id !== order?.user_id && message.sender_id !== order?.employee_id;
                    const senderName =
                      message.sender_id === order?.user_id ? '依頼者'
                      : message.sender_id === order?.employee_id ? '代行者'
                      : '管理者';

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex flex-col">
                          {/* 送信者名（自分以外の場合表示） */}
                          {!isMine && (
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-xs text-gray-500">{senderName}</span>
                              {isAdminMessage && (
                                <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded font-medium">管理者</span>
                              )}
                            </div>
                          )}
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isMine
                                ? isAdminMessage
                                  ? 'bg-red-500 text-white'
                                  : 'bg-purple-600 text-white'
                                : isAdminMessage
                                  ? 'bg-red-100 text-red-900 border border-red-300'
                                  : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isMine
                                  ? isAdminMessage ? 'text-red-200' : 'text-purple-200'
                                  : isAdminMessage ? 'text-red-400' : 'text-gray-500'
                              }`}
                            >
                              {new Date(message.created_at).toLocaleString()}
                            </p>
                          </div>
                          
                          {/* 【追加】既読表示 */}
                          {isLastMyMessage && message.read_at && (
                            <div className="text-xs text-gray-500 mt-1 text-right">
                              既読
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* メッセージ入力フォーム */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="メッセージを入力..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={sending || userProfile?.is_banned}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending || userProfile?.is_banned}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {sending ? (
                  <i className="ri-loader-4-line animate-spin"></i>
                ) : (
                  <i className="ri-send-plane-line"></i>
                )}
              </button>
            </form>
            
            {/* アカウント停止中の警告 */}
            {userProfile?.is_banned && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex">
                  <i className="ri-error-warning-line text-red-600 mr-2 mt-0.5"></i>
                  <div className="text-sm text-red-800">
                    <p className="font-medium">アカウント停止中</p>
                    <p>アカウント停止中のためメッセージを送信できません。</p>
                  </div>
                </div>
              </div>
            )}

            {/* 注意事項 */}
            {!userProfile?.is_banned && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex">
                  <i className="ri-shield-check-line text-yellow-600 mr-2 mt-0.5"></i>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">安全なやり取りのために</p>
                    <p>電話番号やSNSアカウント等の個人情報の交換はご遠慮ください。アカウント引き継ぎに必要なメールアドレスの共有は可能です。</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
