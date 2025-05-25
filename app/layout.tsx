import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers/auth-provider";
import Navigation from "./components/navigation";
import JsonLd from "./components/JsonLd";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
  minimumScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://texturnhub.com"),
  title: {
    default: "TexTurn Hub - Sustainable Textile Waste Management Platform",
    template: "%s | TexTurn Hub",
  },
  description:
    "TexTurn Hub connects textile waste providers with skilled artisans, promoting sustainable fashion and circular economy. Transform waste into valuable products while reducing environmental impact.",
  keywords: [
    "textile waste management",
    "sustainable fashion",
    "circular economy",
    "artisan marketplace",
    "upcycled textiles",
    "eco-friendly fashion",
    "waste reduction",
    "sustainable manufacturing",
    "textile recycling",
    "ethical fashion",
  ],
  authors: [{ name: "TexTurn Hub Team" }],
  creator: "TexTurn Hub",
  publisher: "TexTurn Hub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://texturnhub.com",
    siteName: "TexTurn Hub",
    title: "TexTurn Hub - Sustainable Textile Waste Management Platform",
    description:
      "Transform textile waste into valuable products. Join our sustainable marketplace connecting waste providers with skilled artisans.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TexTurn Hub - Sustainable Textile Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TexTurn Hub - Sustainable Textile Solutions",
    description:
      "Transform textile waste into valuable products. Join our sustainable marketplace connecting waste providers with skilled artisans.",
    images: ["/images/twitter-image.jpg"],
    creator: "@texturnhub",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-site-verification",
  },
  alternates: {
    canonical: "https://texturnhub.com",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="light">
      <head>
        <JsonLd />
      </head>
      <body
        className={`
          ${inter.className} 
          font-sans 
          antialiased 
          bg-gradient-to-br 
          from-slate-50 
          to-gray-100 
          min-h-screen 
          text-gray-900
          selection:bg-blue-100 
          selection:text-blue-900
        `}
      >
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
              {children}
            </main>
            <footer className="mt-auto py-4 text-center text-sm text-gray-500 border-t border-gray-200">
              <div className="container mx-auto px-4">
                © 2024 TexTurn Hub. Building a sustainable future together.
              </div>
            </footer>
          </div>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
