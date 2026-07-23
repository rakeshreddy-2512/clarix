import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Clarix",
    description: "Track your attendance, marks and timetable",
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
            </head>
            <body className="mesh-bg antialiased">
                {children}
            </body>
        </html>
    );
}