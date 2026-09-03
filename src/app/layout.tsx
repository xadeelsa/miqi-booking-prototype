import type { Metadata } from "next";
import Link from "next/link";
import { Raleway } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
});

export const metadata: Metadata = {
  title: "MIQI Huiswerkbegeleiding - Book a session",
  description:
    "Prototype booking system for MIQI Huiswerkbegeleiding: book tutoring, homework guidance or exam training.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${raleway.variable} h-full antialiased`}>
      <body className={`${raleway.className} flex min-h-full flex-col`}>
        <div className="h-1 bg-accent" aria-hidden />

        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-[0.06em] text-brand-soft">
                MIQI
              </span>
              <span className="hidden text-sm font-medium text-ink sm:inline">
                Huiswerkbegeleiding
              </span>
            </Link>
            <Link
              href="/book"
              className="text-sm font-semibold text-brand transition hover:text-brand-strong"
            >
              Book a session
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
          {children}
        </main>

        <footer className="border-t border-line bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-5 text-xs leading-5 text-muted">
             
          </div>
        </footer>
      </body>
    </html>
  );
}
