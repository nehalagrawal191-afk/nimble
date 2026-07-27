import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nimble GTM Signal Agent",
  description: "A real-time GTM intelligence newsletter agent powered by Nimble web data."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
