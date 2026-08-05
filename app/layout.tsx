import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Clarix — Academia Tracker",
    description: "Track your attendance, marks, timetable and academic planner in one place. Fast, clean and easy to use.",
    keywords: "Clarix, clarixapp, Clarix academia tracker",
    manifest: "/manifest.json",
    icons: {
        icon: "/icon-192.png",
        shortcut: "/icon-192.png",
        apple: "/icon-192.png",
    },
    openGraph: {
        title: "Clarix — SRM Academia Tracker",
        description: "Track your attendance, marks and timetable in one place.",
        url: "https://clarixapp.vercel.app",
        siteName: "Clarix",
        type: "website",
    },
    verification: {
        google: "8_XIrzvoWw_-JG-OJ7G3TMrOyLg0ovrhlENJ9WeX4jo",
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
                <link rel="icon" type="image/png" href="/icon-192.png" />
            </head>
            <body className="mesh-bg antialiased">
                {children}
            </body>
        </html>
    );
}