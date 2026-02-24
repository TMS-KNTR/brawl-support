# 初心者向け：あなたがやること一覧

このプロジェクトで「決済完了した依頼を従業員ダッシュボードに表示する」ために、**あなたが実際にやる作業**を、順番に説明します。

---

## 用語の説明（ざっくり）

| 用語 | 意味 |
|------|------|
| **Supabase** | このプロジェクトの「データベース＋認証＋サーバー機能」を提供しているサービスです。 |
| **Edge Function（エッジ関数）** | Supabase のサーバー上で動く小さなプログラム。ブラウザではなく「クラウド側」で実行されます。 |
| **デプロイ** | 自分のパソコンや GitHub にあるコードを、本番のサーバー（Supabase）にアップロードして「本番で動く状態」にすること。 |
| **Webhook（ウェブフック）** | 「〇〇が起きたら、このURLに通知して」という仕組み。Stripe が「決済が完了したよ」とあなたのサーバーに知らせるために使います。 |
| **push（プッシュ）** | 自分のパソコンにある「変更したコード」を、Git を使って GitHub のサイト上に送ること。Supabase は「GitHub に push された最新のコード」を見てデプロイします。 |

---

## ■ コードを GitHub に push する方法（初めての人向け）

「push からわからない」という方向けに、**最初に必要なもの**から**コマンドの意味**まで書きます。

### 事前に用意するもの

1. **GitHub アカウント**  
   まだなら [https://github.com](https://github.com) で「Sign up」から無料で作成。
2. **Git のインストール**  
   パソコンに Git が入っているか確認する：
   - スタートメニューで「PowerShell」や「コマンドプロンプト」を開く。
   - `git --version` と入力して Enter。  
   - バージョン番号が出れば OK。  
   - 「認識されていません」と出たら [Git for Windows](https://git-scm.com/download/win) からインストール。
3. **GitHub にリポジトリがあること**  
   - すでに「brawl-support」のようなリポジトリを GitHub で作ってある場合 → そのリポジトリに push します。  
   - まだ作っていない場合 → GitHub のサイトで「New repository」からリポジトリを作成（名前は例：`brawl-support`）。  
   - **「Add a README」は不要**（ローカルにコードがあるので）。

### push の流れ（3つのコマンド）

やることは次の3つだけです。

1. **add** … 「どのファイルを GitHub に送るか」を指定する  
2. **commit** … その内容を「1つの保存」として記録する  
3. **push** … その保存を GitHub のサイトに送る  

---

### 手順（Windows の場合）

#### 1. ターミナルを開く

- **Cursor / VS Code** を使っている場合：メニュー **ターミナル** → **新しいターミナル** で OK。
- または **スタートメニュー** → 「PowerShell」で開く。

#### 2. プロジェクトのフォルダに移動する

次のコマンドを **1行ずつ** 入力して Enter を押します（自分のフォルダの場合はパスを変えてください）。

```powershell
cd "c:\Users\ts621\OneDrive\デスクトップ\brawl-support"
```

`cd` は「このフォルダに移動する」という意味です。

#### 3. Git リポジトリにする（「not a git repository」と出た場合に必須）

**「fatal: not a git repository」と出た場合は、ここを必ず実行してください。**

まず、**プロジェクトのフォルダにいるか**確認します。

```powershell
cd "c:\Users\ts621\OneDrive\デスクトップ\brawl-support"
```

次に、このフォルダを Git のリポジトリにします。

```powershell
git init
```

「Initialized empty Git repository in ...」と出れば OK です。これで `.git` フォルダができ、ここが Git のリポジトリになりました。  
すでに `.git` がある場合は「Reinitialized」と出るか、何も出ないことがあります。その場合は次のステップへ進んでください。

#### 4. GitHub のリポジトリとつなぐ（初回のみ）

GitHub で作ったリポジトリの URL を使います。  
例：`https://github.com/あなたのユーザー名/brawl-support.git`

```powershell
git remote add origin https://github.com/あなたのユーザー名/brawl-support.git
```

すでに `origin` を追加している場合は「already exists」と出ることがあります。そのときはこのステップは飛ばして OK。

#### 5. 送りたいファイルを指定する（add）

「list-available-orders を GitHub に送る」場合：

```powershell
git add supabase/functions/list-available-orders/
```

「全部の変更を送りたい」場合：

```powershell
git add .
```

#### 6. コメント付きで保存する（commit）

```powershell
git commit -m "Add list-available-orders"
```

`-m "..."` の部分は「どんな変更か」のメモなので、自由に変えて大丈夫です（例：`"初回"` や `"Edge Function 追加"`）。

#### 7. GitHub に送る（push）

```powershell
git push -u origin main
```

- ブランチ名が **master** の場合は `git push -u origin master` にしてください。
- **初回だけ** GitHub にログインを求められることがあります。ブラウザが開いたら「Authorize」などで許可すると、次からはそのまま push できます。

ここまでで、GitHub のサイト（リポジトリのページ）を開くと、送ったコードが表示されているはずです。

---

### よくあること

| 状況 | 対処 |
|------|------|
| `git push` で「Permission denied」や「Authentication failed」 | GitHub にログインできていません。`git push` をもう一度実行して、表示される画面でログインするか、GitHub の **Settings** → **Developer settings** → **Personal access tokens** でトークンを作り、パスワードの代わりに使います。 |
| 「remote origin already exists」 | すでに GitHub とつながっています。**手順の 5〜7**（add → commit → push）だけやれば OK。 |
| ブランチ名が main か master かわからない | ターミナルで `git branch` と入力。`* main` なら main、`* master` なら master です。 |
| Supabase の「Choose GitHub Repository」でリポジトリを選ぶ | 手順 7 で push した**同じリポジトリ**（例：`あなたのユーザー名/brawl-support`）を選び、「Working directory」は空欄のままで OK。その後 **Enable integration** を押します。 |

---

## やること①：Edge Function をデプロイする（推奨）

### CLI は必須？ → いいえ

- **ダッシュボードで Git 連携している場合**  
  コードを **Git にプッシュするだけ**で、Supabase が自動でデプロイする（またはダッシュボードの「Deploy」で手動デプロイ）。**CLI は不要**です。
- **CLI を使う場合**  
  パソコンに Supabase CLI を入れて、`supabase functions deploy ...` を実行する方法。どちらか都合のよい方で大丈夫です。

### なぜ必要？

- 従業員が「受注可能な依頼」の一覧を見るとき、**データベースのセキュリティ（RLS）** のせいで一覧が空になることがあります。
- **list-available-orders** という Edge Function を本番に置いておくと、その一覧を「正しく」取得できるようになります。

### 手順A：Supabase のサイト（ダッシュボード）から行う【おすすめ】

**CLI は使いません。ブラウザで Supabase を開いて進めます。**

#### ステップ1：Supabase のサイトを開く

1. ブラウザで **https://supabase.com** を開く。
2. 右上の **Sign in** でログインする。
3. 自分の **プロジェクト**（brawl-support 用のプロジェクト）をクリックして開く。

#### ステップ2：Git 連携がされているか確認する

1. 左のメニューで **⚙️ Project Settings**（プロジェクト設定）をクリック。
2. 左のサブメニューで **Integrations** をクリック。
3. **GitHub** が「Connected」になっていれば、すでに連携済み。  
   - まだなら **Connect** を押して、GitHub アカウントとリポジトリを連携する（Supabase の案内に従う）。

※ Git 連携をしていない場合、Edge Functions は「Git のコード」からデプロイする仕組みのため、先に GitHub 連携が必要です。

#### ステップ3：コードを GitHub にプッシュする（新しい関数を追加した場合）

Supabase は「Git のリポジトリの内容」を元にデプロイします。  
`list-available-orders` をまだリポジトリに push していない場合は、**自分のパソコンで** push します。

→ **やり方がわからない場合は、下の「■ コードを GitHub に push する方法（初めての人向け）」を最初から読んでください。**

#### ステップ4：Supabase のサイトで Edge Functions を開く

1. 左のメニューで **Edge Functions** をクリック（🔷 アイコン付きのことが多い）。
2. 一覧に **list-available-orders** が出ているか確認する。
   - 出ていれば、Git 連携で自動デプロイされているか、前回のデプロイで含まれています。
   - 出ていなければ、**Deploy new function** や **Redeploy** などで「Git の main ブランチからデプロイ」を実行する（画面のボタン名はプロジェクトの設定により異なります）。

#### ステップ5：デプロイを実行する（必要な場合）

- **「Deploy from GitHub」や「Redeploy」** のようなボタンがあれば、それをクリックして「main ブランチの最新」でデプロイする。
- デプロイが終わると、一覧の **list-available-orders** の横に「Deployed」や緑のマークなどが表示されます。

#### まとめ（サイトからやるとき）

| 順番 | やること |
|------|----------|
| 1 | Supabase のサイトにログイン → 自分のプロジェクトを開く |
| 2 | **Project Settings** → **Integrations** で GitHub 連携を確認（未連携なら連携） |
| 3 | 新しい関数を追加したなら、ローカルで `git add` → `commit` → `push` |
| 4 | 左メニュー **Edge Functions** を開く |
| 5 | **Deploy / Redeploy** で最新のコードをデプロイする |

これで「Supabase のサイトから」の流れで完了します。CLI は不要です。

---

### 手順B：Supabase CLI を使う場合

1. **Supabase CLI を入れる（まだなら）**
   - [Supabase の公式ドキュメント](https://supabase.com/docs/guides/cli) の「Install the Supabase CLI」に従って、あなたのパソコンに Supabase CLI をインストールします。
   - ターミナル（PowerShell やコマンドプロンプト）で次のコマンドが動けばOKです。
     ```bash
     supabase --version
     ```

2. **Supabase にログインする**
   - ターミナルで次を実行します。
     ```bash
     supabase login
     ```
   - ブラウザが開くので、Supabase のアカウントでログインします。

3. **プロジェクトとつなぐ**
   - プロジェクトのフォルダ（`brawl-support`）に移動してから実行します。
     ```bash
     cd c:\Users\ts621\OneDrive\デスクトップ\brawl-support
     supabase link --project-ref あなたのプロジェクトID
     ```
   - 「プロジェクトID」は、Supabase のダッシュボード → プロジェクトを開く → **Settings** → **General** の **Reference ID** で確認できます。

4. **関数をデプロイする**
   - **必ずプロジェクトのルートフォルダ**（`brawl-support` の中。`supabase` フォルダが同じ階層に見える場所）で実行します。
     ```bash
     cd c:\Users\ts621\OneDrive\デスクトップ\brawl-support
     supabase functions deploy list-available-orders
     ```
   - 成功すると「Deployed function list-available-orders」のようなメッセージが出ます。

5. **Git 連携でデプロイしている場合（Supabase ダッシュボードからデプロイしている場合）**
   - エラー「Entrypoint path does not exist」が出る場合は、**新しい関数フォルダが GitHub などにプッシュされていない**可能性が高いです。
   - 次のように、プロジェクト内でコミット＆プッシュしてから、もう一度デプロイしてください。
     ```bash
     cd c:\Users\ts621\OneDrive\デスクトップ\brawl-support
     git add supabase/functions/list-available-orders/
     git commit -m "Add list-available-orders Edge Function"
     git push
     ```
   - その後、Supabase ダッシュボードで「Redeploy」するか、もう一度デプロイを実行してください。

### デプロイで「Entrypoint path does not exist」と出たとき

- **意味**: デプロイ時に、`supabase/functions/list-available-orders/index.ts` というファイルが見つかっていません。
- **対処**:
  1. **CLI でデプロイしている場合**  
     コマンドを実行している場所がプロジェクトの**ルート**か確認してください。  
     `brawl-support` フォルダに移動してから `supabase functions deploy list-available-orders` を実行します。
  2. **ダッシュボード（Git 連携）でデプロイしている場合**  
     `supabase/functions/list-available-orders/` を **Git に追加してコミットし、プッシュ**したうえで、再度デプロイしてください。リポジトリにファイルが無いと、Supabase 側で参照できません。
  3. **ファイルの存在確認**  
     エクスプローラーで次のパスに `index.ts` があるか確認してください。  
     `brawl-support\supabase\functions\list-available-orders\index.ts`

### デプロイしない場合

- デプロイしなくても、**「決済待ち（PAYMENT_PENDING）」の依頼が受注可能に表示される**ようにコード側は直してあります。
- ただし、**RLS で一覧が空になる環境**では、この Edge Function をデプロイしないと「受注可能」が空のままになる可能性があります。できるだけデプロイすることをおすすめします。

---

## やること②：Stripe の Webhook を設定する（本番で決済する場合）

### なぜ必要？

- お客様が Stripe で支払いを完了すると、**Stripe が「決済完了」をあなたのサーバーに通知**する必要があります。
- この通知（Webhook）を受け取ることで、注文の状態が「決済待ち」→「支払済（paid）」に更新され、依頼の表示や後の処理が正しく動きます。

### 手順の流れ（概要）

1. **Stripe のダッシュボードを開く**
   - ブラウザで [https://dashboard.stripe.com](https://dashboard.stripe.com) にアクセスし、ログインします。

2. **Webhook の「エンドポイント」を追加する**
   - 左メニューで **Developers** → **Webhooks** を開きます。
   - **Add endpoint** をクリックします。
   - **Endpoint URL** に、Supabase が用意している URL を入れます。形は次のとおりです。
     ```
     https://あなたのプロジェクトID.supabase.co/functions/v1/stripe-webhook
     ```
     「あなたのプロジェクトID」は、Supabase の **Settings** → **API** の **Project URL** の `https://xxxxx.supabase.co` の `xxxxx` の部分です。
   - **Listen to** で、少なくとも **checkout.session.completed** にチェックを入れます。
   - **Add endpoint** で保存します。

3. **署名シークレット（Signing secret）をコピーする**
   - 作成した Webhook の **Signing secret**（`whsec_...` で始まるもの）をコピーします。

4. **Supabase に秘密の値を登録する**
   - Supabase ダッシュボード → **Project Settings** → **Edge Functions**（または **Secrets**）を開きます。
   - **STRIPE_WEBHOOK_SECRET** という名前で、さきほどコピーした Signing secret の値を保存します。
   - これで、本番の `stripe-webhook` が「本当に Stripe から来た通知か」を検証できるようになります。

### テスト環境だけ使う場合

- テストモードでしか決済しない場合は、Stripe の **テスト用 Webhook** で同じように **checkout.session.completed** を選び、テスト用の Signing secret を **STRIPE_WEBHOOK_SECRET** に設定すれば大丈夫です。

---

## やること③：監査ログ用テーブル（admin_logs）を作る（まだなら）

以前の説明で「監査ログを admin_logs に統一した」話をしています。**まだ Supabase に `admin_logs` テーブルを作っていない場合**は、次のようにします。

1. Supabase ダッシュボードで、あなたのプロジェクトを開く。
2. 左メニューで **SQL Editor** を開く。
3. プロジェクト内の **supabase/migrations/20250224000000_create_admin_logs.sql** をエディタで開き、中身をすべてコピーする。
4. SQL Editor の入力欄に貼り付けて **Run** を押す。
5. エラーが出なければ、`admin_logs` テーブルが作成されています。管理者の「監査ログ」画面が使えるようになります。

---

## 困ったときの確認リスト

- **従業員ダッシュボードの「受注可能」が空のまま**
  - ① `list-available-orders` をデプロイしたか。
  - ② Supabase の **Table Editor** で `orders` を開き、`status` が `paid` や `PAYMENT_PENDING` の行が本当にあるか。
  - ③ `orders` テーブルに RLS がかかっている場合、ポリシーで「従業員が未割り当ての注文を読めるか」を確認する。

- **決済後に注文が「支払済」にならない**
  - ① Stripe の Webhook で **checkout.session.completed** を送る設定になっているか。
  - ② Webhook の URL が `https://xxxxx.supabase.co/functions/v1/stripe-webhook` になっているか。
  - ③ Supabase に **STRIPE_WEBHOOK_SECRET** を設定したか。
  - ④ Stripe の **Developers** → **Webhooks** で、そのエンドポイントの「最近の配信」に成功（200）が出ているか。

- **Supabase CLI が動かない**
  - Node.js が入っているか確認（`node -v`）。入っていなければ [Node.js の公式サイト](https://nodejs.org/) からインストールしてから、再度 `supabase --version` を試す。

---

## まとめ：最低限やるとよいこと

| やりたいこと | やること |
|--------------|----------|
| 決済完了した依頼を従業員に表示したい | ① **list-available-orders** のデプロイ（推奨）。② 本番で決済するなら **Stripe Webhook** の設定。 |
| 管理者の監査ログを使いたい | **admin_logs** テーブルを SQL で作成する。 |
| とりあえず動かしたい | コードの修正は済んでいるので、**PAYMENT_PENDING** の依頼は表示される。デプロイや Webhook は後からでもOK。 |

不明なところがあれば、「どの画面を開いて、どこがわからないか」をメモしておくと、次に調べたり誰かに聞いたりしやすくなります。
