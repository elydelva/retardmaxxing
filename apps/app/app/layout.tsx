import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-client";
import "@/styles.css";

export const metadata: Metadata = {
  title: "Retardmaxxing",
  description: "App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
