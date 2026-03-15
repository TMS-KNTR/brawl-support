-- ordersテーブルにnotesカラムを追加（依頼詳細の保存用）
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text;
