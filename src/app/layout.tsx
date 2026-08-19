import type { Metadata } from "next";
import { Poppins, Righteous } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { HymnStoreProvider } from "@/lib/store";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const righteous = Righteous({
  variable: "--font-righteous",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "ChoirTrack",
  description: "Choir Hymn Tracking System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body
        className={`${poppins.variable} ${righteous.variable} font-sans antialiased h-full overflow-hidden`}
      >
        <HymnStoreProvider>
          {children}
        </HymnStoreProvider>
        <Toaster />
      </body>
    </html>
  );
}
