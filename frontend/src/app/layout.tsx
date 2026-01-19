import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "THE WASHHOUSE | AI LOG REFINERY",
  description: "High-fidelity AI conversation log extraction and refinement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jbMono.variable} font-mono antialiased matrix-grid min-h-screen relative`}>
        {/* Overlay Effects */}
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 animate-scanline scanline"></div>
        </div>
        {children}
      </body>
    </html>
  );
}
