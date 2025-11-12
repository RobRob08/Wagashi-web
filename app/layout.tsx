// app/layout.tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "./context/cartcontext";
import "./globals.css";
import { DaisyThemeSync } from "@/components/daisyui-sync";
import { NotificationContainer } from "@/components/notification-container";
import { WishlistProvider } from "./context/wishlistcontext";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Wagashi ようこそ",
  description: "Your Japanese Cravings on click of a button",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.className} antialiased`}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <DaisyThemeSync />
          {/* Wrap both CartProvider and WishlistProvider inside ThemeProvider */}
          <CartProvider>
            <WishlistProvider>
              <NotificationContainer />
              {children} {/* Main content goes here */}
            </WishlistProvider>
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
