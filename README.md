# Team Dalton

Team Dalton の公式サイト。[Astro](https://astro.build/) で作られた静的サイトです。

## 動かし方

```bash
npm install
npm run dev      # http://localhost:4321 でプレビュー
npm run build    # dist/ に公開用ファイルを書き出す
```

## フォルダ構成

| 場所 | 中身 |
|---|---|
| `src/pages/` | 各ページ(ホーム、About、Works 一覧、作品ページ) |
| `src/content/works/` | 作品データ。1 作品 = 1 つの Markdown ファイル |
| `src/layouts/Base.astro` | 全ページ共通のナビ、フッター、イントロ動画 |
| `src/styles/global.css` | デザイン(色やフォントは冒頭の `:root` で一括管理) |
| `public/media/` | 画像・動画 |
| `public/downloads/` | 配布ワールド |
| `_legacy/` | リニューアル前のサイト(バックアップ。公開されません) |

## 作品の動画を取り込む(マインクラフトカップ 2024 / 2025 / 2026)

1. 元の動画をそのまま `incoming/` フォルダに入れ、年の名前を付ける(例: `incoming/2026.mov`)。
2. 次を実行する。

```bash
npm run import-videos
```

これだけで、Web 用に圧縮した動画とカバー画像が `public/media/<作品>/` に作られ、
作品ページが公開されて動画プレイヤーが表示されます(ffmpeg が必要: `brew install ffmpeg`)。

## 作品の文章や画像を編集する

`src/content/works/<作品>.md` を編集します。1 作品 = 1 ファイルです。

```md
---
title: 作品名
event: Minecraft Cup 2026
year: 2026
theme: その年の大会テーマ
photoCaption: 記念写真の説明(例: 全国大会 東京大学にて)
awards:
  - 東京都代表
  - 全国大会 学校賞
gallery:
  - /media/minecraft-cup-2026/01.webp
draft: false
---

ここから下が作品の説明文です。Markdown で自由に書けます。
```

記念写真は `public/media/<作品>/photo.webp` に置くと、説明文の横に自動で表示されます。

ギャラリーは `public/media/<作品>/gallery/` に画像(`01.webp`, `02.webp` …)を入れるだけで、ファイル名の順に自動で表示されます。1 枚目が大きく表示されます。

`title`・`year` 以外は省略できます(`category` を書くとタイトルの上に「年 ・ カテゴリ」が小さく表示されます)。`draft: true` の間は、一覧に「準備中」のカードだけが表示され、作品ページは作られません。

## 素材の目安

- 画像: 横 1920px 程度の WebP(`cwebp -q 80 input.png -o output.webp`)
- 動画: 1080p・H.264 の MP4、音声なしの背景用クリップは 1 本 1MB 前後

## サブフォルダで公開する場合

`https://example.github.io/<リポジトリ名>/` のようにサブフォルダで公開するときは、ビルド時に指定します。

```bash
SITE_URL=https://example.github.io BASE_PATH=/<リポジトリ名> npm run build
```
