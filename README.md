# LEAF-Writer Next.js

TEIドキュメントのためのWebベースXMLエディタ [CWRC LEAF-Writer](https://github.com/cwrc/leaf-writer) を Next.js でラップしたアプリケーションです。

## 機能

- TEI/XML ドキュメントの編集
- GitHub OAuth 認証
- GitHub リポジトリとの連携（読み込み・保存）
- ダークモード対応
- 多言語対応（日本語・英語）
- Docker 対応

## 必要条件

- Node.js 20 以上
- npm

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
AUTH_SECRET=your-auth-secret-key
AUTH_GITHUB_ID=your-github-oauth-app-id
AUTH_GITHUB_SECRET=your-github-oauth-app-secret
```

GitHub OAuth App は [GitHub Developer Settings](https://github.com/settings/developers) から作成できます。

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | プロダクションビルドを作成 |
| `npm run start` | プロダクションサーバーを起動 |
| `npm run lint` | ESLint でコードをチェック |

## Docker での実行

### ビルド

```bash
docker build -t leaf-writer-nextjs .
```

### 実行

```bash
docker run -p 3000:3000 \
  -e AUTH_SECRET=your-auth-secret-key \
  -e AUTH_GITHUB_ID=your-github-oauth-app-id \
  -e AUTH_GITHUB_SECRET=your-github-oauth-app-secret \
  leaf-writer-nextjs
```

## 技術スタック

- [Next.js](https://nextjs.org/) 15
- [React](https://react.dev/) 18
- [CWRC LEAF-Writer](https://github.com/cwrc/leaf-writer)
- [NextAuth.js](https://authjs.dev/)
- [next-intl](https://next-intl-docs.vercel.app/)
- [next-themes](https://github.com/pacocoursey/next-themes)
- [Tailwind CSS](https://tailwindcss.com/)

## ライセンス

[MIT License](LICENSE)
