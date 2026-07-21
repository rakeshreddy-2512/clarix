import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
    title: "Clarix — SRM Academia Tracker",
    description: "Track your SRM Academia attendance, marks and timetable in style",
    manifest: "/manifest.json",
    icons: {
        icon: "/favicon.svg",
        shortcut: "/favicon.svg",
        apple: "/favicon.svg",
    },
};

export const viewport: Viewport = {
    themeColor: "#302b63",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
                <Script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1699973490040764"
                    crossOrigin="anonymous"
                    strategy="afterInteractive"
                />
            </head>
            <body className="mesh-bg antialiased">
                {children}
            </body>
        </html>
    );
}