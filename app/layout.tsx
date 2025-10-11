import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"  
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Celeste Hardlist",
  description: "Database of Celeste's hardest maps and most skilled players",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="./favicon_io/apple-touch-icon.png"/>
        <link rel="icon" type="image/png" sizes="16x16" href="./favicon_io/favicon-32x32.png"/>
        <link rel="icon" type="image/png" sizes="16x16" href="./favicon_io/favicon-16x16.png"/>
        <link rel="manifest" href="./favicon_io/site.webmanifest"/>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <SessionProvider>
          <Navbar />
          <main className="flex-1 py-8">
            {children}
          </main>
          <Footer />
        </SessionProvider>
        <Analytics />

      </body>
    </html>
  );
}
