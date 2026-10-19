/**
 * UI オーケストレーション
 */
import {
  getAllPrompts,
  putPrompt,
  deletePrompt,
  replaceAllPrompts,
  ensureSeedData,
  resizeImageToBlob,
  blobToDataUrl,
  dataUrlToBlob,
} from './db.js';
import {
  composePrompt,
  parsePrompt,
  toggleTag,
  adjustTagWeight,
  exportData,
  validateImport,
  mergeImport,
  searchFilter,
  ANIMAGINE_NEGATIVE,
  RESOLUTION_PRESETS,
  SAMPLERS,
  SCHEDULERS,
  createEmptyPrompt,
  duplicatePrompt,
  buildTagCategoryMap,
  promptArtColors,
} from './logic.js';
import { TAG_DICTIONARY } from './tags.js';
import {
  iconSvg,
  logoSvg,
  setIcon,
  emptyStateSvg,
  promptArtSvg,
  CATEGORY_ICONS,
} from './icons.js';
import {
  initSound,
  isMuted,
  toggleMute,
  playChip,
  playCopy,
  playSave,
  playDelete,
  playFavorite,
} from './sound.js';
import { initBackground } from './bg.js';

const QUALITY_POS_KEY = 'prompt-notebook:qualityPos';
const tagCategoryMap = buildTagCategoryMap(TAG_DICTIONARY);

/** @type {object[]} */
let prompts = [];
/** @type {object|null} */
let editing = null;
/** @type {Blob|null} */
let editingThumbBlob = null;
/** @type {object|null} */
let detailPrompt = null;
/** @type {{ tag: string, weight: number }[]} */
let builderPositive = [];
/** @type {{ tag: string, weight: number }[]} */
let builderNegative = [];
let builderTarget = 'positive';
let favoritesOnly = false;
/** @type {string[]} */
let activeFilterTags = [];
let sortBy = 'updatedAt';
let sortDir = 'desc';
let qualityPosition = 'end';
/** @type {BeforeInstallPromptEvent|null} */
let deferredInstall = null;
let openSheetId = null;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function init() {
  initBackground($('#bg-canvas'));
  initSound();
  qualityPosition = localStorage.getItem(QUALITY_POS_KEY) || 'end';

  $('#brand-logo').innerHTML = logoSvg({ size: 40, className: 'brand-logo' });
  setIcon($('#btn-mute'), isMuted() ? 'speakerOff' : 'speakerOn', { label: '効果音' });
  setIcon($('#btn-install'), 'install', { label: 'インストール' });
  setIcon($('#btn-settings'), 'settings', { label: '設定' });
  setIcon($('#search-icon'), 'search');
  setIcon($('#fav-filter-icon'), 'star');
  setIcon($('#filter-icon'), 'filter');
  setIcon($('#editor-close'), 'close');
  setIcon($('#editor-builder-open'), 'tag');
  setIcon($('#detail-close'), 'close');
  setIcon($('#builder-close'), 'close');
  setIcon($('#settings-close'), 'close');
  setIcon($('#thumb-preview'), 'image', { size: 28 });
  $('#empty-illust').innerHTML = emptyStateSvg({ size: 132 });

  $$('[data-icon]').forEach((el) => {
    const name = el.getAttribute('data-icon');
    el.innerHTML = iconSvg(name, { size: el.closest('.fab') ? 26 : 18 });
  });

  fillSelects();
  renderBuilder($('#side-builder'), true);
  bindEvents();
  bindCardEvents($('#card-grid'));
  bindBuilderDrag();
  registerSW();
  detectIOS();

  await ensureSeedData(makeSamples);
  await reload();
}

function fillSelects() {
  const sampler = $('#f-sampler');
  sampler.innerHTML = SAMPLERS.map((s) => `<option value="${s}">${s}</option>`).join('');
  const scheduler = $('#f-scheduler');
  scheduler.innerHTML = SCHEDULERS.map((s) => `<option value="${s}">${s}</option>`).join('');
  const preset = $('#f-preset');
  preset.innerHTML =
    `<option value="">手入力</option>` +
    RESOLUTION_PRESETS.map(
      (p) => `<option value="${p.width}x${p.height}">${p.label}</option>`,
    ).join('');
  $('#setting-quality-pos').value = qualityPosition;
}

function makeSamples() {
  const now = Date.now();
  return [
    createEmptyPrompt({
      id: `sample_${now}_1`,
      title: '夜桜とセーラー服',
      positive:
        '1girl, solo, long hair, black hair, blue eyes, smile, blush, serafuku, school uniform, standing, looking at viewer, upper body, cherry blossoms, night sky, soft lighting, masterpiece, best quality, amazing quality, very aesthetic, absurdres, newest',
      negative: ANIMAGINE_NEGATIVE,
      tags: ['夜', '桜', '制服'],
      seed: 420042,
      steps: 28,
      cfg: 5,
      sampler: 'euler_ancestral',
      scheduler: 'normal',
      width: 832,
      height: 1216,
      memo: 'Animagine XL 4.0 向けサンプル。品質タグは末尾。',
      favorite: true,
    }),
    createEmptyPrompt({
      id: `sample_${now}_2`,
      title: 'ネオン街のパーカー',
      positive:
        '1girl, solo, short hair, silver hair, red eyes, hoodie, jacket, standing, from side, cowboy shot, cityscape, neon lights, night, cinematic lighting, masterpiece, best quality, amazing quality, very aesthetic, absurdres, newest',
      negative: ANIMAGINE_NEGATIVE,
      tags: ['ネオン', '街', 'パーカー'],
      seed: 777001,
      steps: 30,
      cfg: 4.5,
      sampler: 'dpmpp_2m_sde',
      scheduler: 'karras',
      width: 1216,
      height: 832,
      memo: '横長シネマ風。',
      favorite: false,
    }),
    createEmptyPrompt({
      id: `sample_${now}_3`,
      title: '神社の巫女風',
      positive:
        '1girl, solo, long hair, twintails, brown hair, green eyes, kimono, ribbon, sitting, looking at viewer, full body, shrine, outdoors, sunlight, soft lighting, masterpiece, best quality, amazing quality, very aesthetic, absurdres, newest',
      negative: ANIMAGINE_NEGATIVE,
      tags: ['神社', '和装'],
      seed: -1,
      steps: 28,
      cfg: 5.5,
      sampler: 'euler',
      scheduler: 'normal',
      width: 896,
      height: 1152,
      memo: '明るめの昼間。',
      favorite: false,
    }),
  ];
}

async function reload() {
  prompts = await getAllPrompts();
  renderStats();
  renderList();
  renderTagFilters();
}

function renderStats() {
  const row = $('#stats-row');
  const favCount = prompts.filter((p) => p.favorite).length;
  const tagSet = new Set();
  prompts.forEach((p) => (p.tags || []).forEach((t) => tagSet.add(t)));
  row.innerHTML = `
    <div class="stat-chip">
      <strong>${prompts.length}</strong>
      <span class="stat-label">保存</span>
    </div>
    <div class="stat-chip is-fav">
      <strong>${favCount}</strong>
      <span class="stat-label">お気に入り</span>
    </div>
    <div class="stat-chip is-tag">
      <strong>${tagSet.size}</strong>
      <span class="stat-label">タグ</span>
    </div>
  `;
}

function getFiltered() {
  return searchFilter(prompts, {
    query: $('#search-input').value,
    tags: activeFilterTags,
    favoritesOnly,
    sortBy,
    sortDir,
  });
}

function aspectPadding(w, h) {
  const width = Number(w) || 832;
  const height = Number(h) || 1216;
  // 実寸比率を反映しつつ、カード内で極端に縦長にならないよう上限を設ける
  const ratio = Math.min(Math.max(height / width, 0.52), 1.05);
  return `${(ratio * 100).toFixed(2)}%`;
}

function ratioLabel(w, h) {
  const width = Number(w) || 0;
  const height = Number(h) || 0;
  if (!width || !height) return '?';
  return `${width}×${height}`;
}

function cardHtml(p) {
  const w = p.width || 832;
  const h = p.height || 1216;
  const pad = aspectPadding(w, h);
  let mediaInner = '';
  if (p.thumbnail) {
    const url =
      typeof p.thumbnail === 'string'
        ? p.thumbnail
        : URL.createObjectURL(p.thumbnail);
    mediaInner = `<img src="${url}" alt="" loading="lazy" />`;
  } else {
    const colors = promptArtColors(`${p.title || ''}|${p.positive || ''}|${p.id || ''}`);
    mediaInner = promptArtSvg(colors);
  }

  const tags = (p.tags || [])
    .slice(0, 4)
    .map((t) => `<span class="mini-tag">${escapeHtml(t)}</span>`)
    .join('');

  const badges = [
    p.seed != null && p.seed !== '' ? `<span class="mini-badge">seed ${escapeHtml(p.seed)}</span>` : '',
    p.steps != null ? `<span class="mini-badge">${escapeHtml(p.steps)} steps</span>` : '',
    p.cfg != null ? `<span class="mini-badge">CFG ${escapeHtml(p.cfg)}</span>` : '',
    p.sampler
      ? `<span class="mini-badge is-sampler">${escapeHtml(p.sampler)}</span>`
      : '',
    `<span class="mini-badge">${escapeHtml(ratioLabel(w, h))}</span>`,
  ]
    .filter(Boolean)
    .join('');

  return `
  <article class="prompt-card" data-id="${escapeHtml(p.id)}" tabindex="0" role="button" aria-label="${escapeHtml(p.title || '無題')}">
    <div class="card-media">
      <div class="card-media-frame" style="padding-bottom:${pad}">
        ${mediaInner}
        <span class="card-ratio-badge">${escapeHtml(ratioLabel(w, h))}</span>
      </div>
    </div>
    <div class="card-body">
      <div class="card-top">
        <h3 class="card-title">${escapeHtml(p.title || '無題')}</h3>
        <button type="button" class="fav-btn ${p.favorite ? 'is-on' : ''}" data-action="fav" aria-label="お気に入り" aria-pressed="${p.favorite}" title="お気に入り">
          ${iconSvg(p.favorite ? 'starFilled' : 'star', { size: 20 })}
        </button>
      </div>
      <p class="card-preview">${escapeHtml(p.positive || '')}</p>
      <div class="card-badges">${badges}</div>
      <div class="card-tags">${tags}</div>
      <div class="card-actions">
        <div class="card-actions-copy">
          <button type="button" class="copy-pill is-pos" data-action="copy-pos" aria-label="ポジティブをコピー" title="ポジティブをコピー">
            ${iconSvg('copy', { size: 14 })}
            <span class="copy-pill-label">ポジ</span>
          </button>
          <button type="button" class="copy-pill is-neg" data-action="copy-neg" aria-label="ネガティブをコピー" title="ネガティブをコピー">
            ${iconSvg('copy', { size: 14 })}
            <span class="copy-pill-label">ネガ</span>
          </button>
        </div>
        <div class="card-actions-tools">
          <button type="button" class="icon-btn" data-action="edit" aria-label="編集" title="編集">
            ${iconSvg('edit', { size: 17 })}
          </button>
          <button type="button" class="icon-btn" data-action="dup" aria-label="複製" title="複製">
            ${iconSvg('duplicate', { size: 17 })}
          </button>
          <button type="button" class="icon-btn" data-action="delete" aria-label="削除" title="削除">
            ${iconSvg('trash', { size: 17 })}
          </button>
        </div>
      </div>
    </div>
  </article>`;
}

function renderList() {
  const grid = $('#card-grid');
  const list = getFiltered();
  const empty = $('#empty-state');

  if (!list.length) {
    grid.innerHTML = '';
    if (prompts.length === 0) {
      empty.querySelector('h2').textContent = 'プロンプトがありません';
      empty.querySelector('p').textContent =
        'ヘッダーの「新規」、または右下の追加ボタンから作成できます。';
    } else {
      empty.querySelector('h2').textContent = '該当なし';
      empty.querySelector('p').textContent = '検索条件やフィルタを変えてみてください。';
    }
    $('#empty-illust').innerHTML = emptyStateSvg({ size: 132 });
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  const prevRects = new Map();
  $$('.prompt-card', grid).forEach((el) => {
    prevRects.set(el.dataset.id, el.getBoundingClientRect());
  });

  grid.innerHTML = list.map(cardHtml).join('');

  $$('.prompt-card', grid).forEach((el) => {
    const prev = prevRects.get(el.dataset.id);
    if (!prev) {
      el.style.opacity = '0';
      el.style.transform = 'scale(0.96)';
      requestAnimationFrame(() => {
        el.style.transition = 'transform 0.35s var(--ease-out), opacity 0.35s var(--ease-out)';
        el.style.opacity = '1';
        el.style.transform = '';
      });
      return;
    }
    const next = el.getBoundingClientRect();
    const dx = prev.left - next.left;
    const dy = prev.top - next.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    el.style.transition = 'none';
    requestAnimationFrame(() => {
      el.style.transition = 'transform 0.35s var(--ease-out)';
      el.style.transform = '';
    });
  });
}

function bindCardEvents(grid) {
  grid.addEventListener('click', onCardClick);
  grid.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.prompt-card');
      if (card && !e.target.closest('button')) {
        e.preventDefault();
        openDetail(card.dataset.id);
      }
    }
  });
}

async function onCardClick(e) {
  const btn = e.target.closest('[data-action]');
  const card = e.target.closest('.prompt-card');
  if (!card) return;
  const id = card.dataset.id;
  const p = prompts.find((x) => x.id === id);
  if (!p) return;

  if (btn) {
    e.stopPropagation();
    const action = btn.dataset.action;
    if (action === 'fav') {
      await toggleFavorite(p, btn);
    } else if (action === 'copy-pos') {
      await copyText(p.positive || '', btn, 'ポジティブをコピーしました');
    } else if (action === 'copy-neg') {
      await copyText(p.negative || '', btn, 'ネガティブをコピーしました');
    } else if (action === 'edit') {
      openEditor(p);
    } else if (action === 'dup') {
      await doDuplicate(p);
    } else if (action === 'delete') {
      confirmDelete(p);
    }
    return;
  }
  openDetail(id);
}

async function toggleFavorite(p, btn) {
  p.favorite = !p.favorite;
  p.updatedAt = new Date().toISOString();
  await putPrompt(p);
  playFavorite();
  btn.classList.toggle('is-on', p.favorite);
  btn.setAttribute('aria-pressed', String(p.favorite));
  btn.innerHTML = iconSvg(p.favorite ? 'starFilled' : 'star', { size: 20 });
  btn.classList.add('is-pop');
  setTimeout(() => btn.classList.remove('is-pop'), 280);
  if (p.favorite) spawnParticles(btn);
  renderStats();
  renderList();
}

function spawnParticles(el) {
  const layer = $('#particle-layer');
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < 8; i++) {
    const d = document.createElement('span');
    d.className = 'particle';
    const ang = (Math.PI * 2 * i) / 8;
    const dist = 28 + Math.random() * 24;
    d.style.left = `${cx}px`;
    d.style.top = `${cy}px`;
    d.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
    d.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
    d.style.background =
      i % 2 ? 'var(--accent-sakura)' : 'var(--accent-warm)';
    layer.appendChild(d);
    setTimeout(() => d.remove(), 750);
  }
}

function spawnChipSparks(chip) {
  const rect = chip.getBoundingClientRect();
  for (let i = 0; i < 5; i++) {
    const spark = document.createElement('span');
    spark.className = 'chip-spark';
    const ang = (Math.PI * 2 * i) / 5 + Math.random() * 0.4;
    const dist = 12 + Math.random() * 16;
    spark.style.left = `${rect.width / 2}px`;
    spark.style.top = `${rect.height / 2}px`;
    spark.style.setProperty('--sx', `${Math.cos(ang) * dist}px`);
    spark.style.setProperty('--sy', `${Math.sin(ang) * dist}px`);
    spark.style.background =
      i % 2 ? 'var(--accent-aqua)' : 'var(--accent-warm)';
    chip.appendChild(spark);
    setTimeout(() => spark.remove(), 560);
  }
}

async function copyText(text, btn, message = 'コピーしました') {
  const ok = await writeClipboard(text);
  if (!ok) {
    toast('コピーに失敗しました');
    return;
  }
  playCopy();
  if (btn) {
    const isPill = btn.classList.contains('copy-pill');
    const prev = btn.innerHTML;
    btn.classList.add('is-copied');
    if (isPill) {
      const tone = btn.classList.contains('is-neg') ? 'is-neg' : 'is-pos';
      btn.innerHTML = `${iconSvg('check', { size: 14 })}<span class="copy-pill-label">コピー済</span>`;
      btn.classList.add(tone);
    } else {
      btn.innerHTML = iconSvg('check', { size: 18 });
    }
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    btn.appendChild(ripple);
    setTimeout(() => {
      btn.classList.remove('is-copied');
      btn.innerHTML = prev;
    }, 900);
  }
  toast(message);
}

async function writeClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

function toast(msg) {
  const host = $('#toast-host');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-show'));
  setTimeout(() => {
    el.classList.remove('is-show');
    setTimeout(() => el.remove(), 300);
  }, 1800);
}

function renderTagFilters() {
  const set = new Set();
  prompts.forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
  const list = $('#tag-filter-list');
  const tags = [...set].sort((a, b) => a.localeCompare(b, 'ja'));
  if (!tags.length) {
    list.hidden = true;
    list.innerHTML = '';
    return;
  }
  list.innerHTML = tags
    .map(
      (t) =>
        `<button type="button" class="tag-filter-chip ${activeFilterTags.includes(t) ? 'is-on' : ''}" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`,
    )
    .join('');
  list.hidden = !$('#btn-tag-filter').classList.contains('is-on');
}

function openSheet(id) {
  const sheet = document.getElementById(id);
  const overlay = $('#overlay');
  overlay.hidden = false;
  sheet.hidden = false;
  sheet.style.transform = '';
  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    sheet.classList.add('is-open');
  });
  openSheetId = id;
  document.body.style.overflow = 'hidden';
}

function closeSheet(id) {
  const sheet = document.getElementById(id || openSheetId);
  if (!sheet) return;
  sheet.classList.remove('is-open', 'is-dragging');
  sheet.style.transform = '';
  const overlay = $('#overlay');
  overlay.classList.remove('is-open');
  setTimeout(() => {
    sheet.hidden = true;
    if (![...$$('.sheet')].some((s) => s.classList.contains('is-open'))) {
      overlay.hidden = true;
      document.body.style.overflow = '';
      openSheetId = null;
    }
  }, 320);
}

function closeAllSheets() {
  $$('.sheet.is-open').forEach((s) => closeSheet(s.id));
  closeModal();
}

function bindBuilderDrag() {
  const sheet = $('#builder-sheet');
  const handle = $('#builder-handle');
  if (!sheet || !handle) return;

  let startY = 0;
  let dragging = false;

  const onStart = (clientY) => {
    if (!sheet.classList.contains('is-open')) return;
    dragging = true;
    startY = clientY;
    sheet.classList.add('is-dragging');
  };

  const dragTransform = (dy) => {
    const desktop = window.matchMedia('(min-width: 720px)').matches;
    return desktop ? `translate(-50%, ${dy}px)` : `translateY(${dy}px)`;
  };

  const onMove = (clientY) => {
    if (!dragging) return;
    const dy = Math.max(0, clientY - startY);
    sheet.style.transform = dragTransform(dy);
  };

  const onEnd = (clientY) => {
    if (!dragging) return;
    dragging = false;
    sheet.classList.remove('is-dragging');
    const dy = Math.max(0, clientY - startY);
    sheet.style.transform = '';
    if (dy > 110) closeSheet('builder-sheet');
  };

  handle.addEventListener('pointerdown', (e) => {
    handle.setPointerCapture(e.pointerId);
    onStart(e.clientY);
  });
  handle.addEventListener('pointermove', (e) => onMove(e.clientY));
  handle.addEventListener('pointerup', (e) => onEnd(e.clientY));
  handle.addEventListener('pointercancel', (e) => onEnd(e.clientY));
}

function openEditor(prompt = null) {
  editing = prompt
    ? { ...prompt, tags: [...(prompt.tags || [])] }
    : createEmptyPrompt();
  editingThumbBlob = editing.thumbnail instanceof Blob ? editing.thumbnail : null;
  $('#editor-title').textContent = prompt ? 'プロンプト編集' : '新規プロンプト';
  $('#f-title').value = editing.title || '';
  $('#f-positive').value = editing.positive || '';
  $('#f-negative').value = editing.negative || '';
  $('#f-tags').value = (editing.tags || []).join(', ');
  $('#f-seed').value = editing.seed ?? -1;
  $('#f-steps').value = editing.steps ?? 28;
  $('#f-cfg').value = editing.cfg ?? 5;
  $('#f-sampler').value = editing.sampler || 'euler_ancestral';
  $('#f-scheduler').value = editing.scheduler || 'normal';
  $('#f-width').value = editing.width || 832;
  $('#f-height').value = editing.height || 1216;
  $('#f-memo').value = editing.memo || '';
  $('#f-quality-pos').value = qualityPosition;
  syncPresetSelect();
  updateThumbPreview();
  builderPositive = parsePrompt(editing.positive || '');
  builderNegative = parsePrompt(editing.negative || '');
  openSheet('editor-sheet');
  setTimeout(() => $('#f-title').focus(), 350);
}

function syncPresetSelect() {
  const w = Number($('#f-width').value);
  const h = Number($('#f-height').value);
  const key = `${w}x${h}`;
  const opt = [...$('#f-preset').options].find((o) => o.value === key);
  $('#f-preset').value = opt ? key : '';
}

function updateThumbPreview() {
  const box = $('#thumb-preview');
  if (editingThumbBlob) {
    const url = URL.createObjectURL(editingThumbBlob);
    box.innerHTML = `<img src="${url}" alt="" />`;
  } else if (editing?.thumbnail && typeof editing.thumbnail === 'string') {
    box.innerHTML = `<img src="${editing.thumbnail}" alt="" />`;
  } else {
    box.innerHTML = iconSvg('image', { size: 28 });
  }
}

async function saveEditor() {
  if (!editing) return;
  const title = $('#f-title').value.trim();
  if (!title) {
    toast('タイトルを入力してください');
    $('#f-title').focus();
    return;
  }
  const tags = $('#f-tags')
    .value.split(/[,、]/)
    .map((t) => t.trim())
    .filter(Boolean);
  const record = {
    ...editing,
    title,
    positive: $('#f-positive').value.trim(),
    negative: $('#f-negative').value.trim(),
    tags,
    seed: numOrNull($('#f-seed').value),
    steps: numOrNull($('#f-steps').value),
    cfg: numOrNull($('#f-cfg').value),
    sampler: $('#f-sampler').value,
    scheduler: $('#f-scheduler').value,
    width: numOrNull($('#f-width').value),
    height: numOrNull($('#f-height').value),
    memo: $('#f-memo').value.trim(),
    updatedAt: new Date().toISOString(),
    createdAt: editing.createdAt || new Date().toISOString(),
    thumbnail: editingThumbBlob || editing.thumbnail || null,
  };
  qualityPosition = $('#f-quality-pos').value;
  localStorage.setItem(QUALITY_POS_KEY, qualityPosition);
  await putPrompt(record);
  playSave();
  toast('保存しました');
  closeSheet('editor-sheet');
  editing = null;
  await reload();
}

function numOrNull(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function openDetail(id) {
  const p = prompts.find((x) => x.id === id);
  if (!p) return;
  detailPrompt = p;
  $('#detail-title').textContent = p.title || '無題';
  setIcon($('#detail-fav'), p.favorite ? 'starFilled' : 'star');
  $('#detail-fav').classList.toggle('is-active', p.favorite);

  let thumbHtml = '';
  if (p.thumbnail) {
    const url =
      typeof p.thumbnail === 'string'
        ? p.thumbnail
        : URL.createObjectURL(p.thumbnail);
    thumbHtml = `<div class="thumb-preview" style="width:120px;height:120px;margin-bottom:12px"><img src="${url}" alt="" /></div>`;
  } else {
    const colors = promptArtColors(`${p.title || ''}|${p.positive || ''}|${p.id || ''}`);
    thumbHtml = `<div class="card-media" style="margin-bottom:12px;max-width:180px"><div class="card-media-frame" style="padding-bottom:${aspectPadding(p.width, p.height)}">${promptArtSvg(colors)}</div></div>`;
  }

  $('#detail-body').innerHTML = `
    ${thumbHtml}
    <div class="detail-actions">
      <button type="button" class="copy-pill is-pos" id="detail-copy-pos" aria-label="ポジティブをコピー">
        ${iconSvg('copy', { size: 14 })}
        <span class="copy-pill-label">ポジ</span>
      </button>
      <button type="button" class="copy-pill is-neg" id="detail-copy-neg" aria-label="ネガティブをコピー">
        ${iconSvg('copy', { size: 14 })}
        <span class="copy-pill-label">ネガ</span>
      </button>
    </div>
    <div class="detail-block">
      <h3>ポジティブ</h3>
      <pre class="detail-text">${escapeHtml(p.positive || '')}</pre>
    </div>
    <div class="detail-block">
      <h3>ネガティブ</h3>
      <pre class="detail-text">${escapeHtml(p.negative || '')}</pre>
    </div>
    <div class="detail-block">
      <h3>パラメータ</h3>
      <div class="params-list">
        <div><span>Seed</span>${escapeHtml(p.seed ?? '')}</div>
        <div><span>Steps</span>${escapeHtml(p.steps ?? '')}</div>
        <div><span>CFG</span>${escapeHtml(p.cfg ?? '')}</div>
        <div><span>Sampler</span>${escapeHtml(p.sampler || '')}</div>
        <div><span>Scheduler</span>${escapeHtml(p.scheduler || '')}</div>
        <div><span>Size</span>${escapeHtml(p.width || '?')} × ${escapeHtml(p.height || '?')}</div>
      </div>
    </div>
    <div class="detail-block">
      <h3>タグ</h3>
      <div class="card-tags">${(p.tags || []).map((t) => `<span class="mini-tag">${escapeHtml(t)}</span>`).join('') || '<span class="card-meta">なし</span>'}</div>
    </div>
    <div class="detail-block">
      <h3>メモ</h3>
      <pre class="detail-text">${escapeHtml(p.memo || '（なし）')}</pre>
    </div>
  `;
  $('#detail-copy-pos').onclick = (e) =>
    copyText(p.positive || '', e.currentTarget, 'ポジティブをコピーしました');
  $('#detail-copy-neg').onclick = (e) =>
    copyText(p.negative || '', e.currentTarget, 'ネガティブをコピーしました');
  openSheet('detail-sheet');
}

async function doDuplicate(p) {
  const dup = duplicatePrompt(p);
  await putPrompt(dup);
  playSave();
  toast('複製しました');
  await reload();
}

function confirmDelete(p) {
  openModal({
    title: '削除の確認',
    message: `「${p.title || '無題'}」を削除しますか？この操作は元に戻せません。`,
    actions: [
      { label: 'キャンセル', className: 'btn btn-ghost', onClick: closeModal },
      {
        label: '削除する',
        className: 'btn btn-danger',
        onClick: async () => {
          await deletePrompt(p.id);
          playDelete();
          toast('削除しました');
          closeModal();
          closeSheet('detail-sheet');
          await reload();
        },
      },
    ],
  });
}

function openModal({ title, message, actions }) {
  const modal = $('#modal');
  const overlay = $('#overlay');
  $('#modal-title').textContent = title;
  $('#modal-message').textContent = message;
  const box = $('#modal-actions');
  box.innerHTML = '';
  actions.forEach((a) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = a.className || 'btn';
    b.textContent = a.label;
    b.onclick = a.onClick;
    box.appendChild(b);
  });
  overlay.hidden = false;
  modal.hidden = false;
  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    modal.classList.add('is-open');
  });
}

function closeModal() {
  const modal = $('#modal');
  modal.classList.remove('is-open');
  setTimeout(() => {
    modal.hidden = true;
    if (![...$$('.sheet')].some((s) => s.classList.contains('is-open'))) {
      const overlay = $('#overlay');
      overlay.classList.remove('is-open');
      overlay.hidden = true;
      document.body.style.overflow = '';
    }
  }, 250);
}

/* ---- Tag builder ---- */
function renderBuilder(root) {
  if (!root) return;
  const previewPos = composePrompt(builderPositive, {
    qualityPosition,
    tagCategoryMap,
  });
  const previewNeg = composePrompt(builderNegative, {
    qualityPosition: 'end',
    tagCategoryMap,
  });

  root.innerHTML = `
    <div class="builder-root">
    <h2>タグビルダー</h2>
    <div class="builder-controls">
      <button type="button" class="chip-toggle ${builderTarget === 'positive' ? 'is-on' : ''}" data-target="positive">ポジティブ</button>
      <button type="button" class="chip-toggle ${builderTarget === 'negative' ? 'is-on' : ''}" data-target="negative">ネガティブ</button>
      <button type="button" class="btn" data-action="insert-neg">推奨ネガティブ</button>
      <button type="button" class="btn btn-primary" data-action="apply">エディタへ反映</button>
    </div>
    <div class="builder-preview-stack">
      <div class="builder-preview-block is-pos">
        <div class="builder-preview-head">
          <span class="builder-preview-label">POS</span>
          <button type="button" class="copy-pill is-pos" data-action="copy-preview-pos" aria-label="合成ポジティブをコピー" title="コピー">
            ${iconSvg('copy', { size: 14 })}
            <span class="copy-pill-label">コピー</span>
          </button>
        </div>
        <pre class="builder-preview-text">${escapeHtml(previewPos || '（空）')}</pre>
      </div>
      <div class="builder-preview-block is-neg">
        <div class="builder-preview-head">
          <span class="builder-preview-label">NEG</span>
          <button type="button" class="copy-pill is-neg" data-action="copy-preview-neg" aria-label="合成ネガティブをコピー" title="コピー">
            ${iconSvg('copy', { size: 14 })}
            <span class="copy-pill-label">コピー</span>
          </button>
        </div>
        <pre class="builder-preview-text">${escapeHtml(previewNeg || '（空）')}</pre>
      </div>
    </div>
    ${TAG_DICTIONARY.categories
      .filter((c) =>
        builderTarget === 'negative'
          ? c.target !== 'positive' || c.id === 'negative'
          : c.id !== 'negative',
      )
      .map((cat) => {
        const iconName = CATEGORY_ICONS[cat.id] || 'tag';
        return `
      <div class="tag-category">
        <div class="tag-category-head">
          ${iconSvg(iconName, { size: 16 })}
          <h3>${escapeHtml(cat.label)}</h3>
        </div>
        <div class="tag-chips">
          ${cat.tags
            .map((t) => {
              const selected = currentBuilderList().find(
                (x) => x.tag.toLowerCase() === t.tag.toLowerCase(),
              );
              return `
              <button type="button" class="tag-chip ${selected ? 'is-selected' : ''}" data-tag="${escapeHtml(t.tag)}">
                <span class="tag-en">${escapeHtml(t.tag)}${selected && selected.weight !== 1 ? `:${selected.weight}` : ''}</span>
                <span class="tag-ja">${escapeHtml(t.labelJa)}</span>
                ${
                  selected
                    ? `<span class="weight-row">
                        <span class="icon-btn" data-weight="-0.1" data-tag="${escapeHtml(t.tag)}" aria-label="重みを下げる">${iconSvg('minus', { size: 14 })}</span>
                        <span class="weight-val">${(selected.weight ?? 1).toFixed(1)}</span>
                        <span class="icon-btn" data-weight="0.1" data-tag="${escapeHtml(t.tag)}" aria-label="重みを上げる">${iconSvg('plus', { size: 14 })}</span>
                      </span>`
                    : ''
                }
              </button>`;
            })
            .join('')}
        </div>
      </div>`;
      })
      .join('')}
    </div>
  `;

  root.querySelectorAll('[data-target]').forEach((btn) => {
    btn.onclick = () => {
      builderTarget = btn.dataset.target;
      refreshBuilders();
    };
  });
  root.querySelector('[data-action="insert-neg"]').onclick = () => {
    builderNegative = parsePrompt(ANIMAGINE_NEGATIVE);
    builderTarget = 'negative';
    playChip();
    refreshBuilders();
    toast('推奨ネガティブをセットしました');
  };
  root.querySelector('[data-action="apply"]').onclick = () => applyBuilder();
  root.querySelector('[data-action="copy-preview-pos"]').onclick = (e) => {
    copyText(previewPos || '', e.currentTarget, 'ポジティブをコピーしました');
  };
  root.querySelector('[data-action="copy-preview-neg"]').onclick = (e) => {
    copyText(previewNeg || '', e.currentTarget, 'ネガティブをコピーしました');
  };
  root.querySelectorAll('.tag-chip').forEach((chip) => {
    chip.onclick = (e) => {
      const wbtn = e.target.closest('[data-weight]');
      if (wbtn) {
        e.stopPropagation();
        const delta = Number(wbtn.dataset.weight);
        const tag = wbtn.dataset.tag;
        if (builderTarget === 'negative') {
          builderNegative = adjustTagWeight(builderNegative, tag, delta);
        } else {
          builderPositive = adjustTagWeight(builderPositive, tag, delta);
        }
        playChip();
        refreshBuilders();
        return;
      }
      const tag = chip.dataset.tag;
      const wasSelected = chip.classList.contains('is-selected');
      if (builderTarget === 'negative') {
        builderNegative = toggleTag(builderNegative, tag);
      } else {
        builderPositive = toggleTag(builderPositive, tag);
      }
      chip.classList.add('is-bounce');
      if (!wasSelected) spawnChipSparks(chip);
      playChip();
      // バウンスを見せてから再描画
      setTimeout(() => refreshBuilders(), 180);
    };
  });
}

function currentBuilderList() {
  return builderTarget === 'negative' ? builderNegative : builderPositive;
}

function refreshBuilders() {
  renderBuilder($('#side-builder'));
  if (!$('#builder-sheet').hidden) {
    renderBuilder($('#builder-body'));
  }
}

function applyBuilder() {
  const pos = composePrompt(builderPositive, { qualityPosition, tagCategoryMap });
  const neg = composePrompt(builderNegative, {
    qualityPosition: 'end',
    tagCategoryMap,
  });
  if ($('#editor-sheet').classList.contains('is-open') || !$('#editor-sheet').hidden) {
    $('#f-positive').value = pos;
    $('#f-negative').value = neg;
  } else {
    openEditor(createEmptyPrompt({ positive: pos, negative: neg }));
    return;
  }
  toast('エディタに反映しました');
  playSave();
  if ($('#builder-sheet').classList.contains('is-open')) {
    closeSheet('builder-sheet');
  }
}

function openBuilderSheet() {
  if ($('#editor-sheet').classList.contains('is-open')) {
    builderPositive = parsePrompt($('#f-positive').value);
    builderNegative = parsePrompt($('#f-negative').value);
  }
  renderBuilder($('#builder-body'));
  openSheet('builder-sheet');
}

/* ---- Import / Export ---- */
async function doExport() {
  const items = [];
  for (const p of prompts) {
    let thumbnailDataUrl = null;
    if (p.thumbnail instanceof Blob) {
      thumbnailDataUrl = await blobToDataUrl(p.thumbnail);
    } else if (typeof p.thumbnail === 'string') {
      thumbnailDataUrl = p.thumbnail;
    }
    items.push({ ...p, thumbnailDataUrl, thumbnail: undefined });
  }
  const data = exportData(items);
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `prompt-notebook-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('エクスポートしました');
}

async function handleImportFile(file) {
  let raw;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    toast('不正なJSONです');
    return;
  }
  const result = validateImport(raw);
  if (!result.ok) {
    openModal({
      title: 'インポートエラー',
      message: `検証に失敗しました（${result.errors.length}件）。\n${result.errors.slice(0, 5).join('\n')}`,
      actions: [{ label: '閉じる', className: 'btn', onClick: closeModal }],
    });
    return;
  }
  const incoming = result.data.prompts;
  const existingIds = new Set(prompts.map((p) => p.id));
  const hasDup = incoming.some((p) => existingIds.has(p.id));

  const run = async (mode) => {
    const prepared = [];
    for (const item of incoming) {
      let thumbnail = null;
      if (item.thumbnailDataUrl) {
        try {
          thumbnail = await dataUrlToBlob(item.thumbnailDataUrl);
        } catch {
          thumbnail = null;
        }
      }
      const { thumbnailDataUrl, ...rest } = item;
      prepared.push({ ...rest, thumbnail });
    }
    const { prompts: merged, stats } = mergeImport(prompts, prepared, mode);
    await replaceAllPrompts(merged);
    closeModal();
    toast(
      `インポート完了: 追加${stats.added} / 上書き${stats.overwritten} / スキップ${stats.skipped} / 複製${stats.duplicated}`,
    );
    await reload();
  };

  if (!hasDup) {
    await run('skip');
    return;
  }

  openModal({
    title: '重複IDがあります',
    message: `${incoming.length}件中、既存とIDが重複するものがあります。どうしますか？`,
    actions: [
      { label: '上書き', className: 'btn', onClick: () => run('overwrite') },
      { label: 'スキップ', className: 'btn', onClick: () => run('skip') },
      { label: '複製として追加', className: 'btn btn-primary', onClick: () => run('duplicate') },
      { label: 'キャンセル', className: 'btn btn-ghost', onClick: closeModal },
    ],
  });
}

/* ---- Events ---- */
function bindEvents() {
  $('#btn-mute').onclick = () => {
    const m = toggleMute();
    setIcon($('#btn-mute'), m ? 'speakerOff' : 'speakerOn', { label: '効果音' });
    toast(m ? '効果音オフ' : '効果音オン');
  };

  $('#btn-settings').onclick = () => openSheet('settings-sheet');
  $('#settings-close').onclick = () => closeSheet('settings-sheet');
  $('#setting-quality-pos').onchange = (e) => {
    qualityPosition = e.target.value;
    localStorage.setItem(QUALITY_POS_KEY, qualityPosition);
    refreshBuilders();
  };

  $('#btn-export').onclick = () => doExport();
  $('#btn-import').onclick = () => $('#import-file').click();
  $('#import-file').onchange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleImportFile(f);
    e.target.value = '';
  };

  const openNew = () => openEditor();
  $('#btn-new').onclick = openNew;
  $('#btn-new-desktop').onclick = openNew;
  $('#btn-new-header').onclick = openNew;
  $('#btn-bar-builder').onclick = () => openBuilderSheet();
  $('#btn-bar-search').onclick = () => {
    $('#search-input').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  $('#editor-close').onclick = () => closeSheet('editor-sheet');
  $('#editor-cancel').onclick = () => closeSheet('editor-sheet');
  $('#editor-save').onclick = () => saveEditor();
  $('#editor-builder-open').onclick = () => openBuilderSheet();
  $('#builder-close').onclick = () => closeSheet('builder-sheet');
  $('#builder-apply').onclick = () => applyBuilder();

  $('#btn-insert-negative').onclick = () => {
    $('#f-negative').value = ANIMAGINE_NEGATIVE;
    builderNegative = parsePrompt(ANIMAGINE_NEGATIVE);
    toast('推奨ネガティブを挿入しました');
    playChip();
  };

  $('#f-preset').onchange = (e) => {
    if (!e.target.value) return;
    const [w, h] = e.target.value.split('x').map(Number);
    $('#f-width').value = w;
    $('#f-height').value = h;
  };
  $('#f-width').oninput = syncPresetSelect;
  $('#f-height').oninput = syncPresetSelect;

  $('#btn-pick-thumb').onclick = () => $('#f-thumb').click();
  $('#f-thumb').onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      editingThumbBlob = await resizeImageToBlob(file, 512);
      updateThumbPreview();
    } catch {
      toast('画像の読み込みに失敗しました');
    }
    e.target.value = '';
  };
  $('#btn-clear-thumb').onclick = () => {
    editingThumbBlob = null;
    if (editing) editing.thumbnail = null;
    updateThumbPreview();
  };

  $('#detail-close').onclick = () => closeSheet('detail-sheet');
  $('#detail-edit').onclick = () => {
    const p = detailPrompt;
    closeSheet('detail-sheet');
    setTimeout(() => openEditor(p), 200);
  };
  $('#detail-dup').onclick = async () => {
    if (detailPrompt) await doDuplicate(detailPrompt);
  };
  $('#detail-delete').onclick = () => {
    if (detailPrompt) confirmDelete(detailPrompt);
  };
  $('#detail-fav').onclick = async () => {
    if (!detailPrompt) return;
    await toggleFavorite(detailPrompt, $('#detail-fav'));
    setIcon($('#detail-fav'), detailPrompt.favorite ? 'starFilled' : 'star');
  };

  let searchTimer;
  $('#search-input').oninput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(renderList, 120);
  };

  $('#btn-fav-filter').onclick = () => {
    favoritesOnly = !favoritesOnly;
    $('#btn-fav-filter').classList.toggle('is-on', favoritesOnly);
    $('#btn-fav-filter').setAttribute('aria-pressed', String(favoritesOnly));
    renderList();
  };

  $('#btn-tag-filter').onclick = () => {
    const on = !$('#btn-tag-filter').classList.contains('is-on');
    $('#btn-tag-filter').classList.toggle('is-on', on);
    $('#btn-tag-filter').setAttribute('aria-pressed', String(on));
    $('#tag-filter-list').hidden = !on;
    if (on) renderTagFilters();
  };

  $('#tag-filter-list').onclick = (e) => {
    const chip = e.target.closest('[data-tag]');
    if (!chip) return;
    const tag = chip.dataset.tag;
    if (activeFilterTags.includes(tag)) {
      activeFilterTags = activeFilterTags.filter((t) => t !== tag);
    } else {
      activeFilterTags = [...activeFilterTags, tag];
    }
    chip.classList.toggle('is-on');
    renderList();
  };

  $('#sort-select').onchange = (e) => {
    const [by, dir] = e.target.value.split(':');
    sortBy = by;
    sortDir = dir;
    renderList();
  };

  $('#overlay').onclick = () => {
    if (!$('#modal').hidden && $('#modal').classList.contains('is-open')) {
      closeModal();
      return;
    }
    closeAllSheets();
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('#modal').hidden) closeModal();
      else closeAllSheets();
    }
    if (e.key === '/' && !isTyping(e.target)) {
      e.preventDefault();
      $('#search-input').focus();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if ($('#editor-sheet').classList.contains('is-open')) {
        e.preventDefault();
        saveEditor();
      }
    }
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e;
    $('#btn-install').hidden = false;
  });

  $('#btn-install').onclick = async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
    $('#btn-install').hidden = true;
  };
}

function isTyping(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

function detectIOS() {
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (isIOS && !isStandalone) {
    $('#ios-install-hint').hidden = false;
  }
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* file:// 等では失敗しうる */
    });
  });
}

init().catch((err) => {
  console.error(err);
  toast('初期化に失敗しました');
});
