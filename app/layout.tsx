import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dmitry Naidionov | Career Twin",
  description:
    "Career Twin for Dmitry Naidionov: a structured, evidence-based view of experience, strengths, and likely role fit."
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
