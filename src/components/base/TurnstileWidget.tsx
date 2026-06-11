import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

export type TurnstileWidgetHandle = {
  reset: () => void;
};

type Props = {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
};

/**
 * Cloudflare Turnstile ウィジェット共通ラッパー。
 * - VITE_TURNSTILE_SITE_KEY が未設定の場合は何もレンダリングしない（=CAPTCHA無し）
 *   → ローカル開発/未設定環境で詰まないようにするため
 * - 本番では必ず Vercel 環境変数に site key を設定する
 */
const TurnstileWidget = forwardRef<TurnstileWidgetHandle, Props>(function TurnstileWidget(
  { onSuccess, onError, onExpire },
  ref,
) {
  const instanceRef = useRef<TurnstileInstance | null>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      instanceRef.current?.reset();
    },
  }));

  if (!SITE_KEY) {
    if (import.meta.env.DEV) {
      console.warn('[Turnstile] VITE_TURNSTILE_SITE_KEY が未設定のため、CAPTCHA無効モードで動作します');
    }
    return null;
  }

  return (
    <div className="my-3 flex justify-center">
      <Turnstile
        ref={instanceRef}
        siteKey={SITE_KEY}
        onSuccess={onSuccess}
        onError={onError}
        onExpire={onExpire}
        options={{
          theme: 'light',
          language: 'ja',
        }}
      />
    </div>
  );
});

export default TurnstileWidget;

/**
 * Turnstile が有効化されているかを判定。
 * フォーム送信時のバリデーション（CAPTCHA未完了で送信を防ぐ）に使う。
 */
export function isTurnstileEnabled(): boolean {
  return Boolean(SITE_KEY);
}
