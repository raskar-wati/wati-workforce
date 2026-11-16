import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AskWatiSettingsDialog } from "./components/settings/AskWatiSettingsDialog";
import { AskWatiDrawerProvider } from "./lib/ask-wati-drawer";
import { AskWatiSettingsProvider } from "./lib/ask-wati-settings";
import { NotificationsProvider } from "./lib/notifications";
import { ShellLayoutProvider } from "./lib/shell-layout";

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
          <AskWatiDrawerProvider>
            <AskWatiSettingsProvider>
              <ShellLayoutProvider>{children}</ShellLayoutProvider>
              <AskWatiSettingsDialog />
            </AskWatiSettingsProvider>
          </AskWatiDrawerProvider>
        </NotificationsProvider>
      </body>
    </html>
  );
}
