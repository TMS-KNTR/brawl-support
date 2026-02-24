import { useNavigate } from 'react-router-dom';
import Header from '../../home/components/Header';
import Footer from '../../home/components/Footer';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">利用規約</h1>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-red-800 mb-3">重要な注意事項</h2>
            <p className="text-red-700">
              本サービスはゲーム代行サービスであり、ゲーム運営会社の利用規約に抵触する可能性があります。
              サービスの利用は完全に自己責任となります。アカウントBAN等のリスクを十分にご理解の上ご利用ください。
            </p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第1条（適用）</h2>
          <p className="text-gray-700 mb-6">
            本利用規約（以下「本規約」）は、げむ助（以下「当サービス」）が提供するゲーム代行サービスの利用条件を定めるものです。
            ユーザーは本規約に同意した上で当サービスを利用するものとします。
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第2条（定義）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>本規約において、以下の用語は以下の意味を持ちます。</p>
            <p>・「依頼者」— 代行サービスを依頼するユーザー</p>
            <p>・「従業員」— 代行作業を実施するユーザー</p>
            <p>・「注文」— 依頼者が作成する代行依頼</p>
            <p>・「プラットフォーム」— 当サービスが提供するWebサイトおよび関連システム</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第3条（利用登録）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 利用登録はメールアドレスによる認証で完了します。</p>
            <p>2. 以下に該当する場合、登録をお断りすることがあります。</p>
            <p className="ml-4">・虚偽の情報を登録した場合</p>
            <p className="ml-4">・過去に規約違反で利用停止となった場合</p>
            <p className="ml-4">・13歳未満の場合</p>
            <p className="ml-4">・その他当サービスが不適切と判断した場合</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第4条（アカウント管理）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. ユーザーは自己の責任でアカウントを管理するものとします。</p>
            <p>2. アカウントの第三者への譲渡・貸与・共用は禁止します。</p>
            <p>3. 不正利用が発覚した場合、事前通知なくアカウントを停止することがあります。</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第5条（料金・支払い）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 代行料金はサービスページに表示された金額（税込）とします。</p>
            <p>2. 支払いはStripe決済（クレジットカード）による前払い制です。</p>
            <p>3. 決済完了後に注文が確定し、従業員が受注可能な状態になります。</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第6条（返金・キャンセル）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 作業開始前のキャンセル：全額返金（決済手数料を除く）</p>
            <p>2. 従業員都合による中止：全額返金</p>
            <p>3. 作業開始後のお客様都合：返金不可</p>
            <p>4. ゲーム運営によるBAN等：返金不可（リスク承知の上でのご利用のため）</p>
            <p>5. 目標未達成の場合：チャットで協議の上、部分返金または再作業</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第7条（禁止事項）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>ユーザーは以下の行為を行ってはなりません。</p>
            <p>・チャットでの個人情報（電話番号、SNS ID等）の交換（ただし、代行作業に必要なゲームアカウント情報・引き継ぎ用メールアドレスの共有は除く）</p>
            <p>・プラットフォーム外での直接取引</p>
            <p>・虚偽情報の登録</p>
            <p>・他のユーザーへの嫌がらせ、脅迫、誹謗中傷</p>
            <p>・システムへの不正アクセスや攻撃</p>
            <p>・複数アカウントの作成</p>
            <p>・法令または公序良俗に違反する行為</p>
            <p>・反社会的勢力への利益供与</p>
            <p>・その他、当サービスが不適切と判断する行為</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第8条（サービスの中断・停止）</h2>
          <p className="text-gray-700 mb-6">
            システムメンテナンス、天災、その他やむを得ない事由がある場合、事前の通知なくサービスの全部または一部を中断・停止できるものとします。
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第9条（利用制限・登録抹消）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>以下に該当する場合、事前通知なくアカウントの利用制限または登録抹消を行うことがあります。</p>
            <p>・本規約に違反した場合</p>
            <p>・登録情報に虚偽があった場合</p>
            <p>・不正行為が確認された場合</p>
            <p>・その他当サービスが不適切と判断した場合</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第10条（免責事項）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>当サービスは以下について一切の責任を負いません。</p>
            <p>・ゲーム運営会社による措置（BAN、アカウント停止等）</p>
            <p>・ゲーム内データの損失や変更</p>
            <p>・代行結果がユーザーの期待と異なる場合</p>
            <p>・ゲームのアップデートやサービス終了による影響</p>
            <p>・ユーザー間のトラブル（紛争解決の仕組みは提供します）</p>
            <p>・システム障害による一時的なサービス停止</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第11条（紛争解決）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. ユーザー間のトラブルはまずチャットでの話し合いにより解決を図ります。</p>
            <p>2. 解決しない場合は当サービス運営による仲裁を申し立てできます。</p>
            <p>3. 仲裁結果に異議がある場合は、運営者所在地を管轄する裁判所を専属的合意管轄とします。</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第12条（規約の変更）</h2>
          <p className="text-gray-700 mb-6">
            当サービスは必要に応じて本規約を変更できるものとします。重要な変更がある場合はサイト上で通知します。
            変更後もサービスを継続利用した場合、変更後の規約に同意したものとみなします。
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第13条（準拠法・管轄）</h2>
          <p className="text-gray-700 mb-6">
            本規約の解釈には日本法を準拠法とします。
          </p>

          <div className="mt-12 flex justify-center gap-6">
            <button onClick={() => navigate('/legal/privacy')} className="text-purple-600 hover:underline">
              プライバシーポリシー
            </button>
            <button onClick={() => navigate('/legal/compliance')} className="text-purple-600 hover:underline">
              特定商取引法に基づく表記
            </button>
          </div>

          <div className="mt-8 text-right text-gray-500 text-sm">
            <p>制定日：2026年2月18日</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
