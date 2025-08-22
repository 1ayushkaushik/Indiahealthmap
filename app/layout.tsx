import { Inter } from "next/font/google";
import "./globals.css";
import { StoreHydration } from '@/components/store-hydration'
import { Navbar } from '@/components/layout/navbar'

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "Disease Dashboard",
  description: "A dashboard for tracking disease spread in India",
  keywords: ["disease", "visualization", "dashboard", "India", "health", "statistics"],
  authors: [{ name: "KCDH IITB" }],
  creator: "KCDH IITB",
  publisher: "KCDH IITB",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Disease Visualization Dashboard",
    description: "Interactive dashboard for visualizing disease data across India",
    url: "https://disease-dashboard.example.com",
    siteName: "Disease Visualization Dashboard",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Disease Visualization Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Disease Visualization Dashboard",
    description: "Interactive dashboard for visualizing disease data across India",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#5bbad5",
      },
    ],
  },
  manifest: "/site.webmanifest",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-sans">
        <StoreHydration />
        {children}
      </body>
    </html>
  );
}
