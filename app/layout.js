import './globals.css';

export const metadata = {
  title: 'pulito | 完全予約制の脱毛サロン',
  description: 'pulitoは完全予約制のプライベート脱毛サロンです。現地決済で気軽に予約できます。',
  verification: {
    google: '-_i0UABPJD2iuytgVi7LpVWSUK3l3e-u_fx3acWAjsw',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
