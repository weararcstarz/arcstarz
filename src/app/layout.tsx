import type { Metadata } from "next";
import { AuthProvider } from '@/contexts/AuthContext';
import { PerfectCurrencyProvider } from '@/contexts/PerfectCurrencyContext';
import { CartProvider } from '@/contexts/CartContext';
import UserSyncInitializer from '@/components/UserSyncInitializer';
import NotificationSystem from '@/components/NotificationSystem';
import AdminFooter from '@/components/AdminFooter';
import "@/services/userSyncService"; // Auto-initialize user sync service
import "@/services/connectedSystem"; // Auto-initialize connected system
import "./globals.css";

export const metadata: Metadata = {
  title: "ARCSTARZ - Faith in Motion",
  description: "Luxury streetwear ecommerce experience. Limited edition drops and uncompromising quality.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes",
  themeColor: "#0A0A0A",
  icons: {
    icon: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/apple-touch-icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/apple-touch-icon-76x76.png", sizes: "76x76", type: "image/png" }
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "ARCSTARZ - Faith in Motion",
    description: "Luxury streetwear ecommerce experience. Limited edition drops and uncompromising quality.",
    url: "https://arcstarz.com",
    siteName: "ARCSTARZ",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ARCSTARZ - Faith in Motion",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ARCSTARZ - Faith in Motion",
    description: "Luxury streetwear ecommerce experience. Limited edition drops and uncompromising quality.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-touch-icon-76x76.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0A0A0A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="ARCSTARZ" />
        <meta name="apple-mobile-web-app-title" content="ARCSTARZ" />
        <meta name="msapplication-TileColor" content="#0A0A0A" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <PerfectCurrencyProvider>
            <CartProvider>
              <UserSyncInitializer />
              <NotificationSystem />
              {children}
              <AdminFooter />
            </CartProvider>
          </PerfectCurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
