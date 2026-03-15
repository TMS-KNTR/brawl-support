/**
 * ブロスタ キャラクター（ブローラー）データ
 *
 * strength:
 *   'strong' = 強い（つよ）
 *   'normal' = 普通（ふつ）
 *   'weak'   = 弱い（よわ）
 */

export type BrawlerStrength = 'strong' | 'normal' | 'weak'

export type Brawler = {
  id: string
  name: string
  strength: BrawlerStrength
}

export const BRAWLERS: Brawler[] = [
  { id: 'shelly',          name: 'シェリー',           strength: 'strong' },
  { id: 'nita',            name: 'ニタ',               strength: 'strong' },
  { id: 'colt',            name: 'コルト',             strength: 'normal' },
  { id: 'bull',            name: 'ブル',               strength: 'strong' },
  { id: 'brock',           name: 'ブロック',           strength: 'normal' },
  { id: 'el-primo',        name: 'プリモ',             strength: 'weak' },
  { id: 'barley',          name: 'バーリー',           strength: 'normal' },
  { id: 'poco',            name: 'ポコ',               strength: 'strong' },
  { id: 'rosa',            name: 'ローサ',             strength: 'weak' },
  { id: 'jessie',          name: 'ジェシー',           strength: 'weak' },
  { id: 'dynamike',        name: 'ダイナマイク',       strength: 'weak' },
  { id: 'tick',            name: 'ティック',           strength: 'weak' },
  { id: 'eight-bit',       name: '8ビット',            strength: 'weak' },
  { id: 'rico',            name: 'リコ',               strength: 'strong' },
  { id: 'darryl',          name: 'ダリル',             strength: 'weak' },
  { id: 'penny',           name: 'ペニー',             strength: 'normal' },
  { id: 'carl',            name: 'カール',             strength: 'normal' },
  { id: 'jacky',           name: 'ジャッキー',         strength: 'weak' },
  { id: 'gus',             name: 'ガス',               strength: 'strong' },
  { id: 'bo',              name: 'ボウ',               strength: 'normal' },
  { id: 'emz',             name: 'EMZ',                strength: 'strong' },
  { id: 'stu',             name: 'ストゥー',           strength: 'normal' },
  { id: 'elizabeth',       name: 'エリザベス',         strength: 'weak' },
  { id: 'pam',             name: 'パム',               strength: 'normal' },
  { id: 'franken',         name: 'フランケン',         strength: 'strong' },
  { id: 'bibi',            name: 'ビビ',               strength: 'strong' },
  { id: 'bea',             name: 'ビー',               strength: 'normal' },
  { id: 'nani',            name: 'ナーニ',             strength: 'normal' },
  { id: 'edgar',           name: 'エドガー',           strength: 'weak' },
  { id: 'griff',           name: 'グリフ',             strength: 'normal' },
  { id: 'grom',            name: 'グロム',             strength: 'weak' },
  { id: 'bonnie',          name: 'ボニー',             strength: 'normal' },
  { id: 'gale',            name: 'ゲイル',             strength: 'weak' },
  { id: 'colette',         name: 'コレット',           strength: 'normal' },
  { id: 'belle',           name: 'ベル',               strength: 'strong' },
  { id: 'ash',             name: 'アッシュ',           strength: 'normal' },
  { id: 'lola',            name: 'ローラ',             strength: 'normal' },
  { id: 'sam',             name: 'サム',               strength: 'weak' },
  { id: 'mandy',           name: 'マンディー',         strength: 'normal' },
  { id: 'maisie',          name: 'メイジー',           strength: 'weak' },
  { id: 'hank',            name: 'ハンク',             strength: 'normal' },
  { id: 'pearl',           name: 'パール',             strength: 'weak' },
  { id: 'larry-lawrie',    name: 'ラリー＆ローリー',   strength: 'normal' },
  { id: 'angelo',          name: 'アンジェロ',         strength: 'normal' },
  { id: 'berry',           name: 'ベリー',             strength: 'normal' },
  { id: 'shade',           name: 'シェイド',           strength: 'normal' },
  { id: 'meeple',          name: 'ミープル',           strength: 'strong' },
  { id: 'trunk',           name: 'トランク',           strength: 'normal' },
  { id: 'mortis',          name: 'モーティス',         strength: 'strong' },
  { id: 'tara',            name: 'タラ',               strength: 'normal' },
  { id: 'gene',            name: 'ジーン',             strength: 'normal' },
  { id: 'max',             name: 'MAX',                strength: 'normal' },
  { id: 'mr-p',            name: 'ミスターP',          strength: 'weak' },
  { id: 'sprout',          name: 'スプラウト',         strength: 'weak' },
  { id: 'byron',           name: 'バイロン',           strength: 'strong' },
  { id: 'squeak',          name: 'スクウィーク',       strength: 'normal' },
  { id: 'lou',             name: 'ルー',               strength: 'normal' },
  { id: 'ruffs',           name: 'ラフス',             strength: 'strong' },
  { id: 'buzz',            name: 'バズ',               strength: 'weak' },
  { id: 'fang',            name: 'ファング',           strength: 'weak' },
  { id: 'eve',             name: 'イヴ',               strength: 'weak' },
  { id: 'janet',           name: 'ジャネット',         strength: 'normal' },
  { id: 'otis',            name: 'オーティス',         strength: 'strong' },
  { id: 'buster',          name: 'バスター',           strength: 'normal' },
  { id: 'gray',            name: 'グレイ',             strength: 'strong' },
  { id: 'rt',              name: 'R-T',                strength: 'strong' },
  { id: 'willow',          name: 'ウィロー',           strength: 'normal' },
  { id: 'doug',            name: 'ダグ',               strength: 'normal' },
  { id: 'chuck',           name: 'チャック',           strength: 'weak' },
  { id: 'charlie',         name: 'チャーリー',         strength: 'strong' },
  { id: 'mico',            name: 'ミコ',               strength: 'weak' },
  { id: 'melodie',         name: 'メロディー',         strength: 'normal' },
  { id: 'lily',            name: 'リリー',             strength: 'strong' },
  { id: 'clancy',          name: 'クランシー',         strength: 'normal' },
  { id: 'moe',             name: 'モー',               strength: 'normal' },
  { id: 'juju',            name: 'ジュジュ',           strength: 'normal' },
  { id: 'ollie',           name: 'オーリー',           strength: 'weak' },
  { id: 'lumi',            name: 'ルミ',               strength: 'normal' },
  { id: 'finx',            name: 'フィンクス',         strength: 'strong' },
  { id: 'jeyong',          name: 'ジェヨン',           strength: 'normal' },
  { id: 'ally',            name: 'アリー',             strength: 'strong' },
  { id: 'mina',            name: 'ミナ',               strength: 'strong' },
  { id: 'ziggy',           name: 'ジギー',             strength: 'normal' },
  { id: 'jiji',            name: 'ジジ',               strength: 'normal' },
  { id: 'glowy',           name: 'グローウィー',       strength: 'strong' },
  { id: 'spike',           name: 'スパイク',           strength: 'strong' },
  { id: 'crow',            name: 'クロウ',             strength: 'strong' },
  { id: 'leon',            name: 'レオン',             strength: 'strong' },
  { id: 'sandy',           name: 'サンディー',         strength: 'normal' },
  { id: 'amber',           name: 'アンバー',           strength: 'normal' },
  { id: 'meg',             name: 'メグ',               strength: 'normal' },
  { id: 'surge',           name: 'サージ',             strength: 'weak' },
  { id: 'chester',         name: 'チェスター',         strength: 'strong' },
  { id: 'cordelius',       name: 'コーデリアス',       strength: 'strong' },
  { id: 'kit',             name: 'キット',             strength: 'normal' },
  { id: 'draco',           name: 'ドラコ',             strength: 'normal' },
  { id: 'kenji',           name: 'ケンジ',             strength: 'normal' },
  { id: 'pierce',          name: 'ピアス',             strength: 'strong' },
  { id: 'kaze',            name: 'カゼ',               strength: 'strong' },
  { id: 'sirius',          name: 'シリウス',           strength: 'strong' },
]

/** 強さの日本語ラベル */
export const STRENGTH_LABELS: Record<BrawlerStrength, string> = {
  strong: '強い',
  normal: '普通',
  weak: '弱い',
}

/** 強さの色 */
export const STRENGTH_COLORS: Record<BrawlerStrength, string> = {
  strong: '#059669',
  normal: '#2563EB',
  weak: '#DC2626',
}
