import './globals.css';

export const metadata = {
  title: 'pulito | 新潟市南区の完全予約制脱毛サロン',
  description: 'pulitoは新潟市南区の完全予約制プライベート脱毛サロンです。現地決済で気軽に予約できます。',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
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
