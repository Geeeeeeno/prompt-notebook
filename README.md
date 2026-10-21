# AIイラスト プロンプト帳

ComfyUI / Animagine XL 4.0 向けの画像生成プロンプトを管理する、日本語 UI の静的 PWA です。

バックエンド・ログイン・ビルド工程は不要です。素の HTML / CSS / JS（ES modules）のみで動作します。画面とプロンプトの保存は外部 CDN・外部フォント・外部ライブラリに依存しません。広告を出すときだけ、後述の AdSense スクリプトを読み込みます。UI アイコンはインライン SVG のみ（絵文字・記号文字アイコンは使いません）。

## 使い方

1. このディレクトリをローカルサーバで配信する（例: `python3 -m http.server 8080`）
2. ブラウザで `http://localhost:8080/` を開く
3. GitHub Pages のサブパス `/prompt-notebook/` でも、相対パスのみを使っているためそのまま動作します

サービスワーカーと IndexedDB を使うため、`file://` ではなく HTTP(S) 経由で開いてください。

## 主な機能

- プロンプトの新規作成・編集・複製・削除（確認あり）
- タイトル / ポジティブ / ネガティブ / タグ / seed / steps / CFG / sampler / scheduler / 解像度 / メモ / サムネイル
- サムネイルなし時はプロンプト内容のハッシュから色相を決めたグラデーション＋星屑アートを表示
- カード上の「ポジ」「ネガ」ピル型コピー（成功時はチェック・波紋・トースト）
- 一覧上部のガラスチップ統計（保存数・お気に入り・タグ数）
- Danbooru 風タグビルダー（カテゴリ別チップ、重み調整、合成プレビューからのワンタップコピー）
- 全文検索・タグ AND フィルタ・お気に入り・並び替え
- JSON インポート / エクスポート（重複時は上書き / スキップ / 複製）
- Web Audio 効果音（ミュート対応）と夜空背景（グロー・星・流れ星、reduced-motion 対応）
- オフライン対応（service worker プリキャッシュ、`prompt-notebook-v5`）とインストール導線

## レイアウト

- コンテナ最大幅 roughly 1400px
- デスクトップ: 左にカードグリッド（`auto-fill` / `minmax(300px, 1fr)`）、右に sticky タグビルダー（幅 380px）
- モバイル: ボトムバー＋タグビルダーはドラッグハンドル付きボトムシート。タイトルは「AIイラスト / プロンプト帳」の2行構成

## ファイル構成

| パス | 役割 |
| --- | --- |
| `index.html` | シェル UI |
| `styles.css` | スタイル |
| `js/app.js` | UI オーケストレーション |
| `js/db.js` | IndexedDB |
| `js/logic.js` | 純粋ロジック（合成・パース・I/O・検索・アート色） |
| `js/tags.js` | タグ辞書 |
| `js/icons.js` | インライン SVG アイコン / ロゴ / 空状態イラスト |
| `js/sound.js` | Web Audio 効果音 |
| `js/bg.js` | 背景キャンバス演出 |
| `sw.js` | Service Worker（`CACHE_VERSION = prompt-notebook-v5`） |
| `manifest.webmanifest` | PWA マニフェスト |
| `js/ads-config.js` | AdSense パブリッシャー ID（定義はここだけ） |
| `js/ads.js` | 自動広告スクリプトの挿入（GitHub Pages と空 ID では何もしない） |
| `ads.txt` | AdSense の ads.txt |
| `privacy.html` | プライバシーポリシー |
| `operator.html` | 運営者情報 |
| `contact.html` | お問い合わせ |
| `icons/` | ロゴ・favicon・アプリアイコン（PNG 含む） |
| `tests/logic.test.mjs` | Node 組み込みテスト |
| `tests/ads.test.mjs` | 広告設定のテスト |

## テスト

```bash
npm test
```

内部では `node --test tests/` を実行します（Node 20 想定）。

## 独自ドメイン（AdSense）

広告スクリプトは、ホスト名が `*.github.io` のときだけ読み込みません。それ以外（ローカル、Vercel の既定ホスト、独自ドメイン）では、`js/ads-config.js` の ID が入っていれば自動広告のスクリプトを head に足します。ID を空にすると、どのホストでも読み込みません。

Google AdSense は `*.vercel.app` のサイトを掲載先として追加できません。審査と配信には独自ドメインが必要です。ページ内のリンクは相対パスだけなので、ドメインを足しても HTML を書き換える必要はありません。手動の広告枠は置いていません。編集やコピーの上に枠は出しません。画面を覆うアンカー広告やビネットは、AdSense の管理画面側でオフにすると操作の邪魔になりにくいです。

1. Vercel のプロジェクトで Settings → Domains を開き、取得済みのドメインを追加する
2. その画面に出た DNS レコードを、レジストラまたは DNS に設定する。値はその画面が正です。多くの場合、apex は A レコード、`www` などのサブドメインは CNAME です。別プロジェクトの値はコピーしないでください。第三者 DNS では AAAA を残すと証明書の発行が止まることがあるので、案内が A レコードだけなら AAAA は外します
3. 状態が Valid になり、HTTPS でページが開くまで待つ
4. `https://<そのドメイン>/ads.txt` を開き、リポジトリ直下の `ads.txt` と同じ 1 行であることを確認する
5. AdSense のサイトに、その独自ドメインを追加する

## ライセンス

個人利用・学習用途を想定したサンプルです。必要に応じて自由に改変してください。
