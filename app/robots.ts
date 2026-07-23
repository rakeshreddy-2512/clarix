export default function robots() {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/attendance", "/marks", "/timetable", "/calendar", "/profile"],
        },
        sitemap: "https://clarixapp.vercel.app/sitemap.xml",
    };
}