import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AskWatiDrawerProvider } from "./lib/ask-wati-drawer";
import { NotificationsProvider } from "./lib/notifications";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ask Wati",
  description: "Ask Wati home",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <NotificationsProvider>
          <AskWatiDrawerProvider>{children}</AskWatiDrawerProvider>
        </NotificationsProvider>
      </body>
    </html>
  );
}
