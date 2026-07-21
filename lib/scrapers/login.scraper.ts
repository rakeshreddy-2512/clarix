import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import QueryString from "qs";
import { parseAttendance } from "@/lib/parsers/attendance.parser";
import { parseMarks } from "@/lib/parsers/marks.parser";
import { parseProfile } from "@/lib/parsers/profile.parser";
import { parseTimetable } from "@/lib/parsers/timetable.parser";
import { cacheData, getCachedData } from "@/lib/redis";
import crypto from "crypto";

const SRM_BASE = "https://academia.srmist.edu.in";
const TIMETABLE_URL = `${SRM_BASE}/srm_university/academia-academic-services/page/My_Time_Table_2023_24`;

export interface LoginResult {
    success: boolean;
    cookies?: string;
    name?: string;
    regNo?: string;
    error?: string;
    sessionExceeded?: boolean;
}

interface PrefetchSession {
    jar: CookieJar;
    client: ReturnType<typeof createClient>["client"];
    digest?: string;
    identifier?: string;
    createdAt: number;
    awaitingForceTerminate?: boolean;
}

const prefetchSessions = new Map<string, PrefetchSession>();

setInterval(() => {
    const now = Date.now();
    for (const [key, session] of prefetchSessions.entries()) {
        if (now - session.createdAt > 5 * 60 * 1000) {
            prefetchSessions.delete(key);
        }
    }
}, 60 * 1000);

function hashData(data: unknown): string {
    return crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");
}

function createClient() {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar, withCredentials: true }));
    return { jar, client };
}

async function getXcsrfToken(jar: CookieJar): Promise<string> {
    const cookies = await jar.getCookies(SRM_BASE);
    const iamcsr = cookies.find((c) => c.key === "iamcsr")?.value;
    if (!iamcsr) throw new Error("iamcsr cookie not found");
    return `iamcsrcoo=${iamcsr}`;
}

async function fetchHtml(cookie: string, url: string): Promise<string> {
    const res = await axios.request({
        method: "get",
        url,
        headers: {
            Cookie: cookie,
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            Referer: "https://academia.srmist.edu.in/",
        },
    });
    return res.data;
}

export async function fetchAndCacheAllData(cookies: string, regNo: string): Promise<void> {
    try {
        console.log(`📚 Background fetching all data for: ${regNo}`);
        const timetableHtml = await fetchHtml(cookies, TIMETABLE_URL);
        if (timetableHtml.length < 500) return;
        await cacheAll(timetableHtml, regNo);
        console.log(`✅ Background cache complete for: ${regNo}`);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("❌ fetchAndCacheAllData error:", message);
    }
}

async function cacheAll(timetableHtml: string, regNo: string) {
    const attendance = parseAttendance(timetableHtml);
    const marks = parseMarks(timetableHtml);
    const profile = parseProfile(timetableHtml);
    const timetable = parseTimetable(timetableHtml);

    await Promise.all([
        cacheData(`attendance:${regNo}`, attendance, 3000),
        cacheData(`attendance:${regNo}:hash`, hashData(attendance), 3000),
        cacheData(`marks:${regNo}`, marks, 86400),
        cacheData(`marks:${regNo}:hash`, hashData(marks), 86400),
        cacheData(`profile:${regNo}`, profile, 2592000),
        cacheData(`profile:${regNo}:hash`, hashData(profile), 2592000),
        cacheData(`timetable:${regNo}`, timetable, 86400),
        cacheData(`timetable:${regNo}:hash`, hashData(timetable), 86400),
    ]);
}

export async function prefetchSession(sessionId: string): Promise<void> {
    try {
        console.log(`🔄 Prefetching session: ${sessionId}`);
        const { jar, client } = createClient();
        await client.get(SRM_BASE);
        await client.get(`${SRM_BASE}/accounts/p/10002227248/signin?hide_fp=true&orgtype=40&service_language=en&css_url=/49910842/academia-academic-services/downloadPortalCustomCss/login&dcc=true&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2Facademia-academic-services%2FredirectFromLogin`);
        prefetchSessions.set(sessionId, { jar, client, createdAt: Date.now() });
        console.log(`✅ Prefetch complete: ${sessionId}`);
    } catch (error) {
        console.error(`❌ Prefetch failed: ${sessionId}`, error);
        prefetchSessions.delete(sessionId);
    }
}

export async function lookupUser(sessionId: string, username: string): Promise<{ success: boolean; error?: string }> {
    try {
        const session = prefetchSessions.get(sessionId);
        if (!session) {
            await prefetchSession(sessionId);
            return lookupUser(sessionId, username);
        }
        const { jar, client } = session;
        const xcsrf1 = await getXcsrfToken(jar);
        const normalizedUsername = username.includes("@") ? username : `${username}@srmist.edu.in`;
        const lookupRes = await client.request({
            method: "post",
            url: `${SRM_BASE}/accounts/p/10002227248/signin/v2/lookup/${normalizedUsername}`,
            headers: { Origin: SRM_BASE, Host: "academia.srmist.edu.in", "x-zcsrf-token": xcsrf1, "Content-Type": "application/x-www-form-urlencoded" },
            data: QueryString.stringify({ mode: "primary", servicename: "ZohoCreator", service_language: "en", serviceurl: SRM_BASE }),
        });
        if (lookupRes.data?.errors) { prefetchSessions.delete(sessionId); return { success: false, error: lookupRes.data.localized_message || "Invalid username" }; }
        if (!lookupRes.data?.lookup?.digest) { prefetchSessions.delete(sessionId); return { success: false, error: "Invalid username" }; }
        session.digest = lookupRes.data.lookup.digest;
        session.identifier = lookupRes.data.lookup.identifier;
        prefetchSessions.set(sessionId, session);
        console.log(`✅ Lookup success for: ${normalizedUsername}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Lookup failed:`, error);
        prefetchSessions.delete(sessionId);
        return { success: false, error: "Lookup failed" };
    }
}

export async function submitPassword(sessionId: string, username: string, password: string, forceTerminate: boolean = false): Promise<LoginResult> {
    try {
        const session = prefetchSessions.get(sessionId);
        if (!session || !session.digest || !session.identifier) {
            return performFullLogin(username, password, forceTerminate);
        }
        const { jar, client } = session;

        if (session.awaitingForceTerminate && forceTerminate) {
            console.log("⚡ Reusing session for force terminate");
            const xcsrf3 = await getXcsrfToken(jar);
            await client.request({ method: "delete", url: `${SRM_BASE}/accounts/p/40-10002227248/webclient/v1/announcement/pre/blocksessions`, headers: { "Content-Type": "application/x-www-form-urlencoded", "x-zcsrf-token": xcsrf3, Referer: `${SRM_BASE}/accounts/p/40-10002227248/preannouncement/block-sessions`, Origin: SRM_BASE } });
            await client.get(`${SRM_BASE}/accounts/p/40-10002227248/preannouncement/block-sessions/next`);
            await client.get(`${SRM_BASE}/portal/academia-academic-services/redirectFromLogin`);
            const cookies = jar.getCookieStringSync(SRM_BASE);
            prefetchSessions.delete(sessionId);
            const normalizedRegNo = username.includes("@") ? username.split("@")[0].toUpperCase() : username.toUpperCase();
            const cachedProfile = await getCachedData<{ name?: string; regNo?: string }>(`profile:${normalizedRegNo}`);
            const name = cachedProfile?.name || "Student";
            const regNo = cachedProfile?.regNo || normalizedRegNo;
            fetchAndCacheAllData(cookies, regNo).catch(() => { });
            return { success: true, cookies, name, regNo };
        }

        const { digest, identifier } = session;
        const xcsrf2 = await getXcsrfToken(jar);
        console.log(`🔐 Submitting password for: ${username}`);
        const passRes = await client.request({
            method: "post",
            url: `${SRM_BASE}/accounts/p/10002227248/signin/v2/primary/${identifier}/password?digest=${digest}&cli_time=${Date.now()}&servicename=ZohoCreator&service_language=en&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2F`,
            headers: { "x-zcsrf-token": xcsrf2, "Content-Type": "application/json" },
            data: JSON.stringify({ passwordauth: { password } }),
        });

        function htmlUnescape(str: string) { return str.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec)); }

        if (passRes.data?.errors) { prefetchSessions.delete(sessionId); return { success: false, error: htmlUnescape(passRes.data.localized_message || "Login failed") }; }

        const redirectUrl = passRes.data?.passwordauth?.redirect_uri;
        if (redirectUrl?.includes("block-sessions")) {
            if (!forceTerminate) {
                prefetchSessions.set(sessionId, { ...session, jar, client, createdAt: Date.now(), awaitingForceTerminate: true });
                return { success: false, sessionExceeded: true, error: "SESSION_EXCEEDED", cookies: jar.getCookieStringSync(SRM_BASE) };
            }
            const xcsrf3 = await getXcsrfToken(jar);
            await client.request({ method: "delete", url: `${SRM_BASE}/accounts/p/40-10002227248/webclient/v1/announcement/pre/blocksessions`, headers: { "Content-Type": "application/x-www-form-urlencoded", "x-zcsrf-token": xcsrf3, Referer: `${SRM_BASE}/accounts/p/40-10002227248/preannouncement/block-sessions`, Origin: SRM_BASE } });
        }

        await client.get(`${SRM_BASE}/accounts/p/40-10002227248/preannouncement/block-sessions/next`);
        await client.get(`${SRM_BASE}/portal/academia-academic-services/redirectFromLogin`);
        const cookies = jar.getCookieStringSync(SRM_BASE);
        prefetchSessions.delete(sessionId);

        const normalizedRegNo = username.includes("@") ? username.split("@")[0].toUpperCase() : username.toUpperCase();
        const cachedProfile = await getCachedData<{ name?: string; regNo?: string }>(`profile:${normalizedRegNo}`);
        const name = cachedProfile?.name || "Student";
        const regNo = cachedProfile?.regNo || normalizedRegNo;

        console.log(`✅ Login successful! User: ${name} — ${regNo}`);
        fetchAndCacheAllData(cookies, regNo).catch((err) => { console.error("❌ Background fetch failed:", err.message); });
        return { success: true, cookies, name, regNo };

    } catch (error: unknown) {
        prefetchSessions.delete(sessionId);
        const message = error instanceof Error ? error.message : "Login failed";
        console.error("❌ Login error:", message);
        return { success: false, error: message };
    }
}

async function performFullLogin(username: string, password: string, forceTerminate: boolean): Promise<LoginResult> {
    const { jar, client } = createClient();
    try {
        await client.get(SRM_BASE);
        await client.get(`${SRM_BASE}/accounts/p/10002227248/signin?hide_fp=true&orgtype=40&service_language=en&css_url=/49910842/academia-academic-services/downloadPortalCustomCss/login&dcc=true&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2Facademia-academic-services%2FredirectFromLogin`);
        const xcsrf1 = await getXcsrfToken(jar);
        const normalizedUsername = username.includes("@") ? username : `${username}@srmist.edu.in`;
        const lookupRes = await client.request({ method: "post", url: `${SRM_BASE}/accounts/p/10002227248/signin/v2/lookup/${normalizedUsername}`, headers: { Origin: SRM_BASE, Host: "academia.srmist.edu.in", "x-zcsrf-token": xcsrf1, "Content-Type": "application/x-www-form-urlencoded" }, data: QueryString.stringify({ mode: "primary", servicename: "ZohoCreator", service_language: "en", serviceurl: SRM_BASE }) });
        if (lookupRes.data?.errors) return { success: false, error: lookupRes.data.localized_message || "Login failed" };
        if (!lookupRes.data?.lookup?.digest) return { success: false, error: "Invalid username" };
        const digest = lookupRes.data.lookup.digest;
        const identifier = lookupRes.data.lookup.identifier;
        const xcsrf2 = await getXcsrfToken(jar);
        const passRes = await client.request({ method: "post", url: `${SRM_BASE}/accounts/p/10002227248/signin/v2/primary/${identifier}/password?digest=${digest}&cli_time=${Date.now()}&servicename=ZohoCreator&service_language=en&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2F`, headers: { "x-zcsrf-token": xcsrf2, "Content-Type": "application/json" }, data: JSON.stringify({ passwordauth: { password } }) });
        if (passRes.data?.errors) return { success: false, error: passRes.data.localized_message || "Login failed" };
        const redirectUrl = passRes.data?.passwordauth?.redirect_uri;
        if (redirectUrl?.includes("block-sessions")) {
            if (!forceTerminate) return { success: false, sessionExceeded: true, error: "SESSION_EXCEEDED", cookies: jar.getCookieStringSync(SRM_BASE) };
            const xcsrf3 = await getXcsrfToken(jar);
            await client.request({ method: "delete", url: `${SRM_BASE}/accounts/p/40-10002227248/webclient/v1/announcement/pre/blocksessions`, headers: { "Content-Type": "application/x-www-form-urlencoded", "x-zcsrf-token": xcsrf3, Referer: `${SRM_BASE}/accounts/p/40-10002227248/preannouncement/block-sessions`, Origin: SRM_BASE } });
        }
        await client.get(`${SRM_BASE}/accounts/p/40-10002227248/preannouncement/block-sessions/next`);
        await client.get(`${SRM_BASE}/portal/academia-academic-services/redirectFromLogin`);
        const cookies = jar.getCookieStringSync(SRM_BASE);
        const normalizedRegNo = username.includes("@") ? username.split("@")[0].toUpperCase() : username.toUpperCase();
        const cachedProfile = await getCachedData<{ name?: string; regNo?: string }>(`profile:${normalizedRegNo}`);
        const name = cachedProfile?.name || "Student";
        const regNo = cachedProfile?.regNo || normalizedRegNo;
        fetchAndCacheAllData(cookies, regNo).catch(() => { });
        return { success: true, cookies, name, regNo };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Login failed" };
    }
}

export async function loginToSRM(username: string, password: string): Promise<LoginResult> { return performFullLogin(username, password, false); }
export async function loginToSRMForceTerminate(username: string, password: string): Promise<LoginResult> { return performFullLogin(username, password, true); }