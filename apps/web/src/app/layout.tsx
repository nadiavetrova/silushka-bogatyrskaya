import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/images/druzhina.png" />
      </head>
      <body className="antialiased min-h-screen text-[#f5eed8]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
