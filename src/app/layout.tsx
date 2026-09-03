import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Raleway } from "next/font/google";
const raleway = Raleway({ subsets: ["latin"], variable: "--font-raleway" });

export const metadata: Metadata = {
  title: "MIQI Huiswerkbegeleiding — Book a session",
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
      <body className="min-h-full flex flex-col">
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-semibold tracking-tight text-ink">
              MIQI <span className="text-brand">Huiswerkbegeleiding</span>
            </Link>
            <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">
              Prototype
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
          {children}
        </main>

        <footer className="border-t border-line bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-5 text-xs text-muted">
            Demo environment with fictitious data. Payment, email and calendar
            integrations are simulated.
          </div>
        </footer>
      </body>
    </html>
  );
}
