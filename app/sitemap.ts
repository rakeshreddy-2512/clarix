export default function sitemap() {
    return [
        {
            url: "https://clarixapp.vercel.app",
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 1,
        },
        {
            url: "https://clarixapp.vercel.app/login",
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.8,
        },
    ];
}