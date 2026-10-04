import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: { default: "Multiverse Match", template: "%s · Multiverse Match" },
  description: "Create and share picture-based Marvel character connection puzzles. No account needed.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <span>Fan-made puzzle project. Not affiliated with or endorsed by Marvel.</span>
          <a href="https://github.com/akabab/superhero-api" target="_blank" rel="noreferrer">Character data &amp; portraits: Superhero API</a>
        </footer>
      </body>
    </html>
  );
}
