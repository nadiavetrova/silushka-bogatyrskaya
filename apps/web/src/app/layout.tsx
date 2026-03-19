import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Силушка Богатырская — Тренируйся по-древнеславянски",
  description: "Тренируйся по-древнеславянски! Адаптивный трекер тренировок.",
  manifest: "/manifest.json",
  themeColor: "#111210",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Силушка",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/images/druzhina.png" />
      </head>
      <body className="antialiased min-h-screen text-[#f5eed8]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
