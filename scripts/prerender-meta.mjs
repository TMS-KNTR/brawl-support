/**
 * ビルド後にルートごとの index.html を生成するスクリプト。
 *
 * Vite SPA は単一の index.html を返すため、クローラーが JavaScript を
 * 実行しないと各ページ固有の <title> や OG タグを読めない。
 * このスクリプトは dist/index.html をテンプレートにして、
 * 公開ルートごとにメタタグを差し替えた HTML を配置する。
 * Vercel はファイルシステムを優先するので、/games → dist/games/index.html が返る。
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

const BASE_URL = 'https://gemusuke.com';
const OG_IMAGE = 'https://gemusuke.com/og-image.png';

/** @type {Array<{path: string, title: string, description: string, ogTitle?: string, ogDescription?: string, jsonLd?: object[]}>} */
const routes = [
  {
    path: '/games',
    title: '対応ゲーム | げむ助 - ブロスタ代行サービス',
    description: 'げむ助が対応しているゲームタイトル一覧。Brawl Stars（ブロスタ）のトロフィー上げ・ランク上げ代行に対応中。',
    ogTitle: '対応ゲーム | げむ助',
    ogDescription: 'げむ助が対応しているゲームタイトル一覧。ブロスタの代行サービスを提供中。',
  },
  {
    path: '/login',
    title: 'ログイン | げむ助 - ブロスタ代行サービス',
    description: 'げむ助にログインして、ブロスタの代行依頼を管理しましょう。',
  },
  {
    path: '/register',
    title: '新規登録 | げむ助 - ブロスタ代行サービス',
    description: 'げむ助に無料登録。ブロスタのランク上げ・トロフィー上げ代行をすぐに依頼できます。',
  },
  {
    path: '/legal/terms',
    title: '利用規約 | げむ助 - ブロスタ代行サービス',
    description: 'げむ助の利用規約。ブロスタ代行サービスの利用条件、返金ポリシー、禁止事項等を定めています。',
  },
  {
    path: '/legal/privacy',
    title: 'プライバシーポリシー | げむ助 - ブロスタ代行サービス',
    description: 'げむ助のプライバシーポリシー。個人情報の取扱い、収集する情報の種類、利用目的について定めています。',
  },
  {
    path: '/legal/compliance',
    title: '特定商取引法に基づく表記 | げむ助 - ブロスタ代行サービス',
    description: 'げむ助の特定商取引法に基づく表記。販売業者情報、支払方法、返品・キャンセルポリシー等を掲載しています。',
  },
];

const template = readFileSync(join(distDir, 'index.html'), 'utf-8');

for (const route of routes) {
  const fullUrl = `${BASE_URL}${route.path}`;
  const ogTitle = route.ogTitle || route.title;
  const ogDesc = route.ogDescription || route.description;

  let html = template;

  // title
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${route.title}</title>`,
  );

  // meta description
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${route.description}" />`,
  );

  // canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${fullUrl}" />`,
  );

  // og:url
  html = html.replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${fullUrl}" />`,
  );

  // og:title
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${ogTitle}" />`,
  );

  // og:description
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${ogDesc}" />`,
  );

  const outDir = join(distDir, ...route.path.split('/').filter(Boolean));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html, 'utf-8');
  console.log(`  ✓ ${route.path}/index.html`);
}

console.log(`\nPrerendered meta tags for ${routes.length} routes.`);
