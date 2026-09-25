import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mailo — Incoming Mail System",
  description: "Next-generation incoming email system powered by Cloudflare Email Workers and FastAPI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
