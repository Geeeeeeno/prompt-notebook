/**
 * IndexedDB ラッパ — prompts ストア
 * サムネイル Blob も同一レコードに保存
 */

const DB_NAME = 'prompt-notebook';
const DB_VERSION = 1;
const STORE = 'prompts';
const META = 'meta';

/** @type {IDBDatabase|null} */
let dbPromise = null;

/**
 * @returns {Promise<IDBDatabase>}
 */
export function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('favorite', 'favorite', { unique: false });
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

/**
 * @template T
 * @param {string} storeName
 * @param {IDBTransactionMode} mode
 * @param {(store: IDBObjectStore) => IDBRequest|void} fn
 * @returns {Promise<T>}
 */
async function withStore(storeName, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let req;
    try {
      req = fn(store);
    } catch (e) {
      reject(e);
      return;
    }
    tx.oncomplete = () => resolve(req ? req.result : undefined);
    tx.onerror = () => reject(tx.error);
    if (req) {
      req.onerror = () => reject(req.error);
    }
  });
}

/** @returns {Promise<object[]>} */
export async function getAllPrompts() {
  return withStore(STORE, 'readonly', (store) => store.getAll());
}

/** @param {string} id */
export async function getPrompt(id) {
  return withStore(STORE, 'readonly', (store) => store.get(id));
}

/** @param {object} prompt */
export async function putPrompt(prompt) {
  const record = {
    ...prompt,
    updatedAt: prompt.updatedAt || new Date().toISOString(),
  };
  await withStore(STORE, 'readwrite', (store) => store.put(record));
  return record;
}

/** @param {string} id */
export async function deletePrompt(id) {
  await withStore(STORE, 'readwrite', (store) => store.delete(id));
}

/** @param {object[]} prompts */
export async function putAllPrompts(prompts) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const p of prompts) {
      store.put(p);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** 全件置換 */
export async function replaceAllPrompts(prompts) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    store.clear();
    for (const p of prompts) {
      store.put(p);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMeta(key) {
  const row = await withStore(META, 'readonly', (store) => store.get(key));
  return row ? row.value : undefined;
}

export async function setMeta(key, value) {
  await withStore(META, 'readwrite', (store) => store.put({ key, value }));
}

/**
 * 画像ファイルを canvas で縮小して Blob 化
 * @param {File|Blob} file
 * @param {number} [maxSize]
 * @returns {Promise<Blob>}
 */
export async function resizeImageToBlob(file, maxSize = 512) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('画像の変換に失敗しました'));
      },
      'image/jpeg',
      0.85,
    );
  });
}

/** @param {Blob} blob */
export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** @param {string} dataUrl */
export async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

/**
 * 初回サンプル投入
 * @param {() => object[]} factory
 */
export async function ensureSeedData(factory) {
  const seeded = await getMeta('seeded');
  if (seeded) return false;
  const all = await getAllPrompts();
  if (all.length > 0) {
    await setMeta('seeded', true);
    return false;
  }
  const samples = factory();
  await putAllPrompts(samples);
  await setMeta('seeded', true);
  return true;
}
