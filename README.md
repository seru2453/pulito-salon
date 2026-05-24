# pulito-salon

完全予約制の脱毛サロン「pulito」の Next.js サイトです。予約フォームは Supabase の `reservations` テーブルへ保存します。決済機能は入れていません。

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` に Supabase の値を設定してください。未設定の場合も画面とフォーム送信はデモモードで動きますが、予約は保存されません。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=your-admin-password
ADMIN_SESSION_SECRET=your-random-session-secret
```

## Supabase

Supabase SQL Editor で [supabase/schema.sql](./supabase/schema.sql) を実行してください。

予約 API は `POST /api/reservations` です。サービスロールキーがある場合はサーバー側で RLS を通して保存します。

管理画面は `/admin` です。`ADMIN_PASSWORD` でログインすると、予約一覧の確認とステータス変更ができます。

## Salon Photos

店内外の写真は `public/images/` に配置します。

```text
public/images/exterior.jpg
public/images/title1.jpg
public/images/dark_exterior.jpg
public/images/bed1.jpg
public/images/wating1.jpg
public/images/bed2.jpg
```

## Scripts

```bash
npm run dev
npm run build
npm start
```
