import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers/auth-provider";
import Navigation from "./components/navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TexTurn Hub",
  description: "A sustainable platform connecting textile waste providers with artisans",
  keywords: ["textile", "sustainability", "artisans", "waste management"],
  authors: [{ name: "TexTurn Hub Team" }],
  viewport: "width=device-width, initial-scale=1",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="light">
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
      </body>
    </html>
  );
}