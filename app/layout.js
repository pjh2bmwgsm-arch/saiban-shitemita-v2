import "./globals.css";

export const metadata = {
  title: "裁判してみた",
  description: "あらゆる揉め事をAIとみんなで判定するアプリ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
