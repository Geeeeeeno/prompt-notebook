import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import vm from 'node:vm';

const root = new URL('..', import.meta.url);
const textExt = new Set([
  '.html',
  '.js',
  '.mjs',
  '.css',
  '.md',
  '.txt',
  '.webmanifest',
  '.json',
  '.svg',
]);

function read(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue;
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) walk(abs, out);
    else out.push(abs);
  }
  return out;
}

function textFiles() {
  const base = new URL('.', root).pathname;
  return walk(base).filter((abs) => textExt.has(abs.slice(abs.lastIndexOf('.'))));
}

function loadAds({ hostname, publisherId }) {
  const appended = [];
  const sandbox = {
    location: { hostname },
    document: {
      head: {
        appendChild(el) {
          appended.push(el);
        },
      },
    },
  };
  sandbox.window = {
    PROMPT_NOTEBOOK_ADS: { publisherId },
  };
  sandbox.document.createElement = () => ({
    async: false,
    crossOrigin: null,
    src: '',
  });
  vm.runInNewContext(read('js/ads.js'), sandbox);
  return appended;
}

const pages = ['index.html', 'privacy.html', 'operator.html', 'contact.html'];

const pubPrefix = 'ca-' + 'pub-';

describe('AdSense config', () => {
  it('パブリッシャー ID は ads-config.js に一度だけある', () => {
    const base = new URL('.', root).pathname;
    const hits = [];
    for (const abs of textFiles()) {
      const text = readFileSync(abs, 'utf8');
      const count = text.split(pubPrefix).length - 1;
      if (count > 0) hits.push({ file: relative(base, abs), count });
    }
    assert.deepEqual(hits, [{ file: 'js/ads-config.js', count: 1 }]);
    assert.match(read('js/ads-config.js'), new RegExp(`publisherId:\\s*'${pubPrefix}\\d+'`));
  });

  it('ads.txt は指定の1行', () => {
    const id = read('js/ads-config.js').match(new RegExp(`publisherId:\\s*'(${pubPrefix}\\d+)'`))[1];
    const pub = id.slice('ca-'.length);
    const lines = read('ads.txt')
      .split(/\r?\n/)
      .filter((line) => line.length > 0);
    assert.deepEqual(lines, [`google.com, ${pub}, DIRECT, f08c47fec0942fa0`]);
  });
});

describe('ads.js', () => {
  it('ID がある通常のホストでは自動広告スクリプトを head に足す', () => {
    for (const hostname of ['localhost', '127.0.0.1', 'prompts.example', 'example.vercel.app']) {
      const [script] = loadAds({ hostname, publisherId: 'publisher-id-test' });
      assert.equal(script.async, true);
      assert.equal(script.crossOrigin, 'anonymous');
      assert.equal(
        script.src,
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=publisher-id-test',
      );
    }
  });

  it('ID が空白、または GitHub Pages では読み込まない', () => {
    assert.deepEqual(loadAds({ hostname: 'localhost', publisherId: '' }), []);
    assert.deepEqual(loadAds({ hostname: 'localhost', publisherId: '   ' }), []);
    assert.deepEqual(loadAds({ hostname: 'localhost', publisherId: undefined }), []);
    for (const hostname of ['github.io', 'geeeno.github.io', 'foo.github.io']) {
      assert.deepEqual(loadAds({ hostname, publisherId: 'publisher-id-test' }), []);
    }
    const [script] = loadAds({ hostname: 'github.io.example', publisherId: 'publisher-id-test' });
    assert.equal(script.async, true);
  });
});

describe('pages', () => {
  it('全ページの head で設定のあとローダを読み、フッターから相対リンクする', () => {
    for (const page of pages) {
      const html = read(page);
      const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
      const configAt = head.indexOf('src="./js/ads-config.js"');
      const loaderAt = head.indexOf('src="./js/ads.js"');
      assert.ok(configAt >= 0, page);
      assert.ok(loaderAt > configAt, page);
      assert.equal(head.includes('googlesyndication'), false, page);
      assert.match(html, /href="\.\/privacy\.html"/);
      assert.match(html, /href="\.\/operator\.html"/);
      assert.match(html, /href="\.\/contact\.html"/);
      assert.equal(html.includes('vercel.app'), false, page);
      assert.equal(html.includes('adsbygoogle'), false, page);
    }
  });

  it('案内ページにメールアドレスは無い', () => {
    const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
    for (const page of ['privacy.html', 'operator.html', 'contact.html']) {
      assert.equal(email.test(read(page)), false, page);
    }
    const privacy = read('privacy.html');
    assert.match(privacy, /2026-10-21/);
    assert.match(privacy, /https:\/\/adssettings\.google\.com/);
    assert.match(privacy, /https:\/\/www\.aboutads\.info/);
    assert.match(privacy, /IndexedDB/);
    assert.match(privacy, /localStorage/);
    assert.match(privacy, /アクセス解析は使用していません/);
    assert.match(privacy, /href="\.\/contact\.html"/);
    assert.match(read('operator.html'), /a9toad \/ ジーノ/);
    assert.match(read('operator.html'), /https:\/\/x\.com\/Genogeno_rex/);
    assert.match(read('contact.html'), /@Genogeno_rex/);
    assert.match(read('contact.html'), /ダイレクトメッセージ/);
  });
});

describe('service worker', () => {
  it('広告ドメインを避け、ads.txt と案内ページをネットワークにし、版を上げている', () => {
    const sw = read('sw.js');
    assert.match(sw, /CACHE_VERSION = 'prompt-notebook-v5'/);
    assert.match(sw, /googlesyndication/);
    assert.match(sw, /googleads/);
    assert.match(sw, /doubleclick/);
    assert.match(sw, /if \(isAdNetworkRequest\(url\)\) return/);
    assert.match(sw, /privacy\.html/);
    assert.match(sw, /operator\.html/);
    assert.match(sw, /contact\.html/);
    assert.match(sw, /ads\.txt/);
    assert.match(sw, /networkOnly/);
    assert.match(sw, /networkFirst/);
    assert.equal(sw.includes('./ads.txt'), false);
  });
});
