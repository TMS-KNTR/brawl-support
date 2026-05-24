# 代行者本人確認 要件定義

最終更新: 2026-05-24
ステータス: ドラフト（実装未着手）

## 1. 目的とスコープ

### 主目的（優先順）

1. **インサイダー・なりすまし対策** — 同業他社からのスパイ・偽装代行者を排除し、運営者の身元保護方針（旧X時代の素性と分離する戦略）と整合させる。
2. **業務委託契約の本人特定** — 契約相手が実在の自然人であることを担保し、損害賠償・守秘義務違反時の追及経路を確保する。
3. **将来の決済・税務対応の素地** — マイナンバー収集や支払調書発行が必要になった段階で、本人確認済みであれば追加負担が軽い。

### 非目的（このフェーズでは行わない）

- 犯収法ホ方式相当の厳格 eKYC（セルフィー撮影、ICチップ読み取り等）
- マイナンバー収集（規模拡大時に再検討）
- 顧客側の本人確認（代行者のみが対象）

## 2. 適用範囲

- **全代行者**（既存テスト代行者含む）。
- **期限なし**。督促はしない。ただし「**初回受注時に必須**」というゲート方式で、提出しないと稼げない構造にする。
- 本格運用後に督促コストが発生したら、「採用から30日以内未提出はアカウント停止」等の期限を後付け検討。

## 3. 収集する書類

### 必須

- **顔写真付き身分証 1点** のいずれか
  - 運転免許証（表＋裏）
  - マイナンバーカード（**表面のみ**。裏面の個人番号は撮影禁止と明記）
  - パスポート（顔写真ページ＋所持人記入欄）
  - 在留カード（表＋裏）

### 提出形式

- 画像ファイル（JPG/PNG/HEIC、各5MB以下）
- 1ファイル単位でアップロード
- 必要に応じて複数枚（表/裏）

### 収集しないもの（明記する）

- マイナンバー（個人番号）
- セルフィー（**将来検討事項**として保留）
- 住所証明書類

## 4. 検証フロー

### 代行者側

1. ダッシュボードに「本人確認」セクションが表示される（未提出状態がデフォルト）。
2. 提出フォームで身分証の種類を選択 → 必要な画像をアップロード。
3. 業務委託契約への同意チェックボックス。
4. 送信 → ステータスが `pending_review`（審査中）になる。
5. 審査結果（`approved` / `rejected`）が通知される。差戻し時は理由が表示される。

### 運営者（admin）側

1. admin ダッシュボードに「本人確認 審査キュー」が表示される。
2. 案件をクリックして画像を確認、フォーム入力内容（氏名・生年月日・住所）と一致するかチェック。
3. **承認** または **差戻し**（理由を選択：画像が不鮮明／氏名不一致／有効期限切れ／その他）を押す。
4. 承認時: `profiles.identity_verification_status = 'approved'`、`approved_at`/`approved_by` 記録。
5. 差戻し時: `rejected_reason` を保存し代行者に通知。再提出を促す。

### ステータス遷移

```
unsubmitted → pending_review → approved
                            ↘ rejected → unsubmitted（再提出可）
```

## 5. UI 要件

### 代行者ダッシュボード

#### 5.1 本人確認バナー

- 未提出/差戻し時: ダッシュボード上部に常時表示「本人確認を完了すると受注できます [提出する]」
- 審査中: 「本人確認を審査中です（通常1〜3営業日）」
- 承認済: バナー非表示

#### 5.2 受注ボタンのロック仕様（ハイブリッド方式）

注文一覧（`list-available-orders` の結果）では:

- **未承認の代行者にも注文は見える**（受注可能な仕事の存在を伝える）。
- 受注ボタンは表示するが、**灰色＋鍵アイコン**で視覚的にロック。
- ツールチップ: 「本人確認後に受注可能」
- クリック時: モーダルで「受注するには本人確認が必要です」→ 提出フローへ遷移ボタン

#### 5.3 提出フォーム

- ステップ1: 身分証の種類選択（ラジオボタン）
- ステップ2: 画像アップロード（プレビュー付き）
- ステップ3: 本人情報入力（氏名カナ・氏名漢字・生年月日・住所）
- ステップ4: 業務委託契約への同意（リンクで契約書全文表示）＋同意チェックボックス
- ステップ5: 確認画面 → 送信

### 管理者ダッシュボード

- `/dashboard/admin/identity-verifications`（新規ページ）
- 一覧: 提出日時、代行者名（仮名/ハンドル）、ステータス
- 詳細: 画像表示、フォーム入力値、承認/差戻しボタン
- 監査ログ（admin_logs）に承認・差戻しを記録

## 6. データモデル

### 新規テーブル

```sql
create table identity_verifications (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references profiles(id) on delete cascade,
  document_type text not null check (document_type in ('drivers_license', 'mynumber_card', 'passport', 'residence_card')),
  document_images jsonb not null,           -- Storage パスの配列
  full_name_kana text not null,
  full_name_kanji text not null,
  date_of_birth date not null,
  address text not null,
  agreement_accepted_at timestamptz not null default now(),
  status text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected')),
  rejected_reason text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_identity_verifications_employee on identity_verifications(employee_id);
create index idx_identity_verifications_status on identity_verifications(status) where status = 'pending_review';
```

### profiles テーブル変更

```sql
alter table profiles
  add column identity_verification_status text not null default 'unsubmitted'
    check (identity_verification_status in ('unsubmitted', 'pending_review', 'approved', 'rejected')),
  add column identity_verified_at timestamptz;
```

`identity_verifications` テーブルが履歴（再提出・差戻しの記録）、`profiles.identity_verification_status` が現在の状態。Edge Function で両者を同期する。

### RLS ポリシー

- `identity_verifications`
  - SELECT: 本人 OR admin
  - INSERT: 本人のみ、`employee_id = auth.uid()` を強制
  - UPDATE: admin のみ
  - DELETE: なし
- `profiles.identity_verification_status` は既存の sensitive columns 保護（`20250322000001_protect_profiles_sensitive_columns.sql`）と同じ方式で、admin のみが UPDATE 可能にする

## 7. ストレージ

### バケット設計

- **新規 private バケット**: `identity-documents`
- パス: `{employee_id}/{verification_id}/{filename}`
- 既存の `chat-attachments` private バケット方式（`20250318000001_storage_chat_attachments_private.sql`）を踏襲

### アクセス制御

- 認証なしの直URLアクセスは不可
- Edge Function 経由で signed URL を発行（有効期限5分）
- signed URL を発行できるのは admin のみ（提出本人すら再ダウンロード不可。再提出は新規アップロードで対応）

### 保管期間

- 承認済: 業務委託契約終了から **5年** 保管（労務関連書類の慣行）
- 差戻し済: 60日後に自動削除
- 削除は pg_cron で実行

## 8. Edge Function

### 新規

#### `submit-identity-verification`

- JWT 認証必須
- 本人（auth.uid()）のみ、`employee` ロール限定
- 既存の `pending_review` レコードがある場合はエラー
- 画像を Storage にアップロード → `identity_verifications` INSERT → `profiles.identity_verification_status = 'pending_review'`
- 全部 transaction で実施

#### `review-identity-verification`

- JWT 認証必須、`admin` ロール限定
- パラメータ: `verification_id`, `action` (`approve` | `reject`), `rejected_reason?`
- `identity_verifications` UPDATE → `profiles.identity_verification_status` 同期 → `notifications` に通知レコード作成 → `admin_logs` に記録

#### `get-identity-document-url`

- JWT 認証必須、`admin` ロール限定
- パラメータ: `verification_id`, `document_index`
- Storage の signed URL を返す（5分有効）

### 既存改修

#### `accept-order`（または受注に相当する Edge Function）

- 既存の認可チェックに加えて `profiles.identity_verification_status === 'approved'` を必須化
- 未承認時は `403 IDENTITY_VERIFICATION_REQUIRED` を返す
- フロント側でモーダル表示の判定に使う

#### `list-available-orders`

- 仕様変更なし（未承認代行者にも一覧を返す）
- レスポンスに代行者の `identity_verification_status` を含めてフロントでロック表示判定

## 9. セキュリティ要件

### CLAUDE.md セキュリティ原則との整合

- すべての Edge Function で JWT 検証 → プロフィール取得 → ロール確認 → is_banned 確認の順で認可
- クライアントから送信される `identity_verification_status` は信頼しない（サーバー側で都度参照）
- 受注処理は **サーバー側で必ず本人確認状態を再確認**（フロント側のボタンロックは UX 用）

### 書類画像の保護

- private バケット必須
- signed URL は5分有効、admin のみ発行可能
- アクセスログを admin_logs に記録（誰がいつどの書類を見たか）

### マイナンバーカード提出時の特殊扱い

- 提出フォームで「**裏面の個人番号は絶対に撮影しないでください**」を強調表示
- 万一裏面画像が提出された場合、admin は差戻し（理由「裏面画像の提出はお控えください」）

### 同業他社からの偵察対策

- 提出フォーム URL は認証必須かつ employee ロール限定（公開URLにしない）
- 差戻し理由は具体的すぎないテンプレ化（攻撃者が「どこを偽造すれば通るか」の手掛かりにしない）

## 10. 運営オペレーション

### 審査 SLA

- 通常1〜3営業日以内に審査
- 代行者向け表示文言: 「通常1〜3営業日で審査結果をお知らせします」

### 差戻し理由のテンプレ

- 画像が不鮮明
- 氏名が一致しない
- 有効期限切れ
- 裏面画像の提出はお控えください（マイナンバーカード）
- その他（自由記述、ただし攻撃示唆を避ける）

### 業務委託契約書

- 本人確認提出時に同意必須
- 内容: 守秘義務（違反金100万円）、競業避止（退任後2年）、SNS発信禁止、解除条項
- 契約書本文は `/legal/contractor-agreement` のような専用ページとして整備（別タスク）

### 保管・破棄手順

- 承認済書類は契約終了から5年保管
- 契約終了時に `identity_verifications.contract_terminated_at` を記録（将来カラム追加）
- pg_cron で定期的に保管期限切れレコードを削除（書類画像も Storage から削除）

## 11. 既存代行者への展開

### 現状

- 現在登録されているのは**テスト用代行者のみ**。
- そのため、機能リリース直後は強制提出督促は不要。

### 展開ステップ

1. 機能リリース
2. 現代行者（テスト用）に対して個別に提出を依頼
3. 本格運用開始時には全代行者が承認済の状態を維持
4. 新規採用時は本人確認提出を採用フローの一部として案内

## 12. 実装順序（CLAUDE.md デプロイ順序原則）

1. **DB マイグレーション適用**（SQL Editor）
   - `identity_verifications` テーブル作成
   - `profiles` に `identity_verification_status` / `identity_verified_at` 追加
   - RLS ポリシー
   - Storage バケット `identity-documents` 作成＋ポリシー
2. **Edge Functions デプロイ**
   - `submit-identity-verification`（新規）
   - `review-identity-verification`（新規）
   - `get-identity-document-url`（新規）
   - `accept-order`（受注関数の改修）
   - `list-available-orders`（レスポンス拡張）
3. **フロントエンドデプロイ**
   - 代行者ダッシュボードのバナー＋提出フォーム
   - 注文一覧の受注ボタンロックUI
   - 管理者ダッシュボードの審査キュー＋詳細画面
4. **動作確認**
   - 提出 → 審査 → 承認 → 受注可能になることを E2E で確認
   - 差戻し → 再提出フローも確認
   - 未承認状態で受注APIを直接叩いて 403 になることを確認（セキュリティ確認）

## 13. リスクと対応

| リスク | 対応 |
|---|---|
| 既存代行者が一斉に提出 → 審査が詰まる | 現状はテスト代行者のみなので問題なし。本格運用前に審査時間を計測してSLA調整 |
| 偽造身分証 | 完全には防げない。複数注文/出金の挙動と組み合わせて検知。重大な疑義は警察相談 |
| 画像の漏洩 | private バケット + signed URL 5分有効 + アクセスログで多層防御 |
| マイナンバー裏面が誤提出 | 提出フォームで強警告。誤提出時は admin が即差戻し＋画像即削除 |
| 代行者が提出を渋る | 受注ゲートで自然に提出インセンティブが働く |
| 業務委託契約書の準備が間に合わない | 契約書整備は本機能リリースの前提条件。先に整備する |

## 14. 将来検討事項

- **セルフィー併用**: なりすまし対策の補強。規模拡大時または不正提出が観測されたら導入
- **eKYC SaaS 移行**（TRUST DOCK 等）: 代行者数が増えて手動審査が重荷になったら検討
- **マイナンバー収集**: 支払調書発行が必要な売上規模に達したら別途検討
- **法人化後の対応**: 法人化時に契約主体が変わるので、本人確認データの引継ぎ方針を再設計
- **期限の導入**: 督促コストが見合わなくなったら「採用から30日以内未提出はアカウント停止」を追加

## 15. 関連ドキュメント・メモリ

- メモリ: `project_security_threat_model`（同業他社脅威モデル）
- メモリ: `project_business_structure`（友人との業務委託形式）
- メモリ: `project_platform_positioning`（プラットフォーム化ステータス）
- メモリ: `project_univapay_migration`（決済移行スケジュール）
- メモリ: `project_multigame_requirements`（マルチゲーム土台フェーズとの関係）
- CLAUDE.md（セキュリティ設計原則）
