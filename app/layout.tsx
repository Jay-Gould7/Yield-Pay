import type { Metadata } from "next";

import { Providers } from "./providers";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Yield Pay",
  description: "Execution-focused DeFi routing and vault analysis interface.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark h-full", "font-sans", geist.variable)}>
      <body className="min-h-full bg-[var(--color-bg)] text-[var(--color-text)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
