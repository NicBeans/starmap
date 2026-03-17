import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StarMap - Sky Viewer",
  description:
    "Interactive sky map showing stars, planets, and satellites above your head",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0a0a1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-sky-bg text-sky-text overflow-hidden h-dvh w-dvw">
        {children}
      </body>
    </html>
  );
}
