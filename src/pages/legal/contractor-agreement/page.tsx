import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../../home/components/Header';
import Footer from '../../home/components/Footer';

export default function ContractorAgreementPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>業務委託契約書 | げむ助 - ゲームスキルマッチングプラットフォーム</title>
        <meta name="description" content="げむ助の提供者（代行者）向け業務委託契約書。守秘義務、勧誘禁止、本人確認等の条件を定めています。" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://gemusuke.com/legal/contractor-agreement" />
      </Helmet>
      <Header />

      <div className="max-w-4xl mx-auto px-4 pt-28 pb-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">業務委託契約書</h1>
          <p className="text-sm text-gray-500 mb-8">本契約書は、げむ助プラットフォーム上で提供者（代行者）として役務提供する方と当サービス運営者との間で締結される業務委託契約の内容を定めるものです。</p>

          <div className="text-gray-700 mb-8 space-y-2">
            <p>委託者（以下「委託者」という。げむ助運営者）と、受託者（以下「受託者」という）は、委託者が運営するゲームスキルマッチングプラットフォーム「げむ助」（以下「本プラットフォーム」という）における役務提供に関し、以下のとおり業務委託契約（以下「本契約」という）を締結する。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第1条（目的）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>本契約は、受託者が本プラットフォーム上で提供者として登録し、利用者からの依頼に応じて役務を提供することに関する委託者と受託者の権利義務を定めることを目的とする。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第2条（業務委託の性質）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 本契約は業務委託契約であり、委託者と受託者の間に雇用関係、労働者派遣関係、組合関係その他これに類する関係は一切存在しない。</p>
            <p>2. 受託者は独立した個人事業主として本業務を遂行するものとし、労働基準法、労働契約法、社会保険関係法令その他労働者保護法令は本契約に適用されない。</p>
            <p>3. 受託者は自らの判断と責任において業務を遂行し、業務の方法・時間・場所等について委託者の指揮命令を受けない。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第3条（業務内容）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 受託者は、本プラットフォームを通じて利用者から提示された依頼のうち、自らが受託することを選択したものについて、利用者と直接合意した内容に従い役務を提供する。</p>
            <p>2. 委託者は本プラットフォームの運営者として通信・決済・紛争解決の場を提供するに留まり、個別の役務提供の内容、方法、時間、結果について受託者に指示しない。</p>
            <p>3. 受託者は本プラットフォーム所定の運用規則（マニュアル、ガイドライン等）に従うものとする。当該運用規則は業務遂行の手段を制約するものではなく、プラットフォーム秩序維持を目的とする。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第4条（報酬と支払）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 受託者の報酬は本プラットフォーム所定の料率に基づき算定され、利用者からの入金確認後に受託者の残高に反映される。</p>
            <p>2. 受託者は本プラットフォームの出金機能を用いて、登録された受託者本人名義の銀行口座に出金申請することができる。</p>
            <p>3. 振込手数料は一律金145円とし、受託者の負担として出金額から控除する。</p>
            <p>4. 最低出金額は金1,000円とする。</p>
            <p>5. 報酬は受託者から委託者への請求書（本プラットフォーム上の出金申請をもって請求書に代える）に基づき支払う。</p>
            <p>6. 源泉徴収その他税務処理は、受託者自身の責任において行う。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第5条（経費負担）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>業務遂行に必要な通信費、端末、ソフトウェア、ゲームアカウント、ゲーム内通貨、その他の費用は、すべて受託者の負担とする。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第6条（秘密保持）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 受託者は、本契約に関連して知り得た以下の情報（以下「秘密情報」という）を、第三者に開示・漏洩してはならない。</p>
            <p className="ml-4">（1）利用者の氏名、ID、連絡先、ゲームアカウント情報、認証情報、チャット内容</p>
            <p className="ml-4">（2）委託者の運営方針、価格設定、内部マニュアル、システム構成、技術情報</p>
            <p className="ml-4">（3）委託者・関係者の個人情報、連絡手段、所在情報</p>
            <p className="ml-4">（4）他の受託者の存在、人数、氏名、連絡先、業務状況</p>
            <p className="ml-4">（5）本契約の存在および内容</p>
            <p>2. 受託者は秘密情報を本業務の遂行以外の目的に使用してはならない。</p>
            <p>3. 本条の義務は、本契約終了後も5年間存続する。</p>
            <p>4. 受託者が本条に違反した場合、委託者に対し違約金として金30万円を支払うものとし、これと別に委託者が被った実損害の賠償義務を負う。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第7条（勧誘禁止）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 受託者は、本契約期間中および本契約終了後6ヶ月間、本プラットフォームと同種または類似のサービス（ゲーム代行・ゲームスキルマッチング等）へ、本プラットフォームの受託者または利用者を勧誘してはならない。</p>
            <p>2. 本条は受託者が同種または類似のサービスにおいて自ら業務を行うこと、または第三者に役務提供することを制限するものではない。</p>
            <p>3. 本条に違反した場合、受託者は委託者が被った実損害を賠償する責任を負う。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第8条（SNS等での発信禁止）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 受託者は、業務内容、利用者情報、委託者・関係者の情報、本プラットフォームの運用に関する事項を、SNS、ブログ、動画配信、掲示板、その他公開の場で発信してはならない。</p>
            <p>2. 本プラットフォームを利用していること、受託者として登録されていることそれ自体を含め、本プラットフォームへの言及には事前に委託者の書面または所定方法による承諾を要する。</p>
            <p>3. 本条に違反した場合、受託者は委託者が被った実損害を賠償する責任を負う。委託者は本契約の解除その他必要な措置を講ずることができる。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第9条（受託者間の接触禁止）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 受託者は、本プラットフォームに登録された他の受託者と、本プラットフォームの公式機能の外で連絡を取ってはならない。</p>
            <p>2. 受託者は、他の受託者と業務上または業務外で組織化、結託、共同行為を行ってはならない。</p>
            <p>3. 本条は、本契約の締結以前から私的に知り合いであった者との関係を制限するものではないが、その場合でも秘密情報の交換、本プラットフォームに関する業務上の連絡、組織化は禁止する。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第10条（本人確認）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 受託者は、本プラットフォーム所定の方法により、顔写真付き身分証明書による本人確認を受けるものとする。</p>
            <p>2. 受託者は本人確認において真正な情報・書類のみを提出するものとし、虚偽の申告、他人名義の書類提出、加工・偽造を行ってはならない。</p>
            <p>3. 前項に違反した場合、委託者は本契約を即時解除でき、第14条第1項を適用する。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第11条（知的財産権）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 受託者が本業務の遂行において作成した成果物（チャット文章、画像、動画、その他のコンテンツ）に関する一切の権利（著作権法第27条および第28条の権利を含む）は、作成と同時に委託者に帰属する。</p>
            <p>2. 受託者は委託者および委託者が指定する者に対し、当該成果物に関する著作者人格権を行使しない。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第12条（禁止行為）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>受託者は以下の行為を行ってはならない。</p>
            <p className="ml-4">（1）利用者と本プラットフォームを介さずに直接取引を行うこと、または利用者に対し本プラットフォーム外での取引を勧誘・示唆すること</p>
            <p className="ml-4">（2）受託者アカウントを第三者に譲渡、貸与、共有すること</p>
            <p className="ml-4">（3）本業務を第三者に再委託すること</p>
            <p className="ml-4">（4）ゲーム運営会社の利用規約に反する行為を、それと知りながら利用者の依頼に応じて実行すること</p>
            <p className="ml-4">（5）利用者から預かったアカウント情報を本業務外の目的で使用すること</p>
            <p className="ml-4">（6）委託者または利用者を欺罔する行為、その他公序良俗に反する行為</p>
            <p className="ml-4">（7）委託者の業務・信用・名誉を毀損する行為</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第13条（損害賠償）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>受託者が本契約に違反し、または故意もしくは過失により委託者または利用者に損害を与えた場合、受託者は当該損害を賠償する責任を負う。本契約に違約金の定めがある場合も、これと別に実損害の賠償を妨げない。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第14条（解除）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 委託者は、受託者に以下の事由が生じた場合、何らの催告なく直ちに本契約を解除することができる。</p>
            <p className="ml-4">（1）第6条、第7条、第8条、第9条、第10条第2項、第12条のいずれかに違反したとき</p>
            <p className="ml-4">（2）第16条に定める反社会的勢力に該当することが判明したとき</p>
            <p className="ml-4">（3）差押え、仮差押え、破産、民事再生その他これに準じる手続の申立てがあったとき</p>
            <p className="ml-4">（4）その他本契約を継続し難い重大な事由が生じたとき</p>
            <p>2. 委託者および受託者は、相手方に対し書面または本プラットフォーム所定の方法により30日前に通知することにより、いつでも本契約を解除することができる。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第15条（契約終了後の措置）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 本契約終了時、受託者は速やかに以下を行う。</p>
            <p className="ml-4">（1）利用者から預かったすべてのアカウント情報、認証情報の削除</p>
            <p className="ml-4">（2）業務上保持していた秘密情報の削除または委託者への返還</p>
            <p className="ml-4">（3）受託者アカウントからのログアウト</p>
            <p>2. 本契約終了時点で未払いの報酬がある場合、委託者は通常の出金手続に従って支払う。ただし、受託者に第13条の損害賠償債務がある場合、委託者は当該債務と相殺できる。</p>
            <p>3. 第14条第1項により解除された場合、委託者は未払報酬の支払を留保し、損害賠償債務との相殺後の残額を支払う。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第16条（反社会的勢力の排除）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 受託者は、自らが暴力団、暴力団員、暴力団員でなくなった時から5年を経過しない者、暴力団準構成員、暴力団関係企業、総会屋等、社会運動等標榜ゴロまたは特殊知能暴力集団等、その他これらに準じる者（以下「反社会的勢力」という）に該当しないことを表明し、かつ将来にわたっても該当しないことを保証する。</p>
            <p>2. 受託者は反社会的勢力に対して資金提供、便宜供与その他一切の関与をしないことを保証する。</p>
            <p>3. 委託者は、受託者が前2項に違反したことが判明した場合、何らの催告なく直ちに本契約を解除でき、これによる受託者の損害について賠償責任を負わない。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第17条（個人情報の取扱）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 受託者は、業務上知り得た利用者の個人情報を、当該業務の遂行に必要な範囲でのみ利用するものとし、本契約終了時には速やかに削除する。</p>
            <p>2. 受託者は個人情報保護法その他関係法令を遵守する。</p>
            <p>3. 受託者は、委託者が定める個人情報取扱規程（プライバシーポリシー等）に従う。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第18条（契約期間）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>本契約は締結日（本プラットフォーム上で受託者が本契約への同意を行った日）から効力を生じ、第14条により解除されるまで有効に存続する。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第19条（契約の変更・承継）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 委託者は、本契約の内容を変更する必要がある場合、変更後の契約内容を本プラットフォーム所定の方法により受託者に通知し、受託者が変更後の契約に同意することをもって変更の効力を生じる。</p>
            <p>2. 受託者が変更後の契約に同意しない場合、第14条第2項に従い本契約を解除できる。</p>
            <p>3. 委託者が法人化、事業譲渡、合併その他の組織再編を行う場合、本契約上の地位を承継先に承継させることができ、受託者はこれにあらかじめ同意する。</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">第20条（準拠法・管轄）</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 本契約の準拠法は日本法とする。</p>
            <p>2. 本契約に関する一切の紛争は、委託者の所在地を管轄する地方裁判所を第一審の専属的合意管轄裁判所とする。</p>
          </div>

          <div className="text-gray-700 mt-10 mb-6 space-y-2 border-t border-gray-200 pt-8">
            <p>本契約への同意は、本プラットフォームの本人確認フロー内に設置された同意チェックボックスへのチェックをもって成立する。同意日時、同意者のアカウント情報および通信記録は、契約締結の証跡として委託者が保管する。</p>
          </div>

          <p className="text-sm text-gray-500 mt-8">最終改定日: 2026年5月24日</p>

          <div className="mt-12 flex justify-center">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              戻る
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
