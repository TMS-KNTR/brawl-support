# CLAUDE.md

## セキュリティ設計原則

このプロジェクトでは過去に複数回の脆弱性診断で繰り返し問題が見つかった経緯がある。以下の原則を必ず守ること。

### 1. クライアントを信頼しない
- 価格、ロール、ステータスなど、クライアントから送られる値はすべてサーバー側で再計算・検証する
- フロントエンドのルートガード（ProtectedRoute等）はUX用であり、セキュリティ境界ではない
- localStorageのキャッシュ（プロフィール、ロール）は表示用ヒントとして扱い、認可判定に使わない

### 2. Edge Function の認可チェック
- すべてのEdge Functionは`service_role`で動作するため、RLSはバイパスされる
- **関数内で必ず認可チェックを行う**（JWT検証 → プロフィール取得 → ロール確認 → is_banned確認）
- 管理者専用アクションは `profile.role === "admin"` を必ずチェック

### 3. SECURITY DEFINER 関数の制限
- `SECURITY DEFINER`関数は最小限にする
- 新規作成時は必ず `current_setting('role', true)` または `auth.uid()` で認可チェックを入れる
- パラメータに`user_id`を受け取る場合、`auth.uid()`と一致するか確認する（IDOR防止）

### 4. エラーメッセージの制御
- クライアントに返すエラーメッセージはホワイトリスト方式（safe messages パターン）を使う
- 内部エラー（DB、Stripe API等）は `console.error` でログし、クライアントには汎用メッセージを返す

### 5. レガシーコードの扱い
- 廃止したエンドポイントは410を返すだけでなく、次のリリースで関数ごと削除する
- 使われていないコードパスは残さない（将来の攻撃面になる）

### 6. 決済の整合性
- 決済金額は必ずサーバー側で計算する（`create-order-payment`のパターンに従う）
- 支払い処理には楽観ロック（`eq("is_paid_out", false)`等）を使い、二重処理を防止する
- 残高操作は`increment_balance` RPC経由で原子的に行う

## ビルド・デプロイ

- フロントエンド: `npx vite build` でビルド、Vercelで自動デプロイ（git push）
- Edge Functions: 変更後に `npx supabase functions deploy <function-name>` で手動デプロイが必要
- マイグレーション: Supabaseダッシュボードの SQL Editor で実行

### デプロイ順序（必ず守ること）

```
① DB マイグレーション適用（SQL Editor）
② Edge Functions デプロイ（supabase functions deploy）
③ フロントエンド デプロイ（git push）
```

DBスキーマを先に更新しないと、Edge Functionが存在しないカラムを参照してエラーになる。

## Edge Function 変更時のチェックリスト

Edge Functionはバグが起きやすい（DB・Stripe・認証すべてに依存するため）。変更・新規作成時は以下を必ず確認すること。

### DBスキーマとの整合性
- insert/update/selectで使用しているカラム名がDBに存在するか確認
- 新しいカラムを使う場合、マイグレーションを先に作成・適用する
- `supabase/migrations/` に対応するマイグレーションがあるか確認

### 認証・認可
- JWT認証が必要な関数か？（webhook系は不要 → `--no-verify-jwt` でデプロイ）
- 認可チェック: JWT検証 → プロフィール取得 → ロール確認 → is_banned確認
- Stripe webhook は署名検証（`stripe-signature` ヘッダー）で認証

### 環境変数
- 使用している環境変数がSupabase Edge Function Secretsに設定されているか
- テスト/本番の切り替え時: `STRIPE_SECRET_KEY` と `STRIPE_WEBHOOK_SECRET` を両方切り替える

### エラーハンドリング
- クライアントに返すエラーは safe messages パターンを使用
- 内部エラーの詳細はログのみ（`console.error`）

### Stripe関連
- テスト用キー（`sk_test_`）と本番用キー（`sk_live_`）の混在に注意
- Webhook署名シークレット（`whsec_`）はテストと本番で異なる
- テスト後は必ず本番キーに戻す

## 既知の注意事項

- `stripe-webhook` は `--no-verify-jwt` でデプロイする（StripeはJWTを送らない）
- スマホブラウザではWebSocketが使えない場合がある → ポーリングにフォールバック
- `create-checkout`, `create-payment` は廃止済み（410）→ `create-order-payment` を使用
