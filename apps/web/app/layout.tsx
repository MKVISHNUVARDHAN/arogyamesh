import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ArogyaMesh | Network resilience",
  description: "Predict shortages. Protect every PHC.",
  manifest: "/manifest.webmanifest",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
