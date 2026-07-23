import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/attendance", "/marks", "/timetable", "/calendar", "/profile"],
        },
        sitemap: "https://clarixapp.vercel.app/sitemap.xml",
    };
}