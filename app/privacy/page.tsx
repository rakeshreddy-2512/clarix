export default function PrivacyPage() {
    return (
        <div style={{
            maxWidth: 700, margin: "0 auto", padding: "40px 24px",
            fontFamily: "Inter, sans-serif", color: "#0f172a", lineHeight: 1.8,
        }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Privacy Policy</h1>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 32 }}>Last updated: July 2026</p>

            <section style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>What is Clarix?</h2>
                <p style={{ color: "#475569", fontSize: 15 }}>
                    Clarix is an unofficial SRM Academia tracker that helps students view their attendance,
                    marks, timetable and academic planner in one place. Clarix is not affiliated with or
                    endorsed by SRM Institute of Science and Technology.
                </p>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>What data we collect</h2>
                <ul style={{ color: "#475569", fontSize: 15, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 8 }}>Your SRM NetID / email (to log in to SRM Academia)</li>
                    <li style={{ marginBottom: 8 }}>Your SRM session cookies (encrypted, stored temporarily)</li>
                    <li style={{ marginBottom: 8 }}>Your Telegram chat ID (only if you enable reminders)</li>
                    <li style={{ marginBottom: 8 }}>Your timetable and planner data (cached for reminders)</li>
                </ul>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>What we do NOT collect</h2>
                <ul style={{ color: "#475569", fontSize: 15, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 8 }}>❌ We never store your SRM password</li>
                    <li style={{ marginBottom: 8 }}>❌ We never sell your data to anyone</li>
                    <li style={{ marginBottom: 8 }}>❌ We never show ads</li>
                    <li style={{ marginBottom: 8 }}>❌ We never share your data with third parties</li>
                </ul>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>How we use your data</h2>
                <ul style={{ color: "#475569", fontSize: 15, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 8 }}>Session cookies are used only to fetch your academic data from SRM</li>
                    <li style={{ marginBottom: 8 }}>Cookies are encrypted with AES-256 and stored securely</li>
                    <li style={{ marginBottom: 8 }}>Cookies are automatically deleted after 2 days</li>
                    <li style={{ marginBottom: 8 }}>Telegram chat ID is used only to send class reminders</li>
                </ul>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Data storage</h2>
                <ul style={{ color: "#475569", fontSize: 15, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 8 }}>Data is stored on Supabase (PostgreSQL) and Upstash Redis</li>
                    <li style={{ marginBottom: 8 }}>Servers are located in secure cloud environments</li>
                    <li style={{ marginBottom: 8 }}>All data transmission is encrypted via HTTPS</li>
                </ul>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Disclaimer</h2>
                <p style={{ color: "#475569", fontSize: 15 }}>
                    Clarix is an independent student project and is not officially affiliated with SRM
                    Institute of Science and Technology. All academic data displayed is fetched directly
                    from SRM Academia using your own credentials. Clarix is provided as-is with no
                    guarantees of accuracy or availability.
                </p>
            </section>

            <section style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Contact</h2>
                <p style={{ color: "#475569", fontSize: 15 }}>
                    For any privacy concerns or data deletion requests, contact us at:{" "}
                    <a href="mailto:yolooo10@proton.me" style={{ color: "#1d4ed8" }}>
                        yolooo10@proton.me
                    </a>
                </p>
            </section>

            <div style={{
                padding: "16px 20px", borderRadius: 12,
                background: "#f0fdf4", border: "1px solid #86efac",
                fontSize: 13, color: "#15803d", fontWeight: 600,
            }}>
                ✅ Clarix never stores your password. Your credentials are used only to authenticate with SRM Academia.
            </div>
        </div>
    );
}