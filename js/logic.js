/**
 * DOM非依存の純粋ロジック
 * プロンプト合成・パース・インポート/エクスポート・検索フィルタ
 */

export const APP_ID = 'prompt-notebook';
export const APP_VERSION = 1;

export const QUALITY_TAGS = new Set([
  'masterpiece',
  'best quality',
  'amazing quality',
  'very aesthetic',
  'absurdres',
  'highres',
  'high resolution',
  'newest',
  'detailed',
  'ultra detailed',
]);

/**
 * @typedef {{ tag: string, weight?: number }} WeightedTag
 * @typedef {{
 *   selected: WeightedTag[],
 *   qualityPosition?: 'start' | 'end',
 *   categoryOrder?: string[],
 *   tagCategoryMap?: Record<string, string>
 * }} ComposeOptions
 */

/**
 * タグ文字列を正規化（前後空白・連続空白）
 * @param {string} tag
 */
export function normalizeTag(tag) {
  return String(tag || '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * 重み付きタグを文字列化
 * @param {WeightedTag} item
 */
export function formatWeightedTag(item) {
  const tag = normalizeTag(item.tag);
  if (!tag) return '';
  const w = item.weight;
  if (w == null || Number.isNaN(w) || Math.abs(w - 1) < 1e-9) {
    return tag;
  }
  const rounded = Math.round(w * 100) / 100;
  return `(${tag}:${rounded})`;
}

/**
 * プロンプト文字列を WeightedTag[] にパース
 * 括弧強調・(tag:weight)・ネスト外のカンマ分割に対応
 * @param {string} text
 * @returns {WeightedTag[]}
 */
export function parsePrompt(text) {
  if (!text || !String(text).trim()) return [];
  const src = String(text).trim();
  const parts = [];
  let buf = '';
  let depth = 0;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '(') {
      depth++;
      buf += ch;
      continue;
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1);
      buf += ch;
      continue;
    }
    if ((ch === ',' || ch === '\n') && depth === 0) {
      const t = buf.trim();
      if (t) parts.push(t);
      buf = '';
      continue;
    }
    buf += ch;
  }
  const last = buf.trim();
  if (last) parts.push(last);

  return parts.map(parseOneTag).filter((t) => t.tag);
}

/**
 * @param {string} raw
 * @returns {WeightedTag}
 */
function parseOneTag(raw) {
  let s = raw.trim();
  let weight = 1;

  // 連続する外側括弧と :weight を剥がす
  while (true) {
    const m = s.match(/^\((.+):([0-9]*\.?[0-9]+)\)$/);
    if (m) {
      s = m[1].trim();
      weight *= Number(m[2]);
      continue;
    }
    const m2 = s.match(/^\((.+)\)$/);
    if (m2 && !m2[1].includes(',')) {
      // (tag) は 1.1 倍、((tag)) はさらに
      s = m2[1].trim();
      weight *= 1.1;
      continue;
    }
    const m3 = s.match(/^\[(.+)\]$/);
    if (m3 && !m3[1].includes(',')) {
      s = m3[1].trim();
      weight *= 0.9;
      continue;
    }
    break;
  }

  weight = Math.round(weight * 1000) / 1000;
  return { tag: normalizeTag(s), weight };
}

/**
 * 選択タグを Animagine 推奨順で組み立て
 * @param {WeightedTag[]} selected
 * @param {{ qualityPosition?: 'start'|'end', categoryOrder?: string[], tagCategoryMap?: Record<string,string> }} [options]
 */
export function composePrompt(selected, options = {}) {
  const qualityPosition = options.qualityPosition || 'end';
  const categoryOrder = options.categoryOrder || [
    'subject',
    'character',
    'clothing',
    'pose',
    'background',
    'lighting',
    'quality',
    'negative',
    'other',
  ];
  const tagCategoryMap = options.tagCategoryMap || {};

  const seen = new Set();
  /** @type {WeightedTag[]} */
  const unique = [];
  for (const item of selected || []) {
    const tag = normalizeTag(item.tag);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({
      tag,
      weight: item.weight == null ? 1 : item.weight,
    });
  }

  const buckets = new Map(categoryOrder.map((c) => [c, []]));
  if (!buckets.has('other')) buckets.set('other', []);

  for (const item of unique) {
    let cat = tagCategoryMap[item.tag.toLowerCase()] || tagCategoryMap[item.tag];
    if (!cat) {
      cat = QUALITY_TAGS.has(item.tag.toLowerCase()) || QUALITY_TAGS.has(item.tag)
        ? 'quality'
        : 'other';
    }
    if (!buckets.has(cat)) {
      buckets.get('other').push(item);
    } else {
      buckets.get(cat).push(item);
    }
  }

  /** @type {WeightedTag[]} */
  let ordered = [];
  const quality = buckets.get('quality') || [];
  for (const cat of categoryOrder) {
    if (cat === 'quality') continue;
    ordered = ordered.concat(buckets.get(cat) || []);
  }
  // categoryOrder に無いバケット
  for (const [cat, items] of buckets) {
    if (cat === 'quality' || categoryOrder.includes(cat)) continue;
    ordered = ordered.concat(items);
  }

  if (qualityPosition === 'start') {
    ordered = quality.concat(ordered);
  } else {
    ordered = ordered.concat(quality);
  }

  return ordered
    .map(formatWeightedTag)
    .filter(Boolean)
    .join(', ');
}

/**
 * タグのトグル（追加/除去）。weight 指定可。
 * @param {WeightedTag[]} selected
 * @param {string} tag
 * @param {number} [weight]
 * @returns {WeightedTag[]}
 */
export function toggleTag(selected, tag, weight = 1) {
  const norm = normalizeTag(tag);
  if (!norm) return [...(selected || [])];
  const key = norm.toLowerCase();
  const list = [...(selected || [])];
  const idx = list.findIndex((t) => normalizeTag(t.tag).toLowerCase() === key);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.push({ tag: norm, weight });
  }
  return list;
}

/**
 * 重みを調整。存在しなければ追加。
 * @param {WeightedTag[]} selected
 * @param {string} tag
 * @param {number} delta
 * @param {number} [min]
 * @param {number} [max]
 */
export function adjustTagWeight(selected, tag, delta, min = 0.1, max = 2.0) {
  const norm = normalizeTag(tag);
  const key = norm.toLowerCase();
  const list = [...(selected || [])];
  const idx = list.findIndex((t) => normalizeTag(t.tag).toLowerCase() === key);
  if (idx < 0) {
    list.push({ tag: norm, weight: clamp(1 + delta, min, max) });
  } else {
    const next = clamp((list[idx].weight ?? 1) + delta, min, max);
    list[idx] = { ...list[idx], weight: Math.round(next * 100) / 100 };
  }
  return list;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * プロンプト文字列の空白・カンマ正規化
 * @param {string} text
 */
export function normalizePromptText(text) {
  return composePrompt(parsePrompt(text), { qualityPosition: 'end' });
}

/**
 * エクスポート用データ構築（サムネは呼び出し側で dataURL 化して渡す）
 * @param {object[]} prompts
 * @param {string} [exportedAt]
 */
export function exportData(prompts, exportedAt = new Date().toISOString()) {
  return {
    app: APP_ID,
    version: APP_VERSION,
    exportedAt,
    prompts: (prompts || []).map(sanitizePromptForExport),
  };
}

function sanitizePromptForExport(p) {
  return {
    id: p.id,
    title: p.title ?? '',
    positive: p.positive ?? '',
    negative: p.negative ?? '',
    tags: Array.isArray(p.tags) ? [...p.tags] : [],
    seed: p.seed ?? null,
    steps: p.steps ?? null,
    cfg: p.cfg ?? null,
    sampler: p.sampler ?? '',
    scheduler: p.scheduler ?? '',
    width: p.width ?? null,
    height: p.height ?? null,
    memo: p.memo ?? '',
    favorite: Boolean(p.favorite),
    createdAt: p.createdAt ?? null,
    updatedAt: p.updatedAt ?? null,
    thumbnailDataUrl: p.thumbnailDataUrl ?? null,
  };
}

/**
 * インポート検証
 * @param {unknown} data
 * @returns {{ ok: true, data: object } | { ok: false, errors: string[] }}
 */
export function validateImport(data) {
  const errors = [];
  if (data == null || typeof data !== 'object') {
    return { ok: false, errors: ['ルートがオブジェクトではありません'] };
  }
  const root = /** @type {Record<string, unknown>} */ (data);
  if (root.app !== APP_ID) {
    errors.push(`app が "${APP_ID}" ではありません`);
  }
  if (root.version !== 1 && root.version !== APP_VERSION) {
    errors.push('version がサポート外です');
  }
  if (!Array.isArray(root.prompts)) {
    errors.push('prompts が配列ではありません');
    return { ok: false, errors };
  }

  const prompts = [];
  root.prompts.forEach((item, i) => {
    const e = validatePromptItem(item, i);
    if (e.length) {
      errors.push(...e);
    } else {
      prompts.push(normalizePromptItem(item));
    }
  });

  if (errors.length) {
    return { ok: false, errors, validCount: prompts.length, total: root.prompts.length };
  }
  return {
    ok: true,
    data: {
      app: APP_ID,
      version: APP_VERSION,
      exportedAt: typeof root.exportedAt === 'string' ? root.exportedAt : null,
      prompts,
    },
  };
}

function validatePromptItem(item, index) {
  const errors = [];
  const prefix = `prompts[${index}]`;
  if (item == null || typeof item !== 'object') {
    return [`${prefix}: オブジェクトではありません`];
  }
  if (typeof item.id !== 'string' || !item.id.trim()) {
    errors.push(`${prefix}: id が不正です`);
  }
  if (typeof item.title !== 'string') {
    errors.push(`${prefix}: title は文字列必須です`);
  }
  if (typeof item.positive !== 'string') {
    errors.push(`${prefix}: positive は文字列必須です`);
  }
  if (item.negative != null && typeof item.negative !== 'string') {
    errors.push(`${prefix}: negative は文字列である必要があります`);
  }
  if (item.tags != null && !Array.isArray(item.tags)) {
    errors.push(`${prefix}: tags は配列である必要があります`);
  }
  if (item.tags && Array.isArray(item.tags) && item.tags.some((t) => typeof t !== 'string')) {
    errors.push(`${prefix}: tags の要素は文字列である必要があります`);
  }
  return errors;
}

function normalizePromptItem(item) {
  return {
    id: String(item.id).trim(),
    title: String(item.title ?? ''),
    positive: String(item.positive ?? ''),
    negative: String(item.negative ?? ''),
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    seed: item.seed ?? null,
    steps: item.steps ?? null,
    cfg: item.cfg ?? null,
    sampler: item.sampler ?? '',
    scheduler: item.scheduler ?? '',
    width: item.width ?? null,
    height: item.height ?? null,
    memo: item.memo ?? '',
    favorite: Boolean(item.favorite),
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
    thumbnailDataUrl: item.thumbnailDataUrl ?? null,
  };
}

/**
 * 重複時のマージ
 * @param {object[]} existing
 * @param {object[]} incoming
 * @param {'overwrite'|'skip'|'duplicate'} mode
 */
export function mergeImport(existing, incoming, mode = 'skip') {
  const byId = new Map((existing || []).map((p) => [p.id, { ...p }]));
  let added = 0;
  let overwritten = 0;
  let skipped = 0;
  let duplicated = 0;

  for (const item of incoming || []) {
    const has = byId.has(item.id);
    if (!has) {
      byId.set(item.id, { ...item });
      added++;
      continue;
    }
    if (mode === 'overwrite') {
      byId.set(item.id, { ...item });
      overwritten++;
    } else if (mode === 'skip') {
      skipped++;
    } else if (mode === 'duplicate') {
      const newId = `${item.id}-copy-${Date.now()}-${duplicated}`;
      byId.set(newId, {
        ...item,
        id: newId,
        title: `${item.title || '無題'} (複製)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      duplicated++;
    }
  }

  return {
    prompts: Array.from(byId.values()),
    stats: { added, overwritten, skipped, duplicated },
  };
}

/**
 * 検索・タグAND・お気に入り・並び替え
 * @param {object[]} prompts
 * @param {{
 *   query?: string,
 *   tags?: string[],
 *   favoritesOnly?: boolean,
 *   sortBy?: 'updatedAt'|'createdAt'|'title',
 *   sortDir?: 'asc'|'desc'
 * }} filters
 */
export function searchFilter(prompts, filters = {}) {
  const query = (filters.query || '').trim().toLowerCase();
  const filterTags = (filters.tags || []).map((t) => t.toLowerCase());
  const favoritesOnly = Boolean(filters.favoritesOnly);
  const sortBy = filters.sortBy || 'updatedAt';
  const sortDir = filters.sortDir || 'desc';

  let list = (prompts || []).filter((p) => {
    if (favoritesOnly && !p.favorite) return false;
    if (filterTags.length) {
      const ptags = (p.tags || []).map((t) => String(t).toLowerCase());
      // タイトル/本文中のタグ文字列もヒット対象に含める
      const hay = `${p.positive || ''} ${p.negative || ''}`.toLowerCase();
      const ok = filterTags.every(
        (t) => ptags.includes(t) || hay.includes(t),
      );
      if (!ok) return false;
    }
    if (!query) return true;
    const blob = [
      p.title,
      p.positive,
      p.negative,
      p.memo,
      ...(p.tags || []),
    ]
      .join(' ')
      .toLowerCase();
    return blob.includes(query);
  });

  list = list.slice().sort((a, b) => {
    let av;
    let bv;
    if (sortBy === 'title') {
      av = (a.title || '').toLowerCase();
      bv = (b.title || '').toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    }
    av = a[sortBy] || '';
    bv = b[sortBy] || '';
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return list;
}

/** Animagine XL 4.0 推奨ネガティブ */
export const ANIMAGINE_NEGATIVE =
  'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry';

/** 推奨解像度プリセット */
export const RESOLUTION_PRESETS = [
  { label: '1024 × 1024', width: 1024, height: 1024 },
  { label: '832 × 1216', width: 832, height: 1216 },
  { label: '1216 × 832', width: 1216, height: 832 },
  { label: '896 × 1152', width: 896, height: 1152 },
  { label: '1152 × 896', width: 1152, height: 896 },
  { label: '768 × 1344', width: 768, height: 1344 },
  { label: '1344 × 768', width: 1344, height: 768 },
];

export const SAMPLERS = [
  'euler',
  'euler_ancestral',
  'dpmpp_2m',
  'dpmpp_2m_sde',
  'dpmpp_sde',
  'ddim',
  'uni_pc',
  'lcm',
];

export const SCHEDULERS = ['normal', 'karras', 'exponential', 'sgm_uniform', 'simple'];

/**
 * タグ辞書から category map を構築
 * @param {{ categories: { id: string, tags: { tag: string }[] }[] }} dictionary
 */
export function buildTagCategoryMap(dictionary) {
  /** @type {Record<string, string>} */
  const map = {};
  for (const cat of dictionary.categories || []) {
    for (const t of cat.tags || []) {
      map[t.tag.toLowerCase()] = cat.id;
      map[t.tag] = cat.id;
    }
  }
  return map;
}

/**
 * 新規プロンプトの雛形
 */
export function createEmptyPrompt(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: overrides.id || `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    title: '',
    positive: '',
    negative: '',
    tags: [],
    seed: -1,
    steps: 28,
    cfg: 5,
    sampler: 'euler_ancestral',
    scheduler: 'normal',
    width: 832,
    height: 1216,
    memo: '',
    favorite: false,
    createdAt: now,
    updatedAt: now,
    thumbnail: null,
    ...overrides,
  };
}

/**
 * 複製
 */
export function duplicatePrompt(prompt) {
  const now = new Date().toISOString();
  return {
    ...prompt,
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    title: `${prompt.title || '無題'} (複製)`,
    favorite: false,
    createdAt: now,
    updatedAt: now,
  };
}
