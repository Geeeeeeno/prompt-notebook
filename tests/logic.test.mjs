import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  composePrompt,
  parsePrompt,
  toggleTag,
  exportData,
  validateImport,
  mergeImport,
  searchFilter,
  normalizePromptText,
  formatWeightedTag,
  adjustTagWeight,
  APP_ID,
  ANIMAGINE_NEGATIVE,
} from '../js/logic.js';

const catMap = {
  '1girl': 'subject',
  solo: 'subject',
  'long hair': 'character',
  smile: 'character',
  'school uniform': 'clothing',
  standing: 'pose',
  outdoors: 'background',
  'cinematic lighting': 'lighting',
  masterpiece: 'quality',
  'best quality': 'quality',
  lowres: 'negative',
};

describe('composePrompt', () => {
  it('カテゴリ順でタグを並べる（品質は末尾）', () => {
    const selected = [
      { tag: 'masterpiece' },
      { tag: 'outdoors' },
      { tag: '1girl' },
      { tag: 'school uniform' },
      { tag: 'standing' },
      { tag: 'cinematic lighting' },
      { tag: 'smile' },
    ];
    const result = composePrompt(selected, {
      qualityPosition: 'end',
      tagCategoryMap: catMap,
    });
    assert.equal(
      result,
      '1girl, smile, school uniform, standing, outdoors, cinematic lighting, masterpiece',
    );
  });

  it('品質タグを先頭に置ける', () => {
    const result = composePrompt(
      [{ tag: '1girl' }, { tag: 'best quality' }, { tag: 'solo' }],
      { qualityPosition: 'start', tagCategoryMap: catMap },
    );
    assert.equal(result, 'best quality, 1girl, solo');
  });

  it('重複タグを除去する（大文字小文字無視）', () => {
    const result = composePrompt(
      [{ tag: '1girl' }, { tag: '1Girl' }, { tag: 'solo' }],
      { tagCategoryMap: catMap },
    );
    assert.equal(result, '1girl, solo');
  });

  it('重み付きタグを (tag:1.2) 形式で出力する', () => {
    const result = composePrompt([{ tag: 'smile', weight: 1.2 }, { tag: 'solo' }]);
    assert.match(result, /\(smile:1\.2\)/);
    assert.match(result, /solo/);
  });

  it('空白とカンマを正規化する', () => {
    const text = normalizePromptText('  1girl ,  solo,,  smile  ');
    assert.equal(text, '1girl, solo, smile');
  });
});

describe('parsePrompt', () => {
  it('カンマ区切りを配列にする', () => {
    const tags = parsePrompt('1girl, solo, long hair');
    assert.deepEqual(
      tags.map((t) => t.tag),
      ['1girl', 'solo', 'long hair'],
    );
  });

  it('(tag:weight) をパースする', () => {
    const tags = parsePrompt('(smile:1.3), solo');
    assert.equal(tags[0].tag, 'smile');
    assert.equal(tags[0].weight, 1.3);
    assert.equal(tags[1].tag, 'solo');
  });

  it('括弧強調 (tag) を約1.1倍として扱う', () => {
    const tags = parsePrompt('(detailed)');
    assert.equal(tags[0].tag, 'detailed');
    assert.ok(Math.abs(tags[0].weight - 1.1) < 1e-9);
  });

  it('parse → compose の往復で内容が保たれる', () => {
    const original = '1girl, (smile:1.2), school uniform, masterpiece';
    const parsed = parsePrompt(original);
    const composed = composePrompt(parsed, {
      qualityPosition: 'end',
      tagCategoryMap: catMap,
    });
    const again = parsePrompt(composed);
    assert.deepEqual(
      again.map((t) => ({ tag: t.tag, weight: t.weight })),
      parsePrompt(composed).map((t) => ({ tag: t.tag, weight: t.weight })),
    );
    assert.ok(again.some((t) => t.tag === 'smile' && Math.abs(t.weight - 1.2) < 1e-9));
    assert.ok(again.some((t) => t.tag === '1girl'));
  });
});

describe('toggleTag / adjustTagWeight / formatWeightedTag', () => {
  it('未選択なら追加、再トグルで除去', () => {
    let sel = [];
    sel = toggleTag(sel, 'solo');
    assert.equal(sel.length, 1);
    sel = toggleTag(sel, 'solo');
    assert.equal(sel.length, 0);
  });

  it('重みを加減できる', () => {
    let sel = [{ tag: 'smile', weight: 1 }];
    sel = adjustTagWeight(sel, 'smile', 0.2);
    assert.equal(sel[0].weight, 1.2);
    sel = adjustTagWeight(sel, 'smile', -0.5);
    assert.equal(sel[0].weight, 0.7);
  });

  it('weight 1 は素のタグ名、それ以外は括弧付き', () => {
    assert.equal(formatWeightedTag({ tag: 'solo', weight: 1 }), 'solo');
    assert.equal(formatWeightedTag({ tag: 'solo', weight: 1.25 }), '(solo:1.25)');
  });
});

describe('export / validateImport / mergeImport', () => {
  const sample = {
    id: 'a1',
    title: 'サンプル',
    positive: '1girl, solo',
    negative: ANIMAGINE_NEGATIVE,
    tags: ['夜', '桜'],
    seed: 123,
    steps: 28,
    cfg: 5,
    sampler: 'euler_ancestral',
    scheduler: 'normal',
    width: 832,
    height: 1216,
    memo: 'memo',
    favorite: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    thumbnailDataUrl: null,
  };

  it('エクスポート形式が正しい', () => {
    const data = exportData([sample], '2026-10-19T00:00:00.000Z');
    assert.equal(data.app, APP_ID);
    assert.equal(data.version, 1);
    assert.equal(data.exportedAt, '2026-10-19T00:00:00.000Z');
    assert.equal(data.prompts.length, 1);
    assert.equal(data.prompts[0].id, 'a1');
  });

  it('エクスポート→検証の往復が成功する', () => {
    const data = exportData([sample]);
    const result = validateImport(data);
    assert.equal(result.ok, true);
    assert.equal(result.data.prompts[0].title, 'サンプル');
  });

  it('不正な JSON ルートを拒否する', () => {
    const result = validateImport(null);
    assert.equal(result.ok, false);
    assert.ok(result.errors.length > 0);
  });

  it('不正スキーマ（app不一致・prompts非配列）を拒否する', () => {
    const r1 = validateImport({ app: 'other', version: 1, prompts: [] });
    assert.equal(r1.ok, false);
    const r2 = validateImport({ app: APP_ID, version: 1, prompts: 'nope' });
    assert.equal(r2.ok, false);
  });

  it('プロンプト項目の必須欠落を拒否する', () => {
    const result = validateImport({
      app: APP_ID,
      version: 1,
      prompts: [{ id: '', title: 1, positive: null }],
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.length >= 2);
  });

  it('重複時 overwrite で上書きする', () => {
    const existing = [{ ...sample, title: '旧' }];
    const incoming = [{ ...sample, title: '新' }];
    const { prompts, stats } = mergeImport(existing, incoming, 'overwrite');
    assert.equal(prompts.length, 1);
    assert.equal(prompts[0].title, '新');
    assert.equal(stats.overwritten, 1);
  });

  it('重複時 skip で既存を残す', () => {
    const existing = [{ ...sample, title: '旧' }];
    const incoming = [{ ...sample, title: '新' }];
    const { prompts, stats } = mergeImport(existing, incoming, 'skip');
    assert.equal(prompts[0].title, '旧');
    assert.equal(stats.skipped, 1);
  });

  it('重複時 duplicate で新規IDとして追加する', () => {
    const existing = [{ ...sample }];
    const incoming = [{ ...sample, title: '別' }];
    const { prompts, stats } = mergeImport(existing, incoming, 'duplicate');
    assert.equal(prompts.length, 2);
    assert.equal(stats.duplicated, 1);
    assert.ok(prompts.some((p) => p.id !== 'a1'));
  });
});

describe('searchFilter', () => {
  const items = [
    {
      id: '1',
      title: '夜桜の少女',
      positive: '1girl, cherry blossoms',
      negative: 'lowres',
      tags: ['夜', '桜'],
      favorite: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z',
    },
    {
      id: '2',
      title: '都市の少年',
      positive: '1boy, cityscape',
      negative: '',
      tags: ['街'],
      favorite: false,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z',
    },
  ];

  it('日本語クエリでタイトル・本文・タグを検索する', () => {
    const r = searchFilter(items, { query: '桜' });
    assert.equal(r.length, 1);
    assert.equal(r[0].id, '1');
  });

  it('複数タグ AND とお気に入りフィルタが効く', () => {
    const r = searchFilter(items, { tags: ['夜', '桜'], favoritesOnly: true });
    assert.equal(r.length, 1);
    const r2 = searchFilter(items, { tags: ['夜'], favoritesOnly: false });
    assert.equal(r2.length, 1);
  });

  it('タイトル昇順で並び替える', () => {
    const r = searchFilter(items, { sortBy: 'title', sortDir: 'asc' });
    assert.equal(r[0].title, '夜桜の少女');
    assert.equal(r[1].title, '都市の少年');
  });
});
