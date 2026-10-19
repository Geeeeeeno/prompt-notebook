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

/** アプリロゴ（ノート + ペン + きらめき） */
export function logoSvg(opts = {}) {
  const size = opts.size || 36;
  const cls = opts.className ? ` class="${opts.className}"` : '';
  return `<svg${cls} width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="logoGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
      <stop stop-color="#9ae6ff"/>
      <stop offset="0.55" stop-color="#f6a6c8"/>
      <stop offset="1" stop-color="#c4a0ff"/>
    </linearGradient>
  </defs>
  <rect x="10" y="12" width="34" height="42" rx="5" stroke="url(#logoGrad)" stroke-width="2.2" fill="rgba(154,230,255,0.08)"/>
  <path d="M18 22h18M18 30h14M18 38h16" stroke="url(#logoGrad)" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
  <path d="M40 40l10-18 4 2-10 18-4.5.8L40 40z" fill="url(#logoGrad)" opacity="0.95"/>
  <path d="M48 20l1.2 2.6 2.6 1.2-2.6 1.2L48 27.6l-1.2-2.6-2.6-1.2 2.6-1.2L48 20z" fill="#fff6c8"/>
  <path d="M54 12l.8 1.7 1.7.8-1.7.8L54 17l-.8-1.7-1.7-.8 1.7-.8L54 12z" fill="#9ae6ff" opacity="0.9"/>
</svg>`;
}
