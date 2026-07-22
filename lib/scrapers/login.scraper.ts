import axios, { AxiosInstance } from "axios";
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
const ATTENDANCE_URL = `${SRM_BASE}/srm_university/academia-academic-services/page/My_Attendance`;
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
    client: AxiosInstance;
    digest?: string;
    identifier?: string;
    createdAt: number;
    awaitingForceTerminate?: boolean;
}

const prefetchSessions = new Map<string, PrefetchSession>();

setInterval(() => {
    const now = Date.now();
    for (const [key, session] of prefetchSessions.entries()) {
        if (now - session.createdAt > 5 * 60 * 1000) prefetchSessions.delete(key);
    }
}, 60 * 1000);

function hashData(data: unknown): string {
    return crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");
}

function secondsUntilMidnight(): number {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
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
        },
    });
    return res.data;
}

// ✅ Fetch attendance + timetable in parallel like acadia.works
export async function fetchAndCacheAllData(cookies: string, regNo: string): Promise<void> {
    try {
        console.log(`📚 Background fetching all data for: ${regNo}`);

        const [attendanceHtml, timetableHtml] = await Promise.all([
            fetchHtml(cookies, ATTENDANCE_URL),
            fetchHtml(cookies, TIMETABLE_URL),
        ]);

        console.log(`📄 Attendance: ${attendanceHtml.length} chars, Timetable: ${timetableHtml.length} chars`);

        if (attendanceHtml.length < 500 && timetableHtml.length < 500) {
            console.log("⚠️ Both responses too small, skipping cache");
            return;
        }

        await cacheAll(attendanceHtml, timetableHtml, regNo);
        console.log(`✅ Background cache complete for: ${regNo}`);
    } catch (error: unknown) {
        console.error("❌ fetchAndCacheAllData error:", error instanceof Error ? error.message : error);
    }
}

async function cacheAll(attendanceHtml: string, timetableHtml: string, regNo: string) {
    // ✅ attendance/marks/profile from My_Attendance
    // ✅ timetable from My_Time_Table_2023_24
    const attendance = parseAttendance(attendanceHtml);
    const marks = parseMarks(attendanceHtml);
    const profile = parseProfile(attendanceHtml);
    const timetable = parseTimetable(timetableHtml);

    await Promise.all([
        cacheData(`attendance:${regNo}`, attendance, 120),
        cacheData(`attendance:${regNo}:hash`, hashData(attendance), 120),
        cacheData(`marks:${regNo}`, marks, 120),
        cacheData(`marks:${regNo}:hash`, hashData(marks), 120),
        cacheData(`profile:${regNo}`, profile, 2592000),
        cacheData(`profile:${regNo}:hash`, hashData(profile), 2592000),
        cacheData(`timetable:${regNo}`, timetable, secondsUntilMidnight()),
        cacheData(`timetable:${regNo}:hash`, hashData(timetable), secondsUntilMidnight()),
    ]);
}

async function addAdditionalCookies(client: AxiosInstance) {
    await client.get(`${SRM_BASE}/accounts/p/40-10002227248/preannouncement/block-sessions/next`);
    await client.get(`${SRM_BASE}/portal/academia-academic-services/redirectFromLogin`);
}

// ─── STEP 1+2: Prefetch ──────────────────────────────────────────────────────
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

// ─── STEP 3: Lookup ──────────────────────────────────────────────────────────
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
        console.log(`🔍 Looking up user: ${normalizedUsername}`);
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

// ─── STEP 4+5: Password submit ───────────────────────────────────────────────
export async function submitPassword(sessionId: string, username: string, password: string, forceTerminate: boolean = false): Promise<LoginResult> {
    try {
        const session = prefetchSessions.get(sessionId);
        if (!session || !session.digest || !session.identifier) {
            return performFullLogin(username, password, forceTerminate);
        }
        const { jar, client } = session;

        if (session.awaitingForceTerminate && forceTerminate) {
            console.log("⚡ Reusing session for force terminate");
            await client.request({
                method: "delete",
                url: `${SRM_BASE}/accounts/p/40-10002227248/webclient/v1/announcement/pre/blocksessions`,
                headers: { "Content-Type": "application/x-www-form-urlencoded", "x-zcsrf-token": await getXcsrfToken(jar), Referer: `${SRM_BASE}/accounts/p/40-10002227248/preannouncement/block-sessions`, Origin: SRM_BASE },
            });
            await addAdditionalCookies(client);
            const cookies = jar.getCookieStringSync(SRM_BASE);
            prefetchSessions.delete(sessionId);
            const normalizedRegNo = username.includes("@") ? username.split("@")[0].toUpperCase() : username.toUpperCase();
            const cachedProfile = await getCachedData<{ name?: string; regNo?: string }>(`profile:${normalizedRegNo}`);
            const name = cachedProfile?.name || username.split("@")[0].toUpperCase();
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
            await client.request({
                method: "delete",
                url: `${SRM_BASE}/accounts/p/40-10002227248/webclient/v1/announcement/pre/blocksessions`,
                headers: { "Content-Type": "application/x-www-form-urlencoded", "x-zcsrf-token": await getXcsrfToken(jar), Referer: `${SRM_BASE}/accounts/p/40-10002227248/preannouncement/block-sessions`, Origin: SRM_BASE },
            });
        }

        await addAdditionalCookies(client);
        const cookies = jar.getCookieStringSync(SRM_BASE);
        console.log("🍪 Cookies captured:", jar.getCookiesSync(SRM_BASE).length);
        prefetchSessions.delete(sessionId);

        const normalizedRegNo = username.includes("@") ? username.split("@")[0].toUpperCase() : username.toUpperCase();
        const cachedProfile = await getCachedData<{ name?: string; regNo?: string }>(`profile:${normalizedRegNo}`);
        const name = cachedProfile?.name || username.split("@")[0].toUpperCase();
        const regNo = cachedProfile?.regNo || normalizedRegNo;

        console.log(`✅ Login successful! User: ${name} — ${regNo}`);
        fetchAndCacheAllData(cookies, regNo).catch((err) => { console.error("❌ Background fetch failed:", err.message); });
        return { success: true, cookies, name, regNo };

    } catch (error: unknown) {
        prefetchSessions.delete(sessionId);
        return { success: false, error: error instanceof Error ? error.message : "Login failed" };
    }
}

async function performFullLogin(username: string, password: string, forceTerminate: boolean): Promise<LoginResult> {
    const { jar, client } = createClient();
    try {
        await client.get(SRM_BASE);
        await client.get(`${SRM_BASE}/accounts/p/10002227248/signin?hide_fp=true&orgtype=40&service_language=en&css_url=/49910842/academia-academic-services/downloadPortalCustomCss/login&dcc=true&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2Facademia-academic-services%2FredirectFromLogin`);
        const xcsrf1 = await getXcsrfToken(jar);
        const normalizedUsername = username.includes("@") ? username : `${username}@srmist.edu.in`;
        const lookupRes = await client.request({
            method: "post",
            url: `${SRM_BASE}/accounts/p/10002227248/signin/v2/lookup/${normalizedUsername}`,
            headers: { Origin: SRM_BASE, Host: "academia.srmist.edu.in", "x-zcsrf-token": xcsrf1, "Content-Type": "application/x-www-form-urlencoded" },
            data: QueryString.stringify({ mode: "primary", servicename: "ZohoCreator", service_language: "en", serviceurl: SRM_BASE }),
        });
        if (lookupRes.data?.errors) return { success: false, error: lookupRes.data.localized_message || "Login failed" };
        if (!lookupRes.data?.lookup?.digest) return { success: false, error: "Invalid username" };
        const digest = lookupRes.data.lookup.digest;
        const identifier = lookupRes.data.lookup.identifier;
        const xcsrf2 = await getXcsrfToken(jar);
        const passRes = await client.request({
            method: "post",
            url: `${SRM_BASE}/accounts/p/10002227248/signin/v2/primary/${identifier}/password?digest=${digest}&cli_time=${Date.now()}&servicename=ZohoCreator&service_language=en&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2F`,
            headers: { "x-zcsrf-token": xcsrf2, "Content-Type": "application/json" },
            data: JSON.stringify({ passwordauth: { password } }),
        });
        if (passRes.data?.errors) return { success: false, error: passRes.data.localized_message || "Login failed" };
        const redirectUrl = passRes.data?.passwordauth?.redirect_uri;
        if (redirectUrl?.includes("block-sessions")) {
            if (!forceTerminate) return { success: false, sessionExceeded: true, error: "SESSION_EXCEEDED", cookies: jar.getCookieStringSync(SRM_BASE) };
            await client.request({
                method: "delete",
                url: `${SRM_BASE}/accounts/p/40-10002227248/webclient/v1/announcement/pre/blocksessions`,
                headers: { "Content-Type": "application/x-www-form-urlencoded", "x-zcsrf-token": await getXcsrfToken(jar), Referer: `${SRM_BASE}/accounts/p/40-10002227248/preannouncement/block-sessions`, Origin: SRM_BASE },
            });
        }
        await addAdditionalCookies(client);
        const cookies = jar.getCookieStringSync(SRM_BASE);
        const normalizedRegNo = username.includes("@") ? username.split("@")[0].toUpperCase() : username.toUpperCase();
        const cachedProfile = await getCachedData<{ name?: string; regNo?: string }>(`profile:${normalizedRegNo}`);
        const name = cachedProfile?.name || username.split("@")[0].toUpperCase();
        const regNo = cachedProfile?.regNo || normalizedRegNo;
        fetchAndCacheAllData(cookies, regNo).catch(() => { });
        return { success: true, cookies, name, regNo };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : "Login failed" };
    }
}

export async function loginToSRM(username: string, password: string): Promise<LoginResult> { return performFullLogin(username, password, false); }
export async function loginToSRMForceTerminate(username: string, password: string): Promise<LoginResult> { return performFullLogin(username, password, true); }