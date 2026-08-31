import type { Metadata } from "next";
import { country } from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  title: `${country.name} Civic Issues Tracker`,
  description: `An interactive dashboard of ${country.name}'s top civic & administrative grievance issues, nationally and state-by-state.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
