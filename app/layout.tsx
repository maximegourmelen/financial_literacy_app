import type { Metadata } from "next";

import { APP_NAME } from "@/lib/config";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "A simple family savings and investing app in HKD."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
