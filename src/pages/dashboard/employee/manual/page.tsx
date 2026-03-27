import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import Header from '../../../home/components/Header';
import Footer from '../../../home/components/Footer';
import ProtectedRoute from '../../../../components/base/ProtectedRoute';

function normalizeRole(role: any): 'customer' | 'employee' | 'admin' | null {
  if (!role) return null;
  if (role === 'client') return 'customer';
  if (role === 'worker') return 'employee';
  if (role === 'customer' || role === 'employee' || role === 'admin') return role;
  return null;
}

export default function EmployeeManualPage() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <style>{`@keyframes manual-spin { to { transform: rotate(360deg); } }`}</style>
        <div className="text-center">
          <div className="relative w-8 h-8 mx-auto mb-3">
            <div className="absolute inset-0 border-2 border-[#E5E5E5] rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-[#111] rounded-full"
              style={{ animation: 'manual-spin 0.7s linear infinite' }} />
          </div>
          <p className="text-[12px] text-[#999]">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const role = normalizeRole(userProfile?.role);
  if (role !== 'employee' && role !== 'admin') {
    return <Navigate to="/dashboard/customer" replace />;
  }

  return (
    <ProtectedRoute allowedRoles={['employee', 'admin']}>
      <ManualContent />
    </ProtectedRoute>
  );
}

function ManualContent() {
  const navigate = useNavigate();

  const sections = [
    {
      id: 'setup',
      icon: 'ri-settings-3-line',
      title: '1. ログイン・初期設定',
      content: [
        {
          subtitle: 'ログイン',
          items: [
            'トップページ右上の「ログイン」からログインしてください。',
            '登録済みのメールアドレスとパスワードを入力します。',
          ],
        },
        {
          subtitle: '銀行口座の登録（Stripe Connect）',
          description: '報酬を受け取るために、銀行口座の登録が必要です。',
          items: [
            'ダッシュボードの「💰 残高」タブを開きます。',
            '「銀行口座を登録する」ボタンをクリックします。',
            'Stripe の画面に遷移するので、指示に従って情報を入力してください。',
            '登録完了後、ダッシュボードに戻ります。',
          ],
          table: {
            headers: ['ステータス', '意味'],
            rows: [
              ['未登録', 'まだ口座登録を開始していない'],
              ['登録途中', 'Stripe での手続きが途中'],
              ['審査中', 'Stripe で本人確認の審査中'],
              ['有効', '出金が可能な状態'],
            ],
          },
          note: '口座が「有効」になるまで出金はできません。早めに登録を済ませてください。',
        },
      ],
    },
    {
      id: 'dashboard',
      icon: 'ri-dashboard-line',
      title: '2. ダッシュボードの見方',
      content: [
        {
          subtitle: '',
          description: 'ダッシュボードには4つのタブがあります。',
          tabs: [
            { name: '受注可能', desc: 'まだ代行者が割り当てられていない案件の一覧。ゲーム名、ランク、報酬額が表示されます。' },
            { name: '自分の案件', desc: 'あなたが受注した案件の一覧。ステータスや進捗を確認できます。' },
            { name: '完了履歴', desc: '依頼者が完了を確認した案件の履歴。過去の実績を確認できます。' },
            { name: '💰 残高', desc: '現在の残高、出金申請、取引履歴を確認できます。' },
          ],
        },
      ],
    },
    {
      id: 'accept',
      icon: 'ri-checkbox-circle-line',
      title: '3. 案件の受注',
      content: [
        {
          subtitle: '受注手順',
          items: [
            '「受注可能」タブで案件一覧を確認します。',
            '案件の内容（ゲーム、ランク帯、報酬）を確認します。',
            '対応可能な案件の「この案件を受注する」ボタンをクリックします。',
            '受注が完了すると、自動的にチャットが作成されます。',
            '依頼者に受注通知が届きます。',
          ],
        },
        {
          subtitle: '報酬について',
          items: [
            '報酬額は注文金額の 80% です（プラットフォーム手数料 20%）。',
            '報酬額は案件一覧および詳細ページに表示されます。',
          ],
          warning: '受注後のキャンセルは原則できません。対応可能な案件のみ受注してください。',
        },
      ],
    },
    {
      id: 'workflow',
      icon: 'ri-flow-chart',
      title: '4. 作業の進め方',
      content: [
        {
          subtitle: 'ステータスの流れ',
          flow: [
            { status: '受注済', action: '「作業開始」ボタンを押す', color: '#2563EB' },
            { status: '作業中', action: '「作業完了」ボタンを押す', color: '#D97706' },
            { status: '完了報告済', action: '依頼者が確認', color: '#059669' },
            { status: '確認済', action: '自動で報酬が残高に反映', color: '#059669' },
          ],
        },
        {
          subtitle: '① 作業開始',
          items: [
            '「自分の案件」タブまたは案件詳細ページを開きます。',
            '「作業開始」ボタンをクリックします。',
            '依頼者に作業開始の通知が届きます。',
            'チャットで依頼者と連絡を取り、必要な情報（アカウント情報等）を受け取ります。',
          ],
        },
        {
          subtitle: '② 作業中',
          items: [
            '依頼内容に従って作業を進めます。',
            '進捗報告や質問はチャットで行ってください。',
            '問題が発生した場合は、すぐに依頼者またはサポートに連絡してください。',
          ],
        },
        {
          subtitle: '③ 作業完了',
          items: [
            '作業が完了したら「作業完了」ボタンをクリックします。',
            '依頼者に完了報告の通知が届きます。',
            '依頼者が内容を確認し、問題がなければ完了が確定します。',
          ],
          note: '目標達成時のスクリーンショットをチャットで送付してください。依頼者が完了を確認しやすくなり、トラブル防止にもつながります。',
        },
      ],
    },
    {
      id: 'chat',
      icon: 'ri-message-3-line',
      title: '5. チャット機能',
      content: [
        {
          subtitle: '基本操作',
          items: [
            '案件詳細ページの「チャットを開く」ボタンまたは「自分の案件」タブからチャットを開けます。',
            'テキストメッセージと画像の送信が可能です。',
          ],
        },
        {
          subtitle: '画像添付',
          items: [
            '対応形式：画像ファイル（JPEG, PNG 等）',
            '最大サイズ：5MB',
            '作業の進捗報告などにご活用ください。',
          ],
        },
        {
          subtitle: 'チャットでの禁止行為',
          description: '以下の内容はシステムにより自動検出・ブロックされます。',
          blocked: [
            { label: '個人情報の送信', detail: '電話番号、LINE ID、Discord ID、Twitter/Instagram アカウント等' },
            { label: '外部リンクの送信', detail: 'gametrade、twitter.com、discord.gg 等の外部URL' },
            { label: 'NGワード', detail: '管理者が設定した禁止ワード' },
          ],
          warning: '違反が検出された場合、管理者に自動報告されます。取引は必ずプラットフォーム内で完結させてください。',
        },
      ],
    },
    {
      id: 'payment',
      icon: 'ri-wallet-3-line',
      title: '6. 報酬・出金',
      content: [
        {
          subtitle: '報酬の受け取り',
          items: [
            '依頼者が作業完了を確認すると、ステータスが「確認済」になります。',
            '自動的にあなたの残高に報酬が加算されます。',
            '「💰 残高」タブで残高と取引履歴を確認できます。',
          ],
        },
        {
          subtitle: '出金申請',
          items: [
            '「💰 残高」タブを開きます。',
            '「出金申請」ボタンをクリックします。',
            '出金額を入力します（現在の残高が上限）。',
            '申請が送信されると、管理者の承認待ちになります。',
            '管理者が承認すると、登録済みの銀行口座に振り込まれます。',
          ],
        },
        {
          subtitle: '取引履歴の見方',
          table: {
            headers: ['種類', '表示', '意味'],
            rows: [
              ['報酬', '緑色（↑）', '案件完了による報酬の加算'],
              ['出金', '赤色（↓）', '出金申請'],
            ],
          },
          table2: {
            headers: ['ステータス', '意味'],
            rows: [
              ['completed', '処理完了'],
              ['pending', '処理待ち（管理者の承認待ち）'],
              ['rejected', '却下'],
            ],
          },
        },
      ],
    },
    {
      id: 'dispute',
      icon: 'ri-alarm-warning-line',
      title: '7. 問題発生時の対応',
      content: [
        {
          subtitle: '報告手順',
          description: '作業中に問題が発生した場合は、「問題を報告する」機能を使用してください。',
          items: [
            '案件詳細ページの「問題を報告する」ボタンをクリックします。',
            '理由を選択します（依頼者と連絡が取れない / 依頼内容が不明確 / アカウントにログインできない / 作業を継続できない理由がある / その他）。',
            '必要に応じて詳細を記入します。',
            '送信すると、管理者に報告が届きます。',
          ],
          note: '管理者が状況を確認し、適切な対応を行います。報告後も、チャットで依頼者への連絡を試みてください。',
        },
      ],
    },
    {
      id: 'rules',
      icon: 'ri-shield-check-line',
      title: '8. 注意事項・禁止行為',
      content: [
        {
          subtitle: '必ず守ること',
          rules: [
            { label: 'プラットフォーム内での取引', detail: 'すべてのやり取り・取引はプラットフォーム内で行ってください。' },
            { label: '迅速な対応', detail: '受注後はできるだけ早く作業を開始し、依頼者への返信も速やかに行ってください。' },
            { label: '正確な報告', detail: '作業開始・完了のステータス更新を忘れずに行ってください。' },
            { label: '丁寧なコミュニケーション', detail: '依頼者に対して丁寧な対応を心がけてください。' },
          ],
        },
        {
          subtitle: '禁止行為',
          prohibited: [
            'プラットフォーム外での直接取引・連絡先の交換',
            '依頼者のアカウント情報の不正利用・第三者への共有',
            '依頼者のアカウントを荒らす行為（意図的なトロフィー下げ、アカウント設定の改変等）',
            '受注後の無断放棄',
            '不正行為（チート、Bot の使用等）',
            '虚偽の完了報告',
          ],
          warning: '禁止行為が確認された場合、アカウントの即時停止（BAN）・未出金の報酬の一部または全部の没収・損害賠償の請求等の措置を取ることがあります。',
        },
      ],
    },
    {
      id: 'faq',
      icon: 'ri-question-line',
      title: 'よくある質問',
      content: [
        {
          faq: [
            { q: '受注した案件をキャンセルしたい場合は？', a: '「問題を報告する」から理由を選択して報告してください。管理者が対応します。' },
            { q: '報酬はいつ反映されますか？', a: '依頼者が作業完了を確認した時点で、自動的に残高に反映されます。' },
            { q: '出金にはどのくらい時間がかかりますか？', a: '管理者の承認後、Stripe 経由で銀行口座に振り込まれます。通常数営業日程度です。' },
            { q: '評価はどこで確認できますか？', a: 'ダッシュボードのヘッダー部分に平均評価と評価件数が表示されます。' },
            { q: '対応ゲームは何ですか？', a: '現在の対応ゲームは「受注可能」タブに表示される案件のゲームタイトルをご確認ください。' },
          ],
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header />

      {/* ═══ Page Header ═══ */}
      <section className="pt-[72px] border-b border-[#E5E5E5] bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 pb-6">
          <button
            onClick={() => navigate('/dashboard/employee')}
            className="inline-flex items-center gap-1.5 text-[12px] text-[#888] hover:text-[#111] transition-colors mb-4 cursor-pointer"
          >
            <i className="ri-arrow-left-s-line text-[14px]"></i>
            ダッシュボードに戻る
          </button>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[#111] tracking-tight">代行者マニュアル</h1>
          <p className="text-[13px] text-[#888] mt-1">業務の手順やルールを確認できます</p>
        </div>
      </section>

      {/* ═══ Table of Contents ═══ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        <div className="rounded-lg bg-white border border-[#E5E5E5] p-5 mb-6">
          <h2 className="text-[13px] font-bold text-[#111] mb-3">目次</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-[12px] text-[#666] hover:bg-[#F5F5F5] hover:text-[#111] transition-colors"
              >
                <i className={`${s.icon} text-[14px] text-[#999]`}></i>
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* ═══ Sections ═══ */}
        <div className="space-y-5 pb-20">
          {sections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="rounded-lg bg-white border border-[#E5E5E5] overflow-hidden"
            >
              {/* Section Header */}
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#F0F0F0] bg-[#FAFAFA]">
                <div className="w-7 h-7 rounded-md bg-[#111] flex items-center justify-center">
                  <i className={`${section.icon} text-[13px] text-white`}></i>
                </div>
                <h2 className="text-[15px] font-bold text-[#111]">{section.title}</h2>
              </div>

              {/* Section Content */}
              <div className="p-5 space-y-5">
                {section.content.map((block: any, bi: number) => (
                  <div key={bi}>
                    {block.subtitle && (
                      <h3 className="text-[13px] font-bold text-[#111] mb-2">{block.subtitle}</h3>
                    )}
                    {block.description && (
                      <p className="text-[12px] text-[#666] mb-3">{block.description}</p>
                    )}

                    {/* Ordered list items */}
                    {block.items && (
                      <ol className="space-y-1.5 mb-3">
                        {block.items.map((item: string, ii: number) => (
                          <li key={ii} className="flex items-start gap-2.5 text-[12px] text-[#444]">
                            <span className="shrink-0 w-5 h-5 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[10px] font-semibold text-[#999] mt-0.5">
                              {ii + 1}
                            </span>
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ol>
                    )}

                    {/* Tab descriptions */}
                    {block.tabs && (
                      <div className="space-y-2 mb-3">
                        {block.tabs.map((tab: any, ti: number) => (
                          <div key={ti} className="flex items-start gap-3 px-3.5 py-3 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0]">
                            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#111] text-white mt-0.5">
                              {tab.name}
                            </span>
                            <span className="text-[12px] text-[#666] leading-relaxed">{tab.desc}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Status flow */}
                    {block.flow && (
                      <div className="space-y-0 mb-3">
                        {block.flow.map((step: any, si: number) => (
                          <div key={si}>
                            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0]">
                              <span
                                className="shrink-0 w-2 h-2 rounded-full"
                                style={{ background: step.color }}
                              />
                              <span className="text-[12px] font-semibold text-[#111]">{step.status}</span>
                            </div>
                            {si < block.flow.length - 1 && (
                              <div className="flex items-center gap-2 pl-5 py-1">
                                <i className="ri-arrow-down-s-line text-[14px] text-[#CCC]"></i>
                                <span className="text-[10px] text-[#999]">{step.action}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Table */}
                    {block.table && (
                      <div className="overflow-x-auto mb-3">
                        <table className="w-full text-[12px]">
                          <thead>
                            <tr className="border-b border-[#E5E5E5]">
                              {block.table.headers.map((h: string, hi: number) => (
                                <th key={hi} className="text-left py-2 px-3 font-semibold text-[#666] bg-[#FAFAFA]">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {block.table.rows.map((row: string[], ri: number) => (
                              <tr key={ri} className="border-b border-[#F5F5F5]">
                                {row.map((cell: string, ci: number) => (
                                  <td key={ci} className="py-2 px-3 text-[#444]">{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Table 2 */}
                    {block.table2 && (
                      <div className="overflow-x-auto mb-3">
                        <table className="w-full text-[12px]">
                          <thead>
                            <tr className="border-b border-[#E5E5E5]">
                              {block.table2.headers.map((h: string, hi: number) => (
                                <th key={hi} className="text-left py-2 px-3 font-semibold text-[#666] bg-[#FAFAFA]">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {block.table2.rows.map((row: string[], ri: number) => (
                              <tr key={ri} className="border-b border-[#F5F5F5]">
                                {row.map((cell: string, ci: number) => (
                                  <td key={ci} className="py-2 px-3 text-[#444]">{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Blocked items */}
                    {block.blocked && (
                      <div className="space-y-1.5 mb-3">
                        {block.blocked.map((b: any, bi2: number) => (
                          <div key={bi2} className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA]/40">
                            <i className="ri-close-circle-line text-[13px] text-[#DC2626] mt-0.5 shrink-0"></i>
                            <div>
                              <span className="text-[12px] font-semibold text-[#991B1B]">{b.label}</span>
                              <p className="text-[11px] text-[#DC2626]/70 mt-0.5">{b.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Rules */}
                    {block.rules && (
                      <div className="space-y-1.5 mb-3">
                        {block.rules.map((r: any, ri: number) => (
                          <div key={ri} className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0]/40">
                            <i className="ri-check-line text-[13px] text-[#059669] mt-0.5 shrink-0"></i>
                            <div>
                              <span className="text-[12px] font-semibold text-[#166534]">{r.label}</span>
                              <p className="text-[11px] text-[#059669]/70 mt-0.5">{r.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Prohibited items */}
                    {block.prohibited && (
                      <div className="space-y-1.5 mb-3">
                        {block.prohibited.map((p: string, pi: number) => (
                          <div key={pi} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA]/40">
                            <i className="ri-forbid-line text-[13px] text-[#DC2626] shrink-0"></i>
                            <span className="text-[12px] text-[#991B1B]">{p}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* FAQ */}
                    {block.faq && (
                      <div className="space-y-3">
                        {block.faq.map((f: any, fi: number) => (
                          <div key={fi} className="px-4 py-3.5 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0]">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#111] text-white">Q</span>
                              <span className="text-[12px] font-semibold text-[#111]">{f.q}</span>
                            </div>
                            <div className="flex items-start gap-2 pl-0.5">
                              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#059669] text-white">A</span>
                              <span className="text-[12px] text-[#666] leading-relaxed">{f.a}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Note */}
                    {block.note && (
                      <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE]/40 mt-3">
                        <i className="ri-information-line text-[13px] text-[#2563EB] mt-0.5 shrink-0"></i>
                        <span className="text-[11px] text-[#1D4ED8]">{block.note}</span>
                      </div>
                    )}

                    {/* Warning */}
                    {block.warning && (
                      <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-lg bg-[#FFFBEB] border border-[#FCD34D]/40 mt-3">
                        <i className="ri-error-warning-line text-[13px] text-[#D97706] mt-0.5 shrink-0"></i>
                        <span className="text-[11px] text-[#92400E]">{block.warning}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
