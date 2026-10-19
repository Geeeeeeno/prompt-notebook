/**
 * インライン SVG アイコン定義
 * 統一ストローク: 1.75, round caps/joins, viewBox 0 0 24 24
 */

const DEFAULT_ATTRS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.75',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
};

/** @type {Record<string, string>} パス内容（g内） */
export const ICON_PATHS = {
  search:
    '<circle cx="11" cy="11" r="6.5"/><path d="M16.2 16.2L20.5 20.5"/>',
  add: '<path d="M12 5v14M5 12h14"/>',
  copy: '<rect x="8.5" y="8.5" width="10" height="10" rx="2"/><path d="M6.5 15.5V6.5A2 2 0 0 1 8.5 4.5h9"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5z"/>',
  starFilled:
    '<path fill="currentColor" stroke="currentColor" d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5z"/>',
  trash:
    '<path d="M5 7h14M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7M10 11v5.5M14 11v5.5M7.5 7l.8 11a2 2 0 0 0 2 1.8h3.4a2 2 0 0 0 2-1.8l.8-11"/>',
  edit: '<path d="M4.5 16.5v3h3L19 8l-3-3L4.5 16.5z"/><path d="M14.5 6.5l3 3"/>',
  duplicate:
    '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M6 15V6.5A1.5 1.5 0 0 1 7.5 5H16"/>',
  tag: '<path d="M3.5 12.5V5.5A2 2 0 0 1 5.5 3.5h7l8 8-7 7-8-8z"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/>',
  image:
    '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M3.8 16.5l4.7-4.2 3.2 2.8 3.1-3.4 5.4 4.8"/>',
  download:
    '<path d="M12 4v11M7.5 11.5L12 16l4.5-4.5M5 19.5h14"/>',
  upload:
    '<path d="M12 16V5M7.5 9.5L12 5l4.5 4.5M5 19.5h14"/>',
  speakerOn:
    '<path d="M4.5 9.5v5h3.2L12.5 19V5L7.7 9.5H4.5z"/><path d="M16 9.2a3.2 3.2 0 0 1 0 5.6"/><path d="M18.2 7a5.5 5.5 0 0 1 0 10"/>',
  speakerOff:
    '<path d="M4.5 9.5v5h3.2L12.5 19V5L7.7 9.5H4.5z"/><path d="M16.5 9.5l4 4M20.5 9.5l-4 4"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  filter:
    '<path d="M4 6.5h16l-6.2 7.2v5.3L10.2 17v-3.3L4 6.5z"/>',
  install:
    '<path d="M12 3.5v10M8 10l4 4 4-4"/><rect x="4.5" y="16" width="15" height="4.5" rx="1.5"/>',
  back: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  chevronDown: '<path d="M6.5 9.5L12 15l5.5-5.5"/>',
  heart:
    '<path d="M12 19.5s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 7.5a3.8 3.8 0 0 1 7 2.8c0 4.8-7 9.2-7 9.2z"/>',
  spark: '<path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5L15 9M9 15l-2.5 2.5"/>',
  more: '<circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  minus: '<path d="M6 12h12"/>',
  plus: '<path d="M12 6v12M6 12h12"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 10.5V17M12 7.2v.2"/>',
  moon: '<path d="M16.5 14.5A6.5 6.5 0 0 1 9.2 5.8 7.2 7.2 0 1 0 16.5 14.5z"/>',
  // カテゴリ見出し用
  catQuality:
    '<path d="M12 3.5l2.2 4.6 5 .7-3.6 3.5.9 5.1L12 14.8 7.5 17.4l.9-5.1L4.8 8.8l5-.7L12 3.5z"/>',
  catSubject:
    '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 19.5c1.2-3.2 3.4-4.8 6.5-4.8s5.3 1.6 6.5 4.8"/>',
  catClothing:
    '<path d="M9 5.5l3-1.5 3 1.5 3.5 2.2-2 2.3h-1.2v8.5H8.7v-8.5H7.5l-2-2.3L9 5.5z"/>',
  catPose:
    '<circle cx="12" cy="5.5" r="2"/><path d="M12 8.5v5.5M8.5 11.5h7M9.5 20.5l2.5-6.5 2.5 6.5"/>',
  catBackground:
    '<path d="M4 16.5l4.5-5 3.2 3.2 3.5-4.2L20 16.5"/><path d="M4 19.5h16"/><circle cx="8.2" cy="8" r="1.5"/>',
  catLighting:
    '<path d="M12 3.5v2.5M12 18v2.5M4.5 12H7M17 12h2.5M6.5 6.5l1.8 1.8M15.7 15.7l1.8 1.8M17.5 6.5l-1.8 1.8M8.3 15.7l-1.8 1.8"/><circle cx="12" cy="12" r="3.2"/>',
  catNegative:
    '<circle cx="12" cy="12" r="8"/><path d="M8.5 8.5l7 7"/>',
};

/**
 * SVG 要素文字列を生成
 * @param {string} name
 * @param {{ className?: string, size?: number, label?: string, filled?: boolean }} [opts]
 */
export function iconSvg(name, opts = {}) {
  const path = ICON_PATHS[name];
  if (!path) {
    console.warn('Unknown icon:', name);
    return '';
  }
  const size = opts.size || 22;
  const cls = opts.className ? ` class="${opts.className}"` : '';
  const label = opts.label
    ? ` role="img" aria-label="${escapeAttr(opts.label)}"`
    : ' aria-hidden="true"';
  const attrs = Object.entries(DEFAULT_ATTRS)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
  return `<svg${cls} width="${size}" height="${size}" ${attrs}${label}>${path}</svg>`;
}

/**
 * 既存要素へアイコンを挿入
 * @param {HTMLElement|null} el
 * @param {string} name
 * @param {object} [opts]
 */
export function setIcon(el, name, opts = {}) {
  if (!el) return;
  el.innerHTML = iconSvg(name, opts);
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/** カテゴリ ID → アイコン名 */
export const CATEGORY_ICONS = {
  quality: 'catQuality',
  subject: 'catSubject',
  clothing: 'catClothing',
  pose: 'catPose',
  background: 'catBackground',
  lighting: 'catLighting',
  negative: 'catNegative',
};

/**
 * アプリロゴ: 見開きノート + 筆先 + 星のきらめき
 * @param {{ size?: number, className?: string }} [opts]
 */
export function logoSvg(opts = {}) {
  const size = opts.size || 40;
  const cls = opts.className ? ` class="${opts.className}"` : '';
  const uid = `logo${Math.random().toString(36).slice(2, 8)}`;
  return `<svg${cls} width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="${uid}-g" x1="6" y1="8" x2="58" y2="56" gradientUnits="userSpaceOnUse">
      <stop stop-color="#9ae6ff"/>
      <stop offset="0.5" stop-color="#f6a6c8"/>
      <stop offset="1" stop-color="#c4a0ff"/>
    </linearGradient>
    <linearGradient id="${uid}-ink" x1="40" y1="18" x2="54" y2="48" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fff6c8"/>
      <stop offset="1" stop-color="#f6a6c8"/>
    </linearGradient>
    <filter id="${uid}-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="1.6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- 見開きノート -->
  <path d="M10 14c0-2 1.4-3.5 3.4-3.5H30v42.5H13.4C11.4 53 10 51.5 10 49.5V14z" fill="rgba(154,230,255,0.1)" stroke="url(#${uid}-g)" stroke-width="2" filter="url(#${uid}-glow)"/>
  <path d="M54 14c0-2-1.4-3.5-3.4-3.5H34v42.5h16.6c2 0 3.4-1.5 3.4-3.5V14z" fill="rgba(246,166,200,0.1)" stroke="url(#${uid}-g)" stroke-width="2" filter="url(#${uid}-glow)"/>
  <path d="M32 10.5v42.5" stroke="url(#${uid}-g)" stroke-width="1.6" opacity="0.7"/>
  <path d="M15 22h12M15 29h10M15 36h11" stroke="url(#${uid}-g)" stroke-width="1.7" stroke-linecap="round" opacity="0.75"/>
  <path d="M37 22h12M37 29h10M37 36h11" stroke="url(#${uid}-g)" stroke-width="1.7" stroke-linecap="round" opacity="0.55"/>
  <!-- 筆先 -->
  <path d="M42 44l9-16 3.2 1.8-9 16-4 .7 0.8-2.5z" fill="url(#${uid}-ink)" opacity="0.95"/>
  <path d="M51 28.2l2.2-3.8" stroke="#fff6c8" stroke-width="1.5" stroke-linecap="round"/>
  <!-- きらめき -->
  <path d="M48 14l1.1 2.4 2.4 1.1-2.4 1.1L48 21l-1.1-2.4-2.4-1.1 2.4-1.1L48 14z" fill="#fff6c8"/>
  <path d="M56 20l.7 1.5 1.5.7-1.5.7L56 24.4l-.7-1.5-1.5-.7 1.5-.7L56 20z" fill="#9ae6ff" opacity="0.95"/>
  <path d="M18 48l.6 1.3 1.3.6-1.3.6L18 51.8l-.6-1.3-1.3-.6 1.3-.6L18 48z" fill="#c4a0ff" opacity="0.85"/>
</svg>`;
}

/**
 * 検索0件・空一覧用イラスト
 * @param {{ size?: number, className?: string }} [opts]
 */
export function emptyStateSvg(opts = {}) {
  const size = opts.size || 140;
  const cls = opts.className ? ` class="${opts.className}"` : '';
  const uid = `empty${Math.random().toString(36).slice(2, 8)}`;
  return `<svg${cls} width="${size}" height="${size}" viewBox="0 0 160 160" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="${uid}-g" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
      <stop stop-color="#9ae6ff" stop-opacity="0.9"/>
      <stop offset="0.55" stop-color="#f6a6c8" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#c4a0ff" stop-opacity="0.9"/>
    </linearGradient>
    <radialGradient id="${uid}-orb" cx="50%" cy="45%" r="50%">
      <stop stop-color="rgba(154,230,255,0.2)"/>
      <stop offset="1" stop-color="rgba(154,230,255,0)"/>
    </radialGradient>
  </defs>
  <circle cx="80" cy="78" r="54" fill="url(#${uid}-orb)"/>
  <rect x="38" y="42" width="52" height="68" rx="6" stroke="url(#${uid}-g)" stroke-width="2.2" fill="rgba(18,24,48,0.55)"/>
  <rect x="70" y="48" width="52" height="68" rx="6" stroke="url(#${uid}-g)" stroke-width="2.2" fill="rgba(28,22,48,0.45)" transform="rotate(8 96 82)"/>
  <path d="M50 62h28M50 74h22M50 86h25" stroke="url(#${uid}-g)" stroke-width="1.8" stroke-linecap="round" opacity="0.7"/>
  <circle cx="118" cy="40" r="3" fill="#fff6c8" opacity="0.9"/>
  <circle cx="34" cy="56" r="2" fill="#9ae6ff" opacity="0.8"/>
  <path d="M108 108l14 14M122 108l-14 14" stroke="url(#${uid}-g)" stroke-width="2.2" stroke-linecap="round" opacity="0.55"/>
  <path d="M80 128c8 0 14 4 14 9s-6 9-14 9-14-4-14-9 6-9 14-9z" stroke="url(#${uid}-g)" stroke-width="1.6" fill="rgba(154,230,255,0.06)" opacity="0.7"/>
</svg>`;
}

/**
 * サムネなし時のプロンプトアート（星屑＋グラデ）
 * @param {{ hue: number, hue2: number, sat?: number, light?: number, width?: number, height?: number }} colors
 */
export function promptArtSvg(colors) {
  const { hue, hue2, sat = 55, light = 48 } = colors;
  const c1 = `hsl(${hue} ${sat}% ${light}%)`;
  const c2 = `hsl(${hue2} ${sat + 8}% ${Math.max(28, light - 10)}%)`;
  const c3 = `hsl(${(hue + 180) % 360} ${sat - 10}% ${light + 8}%)`;
  const uid = `art${((hue * 97 + hue2) % 100000)}`;
  // 決定的な星位置
  const stars = [];
  let seed = (hue * 7919 + hue2 * 104729) >>> 0;
  for (let i = 0; i < 14; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const x = 8 + (seed % 84);
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const y = 8 + (seed % 84);
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const r = 0.6 + (seed % 16) / 12;
    stars.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(255,255,255,${0.35 + (seed % 40) / 100})"/>`);
  }
  return `<svg class="prompt-art-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="${uid}-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
      <stop stop-color="${c1}"/>
      <stop offset="0.55" stop-color="${c2}"/>
      <stop offset="1" stop-color="${c3}" stop-opacity="0.85"/>
    </linearGradient>
    <radialGradient id="${uid}-v" cx="30%" cy="25%" r="70%">
      <stop stop-color="rgba(255,255,255,0.28)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" fill="url(#${uid}-bg)"/>
  <rect width="100" height="100" fill="url(#${uid}-v)"/>
  ${stars.join('')}
  <path d="M72 18l1.4 3 3 1.4-3 1.4-1.4 3-1.4-3-3-1.4 3-1.4L72 18z" fill="rgba(255,246,200,0.85)"/>
  <path d="M22 70l1 2.1 2.1 1-2.1 1L22 76.2l-1-2.1-2.1-1 2.1-1L22 70z" fill="rgba(154,230,255,0.75)"/>
</svg>`;
}
