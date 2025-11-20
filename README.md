# ごはんコミュニティ Frontend

Next.js (App Router) + Tailwind CSS + shadcn/ui を使った MVP フロントエンドです。Docker 上で動作する API サーバーと `NEXT_PUBLIC_API_BASE_URL` で通信します。

## セットアップ

1. Node.js 18 以上をインストールします。
2. 依存関係をインストール:

```bash
npm install
```

3. 環境変数ファイルを作成:

```bash
cp .env.local.example .env.local
```

`.env.local` には API サーバーの URL を記載します。

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_DEV_APPROVE_ENDPOINT=http://localhost:3001/api/dev/approve-me # 任意
NEXT_PUBLIC_DEV_RESET_ENDPOINT=http://localhost:3001/api/dev/reset-status   # 任意
NEXT_PUBLIC_DEV_RESET_LIKE_ENDPOINT=http://localhost:3001/api/dev/reset-like-state # 任意
NEXT_PUBLIC_ADMIN_SEED_DELETE_ENDPOINT=http://localhost:3001/api/admin/seed-admin # 任意
NEXT_PUBLIC_ENABLE_SEED_ADMIN=true # 任意
NEXT_PUBLIC_SEED_EMAIL=seed@example.com           # 任意
NEXT_PUBLIC_SEED_PASSWORD=password123             # 任意
```

4. 開発サーバーを起動:

```bash
npm run dev
```

Next.js が `http://localhost:3000` で立ち上がります。Docker コンテナで動かしている API (`http://localhost:3001` など) へは `NEXT_PUBLIC_API_BASE_URL` が使われます。

## 主な技術

- **Next.js 14 App Router**: `/app` ディレクトリベース、SSR/CSR を適宜切り替え
- **TypeScript** + ESLint + strict mode
- **Tailwind CSS + shadcn/ui 風コンポーネント**: 落ち着いたモダン UI を構築
- **React Query**: 全 API のフェッチ・キャッシュ・エラーハンドリング
- **Auth Context**: ログイン状態とトークンをグローバル管理（localStorage 永続化）

## 実装済み画面

| Path | 概要 |
| --- | --- |
| `/` | ヒーロー / プロダクト紹介 |
| `/login`, `/register` | 認証導線、フォームバリデーション |
| `/community/join` | コミュニティ参加申請 + ステータス表示 |
| `/profile` | プロフィール編集（名前 + 「どんな人とご飯に行きたいか」） |
| `/members` | コミュニティ承認済みメンバー一覧 |
| `/match/like` | YES/NO ボタン型の「ご飯行きたい」判定フロー |
| `/matches` | マッチ一覧 + モーダル |
| `/admin` | 承認待ちユーザー管理（承認/拒否） |

## メモ

- すべての API リクエストは `lib/api.ts` の `apiFetch` で集約し、`Authorization: Bearer` ヘッダーを自動付与します。
- React Query を使うことで、API のエラーバナー表示や再取得が統一されています。`hooks/use-community-status.ts` では 15 秒ごとに承認状況をポーリングします。
- `.env.local` に `NEXT_PUBLIC_DEV_APPROVE_ENDPOINT` を設定すると、コミュニティ申請画面に開発者向けのボタンが表示され、`lib/dev-tools.ts` を介して開発用エンドポイントを呼び出せます（必要なら `NEXT_PUBLIC_DEV_RESET_ENDPOINT` や `NEXT_PUBLIC_DEV_RESET_LIKE_ENDPOINT`、`NEXT_PUBLIC_ADMIN_SEED_DELETE_ENDPOINT` も追加可能）。バックエンドの `.env` に `NODE_ENV=development` が追加されたため、API コンテナを起動すると dev ルートが必ず有効化されます。もしバックエンド側でモードを変更した場合は、フロントの `NEXT_PUBLIC_API_BASE_URL` も合わせて更新してください。
- 開発環境で seed 用のログイン情報を共有したい場合は `NEXT_PUBLIC_SEED_EMAIL` / `NEXT_PUBLIC_SEED_PASSWORD` を設定するとログイン画面に表示されます。
