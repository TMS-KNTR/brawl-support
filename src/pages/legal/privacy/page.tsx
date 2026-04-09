import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../../home/components/Header';
import Footer from '../../home/components/Footer';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>プライバシーポリシー | げむ助 - ゲームスキルマッチングプラットフォーム</title>
        <meta name="description" content="げむ助のプライバシーポリシー。個人情報の取扱い、収集する情報の種類、利用目的、第三者提供について定めています。" />
        <meta property="og:title" content="プライバシーポリシー | げむ助" />
        <meta property="og:description" content="げむ助のプライバシーポリシー。個人情報の取扱い・利用目的・第三者提供について。" />
        <meta property="og:url" content="https://gemusuke.com/legal/privacy" />
        <meta property="og:locale" content="ja_JP" />
        <meta property="og:image" content="https://gemusuke.com/og-image.png" />
        <link rel="canonical" href="https://gemusuke.com/legal/privacy" />
      </Helmet>
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>

          <p className="text-sm text-gray-500 mb-8 border-l-2 border-gray-300 pl-4">
            げむ助（以下「当サービス」といいます）は、ユーザーの個人情報の保護を重要な責務と認識し、
            個人情報の保護に関する法律（以下「個人情報保護法」といいます）その他の関連法令を遵守し、
            以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第1条（個人情報の定義）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>本ポリシーにおいて「個人情報」とは、個人情報保護法第2条第1項に定める個人情報をいい、生存する個人に関する情報であって、氏名、メールアドレス、その他の記述等により特定の個人を識別できるもの、および個人識別符号が含まれるものをいいます。</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第2条（個人情報の収集方法）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>当サービスは、以下の方法により個人情報を収集します。</p>
            <p>1. ユーザーがアカウント登録、注文、お問い合わせ等を行う際に直接ご提供いただく情報</p>
            <p>2. サービスの利用に伴い自動的に収集される情報（アクセスログ、IPアドレス、ブラウザ情報、Cookie情報等）</p>
            <p>3. 決済サービス（UnivaPay社）を通じて取得する決済に関する情報</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第3条（収集する情報の種類）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>当サービスが収集する個人情報は以下のとおりです。</p>
            <p>1. <strong>アカウント情報</strong> — メールアドレス、ユーザー名</p>
            <p>2. <strong>注文情報</strong> — 注文内容、取引に必要な範囲で提供された情報</p>
            <p>3. <strong>決済情報</strong> — UnivaPay社を通じた決済記録（クレジットカード番号等の決済情報は当サービスのサーバーには一切保存されません）</p>
            <p>4. <strong>チャット情報</strong> — サービス内でのメッセージ内容および送信された画像</p>
            <p>5. <strong>利用ログ</strong> — アクセス日時、IPアドレス、ブラウザの種類、参照元URL</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第4条（個人情報の管理）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>当サービスは、ユーザーの個人情報の正確性を保ち、これを安全に管理するために以下の措置を講じています。</p>
            <p>1. SSL/TLS暗号化通信の使用</p>
            <p>2. アカウント情報の暗号化保存</p>
            <p>3. 不正アクセスの監視・防止措置</p>
            <p>4. 個人情報へのアクセス権限の制限</p>
            <p>5. 個人情報の取扱いに関する従業者への教育・啓発</p>
            <p>また、個人情報の取扱いの全部または一部を外部に委託する場合は、委託先に対して適切な監督を行います。</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第5条（個人情報の利用目的）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>当サービスが取得した個人情報は、以下の目的で利用します。</p>
            <p>1. 当サービスの提供・運営のため</p>
            <p>2. ユーザーからのお問い合わせに対応するため</p>
            <p>3. 本人確認および不正利用の防止のため</p>
            <p>4. 料金の請求・決済処理のため</p>
            <p>5. 注文に関する提供者との情報共有のため</p>
            <p>6. 紛争・トラブルの解決のため</p>
            <p>7. 利用規約に違反する行為への対応のため</p>
            <p>8. サービスの改善、新機能の開発、利用状況の分析のため</p>
            <p>9. メンテナンス、重要なお知らせなどの通知のため</p>
            <p>10. その他、上記各利用目的に付随する目的のため</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第6条（個人情報の第三者への開示・提供）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>当サービスは、以下の場合を除き、あらかじめユーザーの同意を得ることなく個人情報を第三者に提供しません。</p>
            <p>1. 法令に基づく場合</p>
            <p>2. 人の生命、身体または財産の保護のために必要がある場合であって、ユーザーの同意を得ることが困難であるとき</p>
            <p>3. 公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、ユーザーの同意を得ることが困難であるとき</p>
            <p>4. 国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、ユーザーの同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</p>
            <p>5. 決済処理に必要な範囲でUnivaPay社に提供する場合</p>
            <p>6. サービスの履行に必要な範囲で提供者に注文情報を開示する場合</p>
            <p>7. 合併その他の事由による事業の承継に伴い個人情報を提供する場合</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第7条（決済情報の取扱い）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>当サービスでは、決済処理にUnivaPay社のシステムを利用しています。決済情報の取扱いについて以下のとおり定めます。</p>
            <p>1. クレジットカード番号等の決済手段に関する情報は、当サービスのサーバーには一切保存されません</p>
            <p>2. すべての決済情報はUnivaPay社により安全に管理されます</p>
            <p>3. UnivaPay社はPCI DSS（Payment Card Industry Data Security Standard）に準拠した高いセキュリティ基準で決済情報を保護しています</p>
            <p>4. UnivaPay社のプライバシーポリシーについては、同社のウェブサイトをご確認ください</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第8条（ユーザー間でやり取りされる情報の取扱い）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>ユーザー間の取引に際してやり取りされる情報については、以下のとおり定めます。</p>
            <p>1. 取引に必要な最小限の情報のみをユーザー間でやり取りすることを推奨します</p>
            <p>2. 提供者は受領した情報をサービスの履行以外の目的で使用してはなりません</p>
            <p>3. 取引完了後は、速やかにアクセス権を無効化することを推奨します</p>
            <p>4. ユーザー間でやり取りされた情報は、当サービス外の目的で利用いたしません</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第9条（Cookie等の使用）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>当サービスでは、以下の目的でCookieおよび類似の技術を使用します。</p>
            <p>1. ログイン状態の維持・セッション管理</p>
            <p>2. ユーザー設定の保存</p>
            <p>3. セキュリティの確保</p>
            <p>4. サービスの利用状況の分析・改善</p>
            <p className="mt-2">Cookieの使用を希望されない場合は、ブラウザの設定により無効にすることができます。ただし、Cookieを無効にした場合、当サービスの一部の機能が正常に動作しない場合があります。</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第10条（個人情報の開示請求）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>ユーザーは、当サービスに対して、個人情報保護法の定めに基づき、自己の個人情報の開示を請求することができます。当サービスは、本人確認を行ったうえで、遅滞なく開示を行います。ただし、以下の場合は開示の全部または一部をお断りすることがあります。</p>
            <p>1. 本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</p>
            <p>2. 当サービスの業務の適正な実施に著しい支障を及ぼすおそれがある場合</p>
            <p>3. 他の法令に違反することとなる場合</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第11条（個人情報の訂正・削除）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. ユーザーは、当サービスが保有する自己の個人情報が誤った情報である場合には、当サービスに対して個人情報の訂正、追加または削除（以下「訂正等」といいます）を請求することができます。</p>
            <p>2. 当サービスは、前項の請求を受けた場合、遅滞なく必要な調査を行い、その結果に基づき個人情報の訂正等を行います。</p>
            <p>3. ユーザーはアカウントの削除を申請することにより、関連する個人情報の消去を請求することができます。</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第12条（個人情報の利用停止等）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>当サービスは、ユーザーから個人情報が利用目的の範囲を超えて取り扱われている、または不正の手段により取得されたものであるとの理由により、利用の停止または消去（以下「利用停止等」といいます）を求められた場合、遅滞なく必要な調査を行い、その結果に基づき個人情報の利用停止等を行います。</p>
            <p>ただし、個人情報の利用停止等に多額の費用を要する場合その他の利用停止等を行うことが困難な場合であって、ユーザーの権利利益を保護するために必要な代替措置をとれる場合は、この代替措置をとるものとします。</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第13条（開示等の請求手続き）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>第10条から第12条に基づく請求は、以下のお問い合わせ先までメールにてご連絡ください。本人確認のため、登録済みのメールアドレスからの送信をお願いいたします。</p>
            <p>お問い合わせ先：<a href="mailto:gemusuke.official@gmail.com" className="text-purple-600 hover:underline">gemusuke.official@gmail.com</a></p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第14条（免責事項）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 当サービスからリンクされた外部サイトにおける個人情報の取扱いについては、当サービスは一切の責任を負いません。</p>
            <p>2. ユーザーが自ら他のユーザーに個人情報を開示した場合（チャット等で送信した場合を含みます）、当サービスはその情報の管理について責任を負いません。</p>
            <p>3. ユーザーのメールアドレス、パスワード等の管理はユーザー自身の責任とし、これらの不正利用によって生じた損害について、当サービスは故意または重大な過失がある場合を除き責任を負いません。</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第15条（本ポリシーの変更）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 本ポリシーの内容は、法令の変更、サービス内容の変更その他の事由により、ユーザーに通知することなく変更することがあります。</p>
            <p>2. 変更後のプライバシーポリシーは、当サービスのウェブサイト上に掲載した時点から効力を生じるものとします。</p>
            <p>3. 当サービスは、本ポリシーを変更する場合、変更内容に応じてウェブサイト上での告知その他適切な方法により周知します。</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第16条（お問い合わせ）</h2>
          <div className="text-gray-700 mb-6 space-y-1">
            <p>本ポリシーに関するお問い合わせは、下記までご連絡ください。</p>
            <p className="mt-2">サービス名：げむ助（GEMUSUKE）</p>
            <p>メール：<a href="mailto:gemusuke.official@gmail.com" className="text-purple-600 hover:underline">gemusuke.official@gmail.com</a></p>
          </div>

          <div className="mt-12 flex justify-center gap-6">
            <button onClick={() => navigate('/legal/terms')} className="text-purple-600 hover:underline">
              利用規約
            </button>
            <button onClick={() => navigate('/legal/compliance')} className="text-purple-600 hover:underline">
              特定商取引法に基づく表記
            </button>
          </div>

          <div className="mt-8 text-right text-gray-500 text-sm">
            <p>制定日：2026年2月18日</p>
            <p>改定日：2026年4月9日</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
