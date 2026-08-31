"use client";
import { useState, useEffect } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import ProfileCard from "@/components/profile/ProfileCard";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useFetchWithCache } from "@/hooks/useFetchWithCache";
import { getProfileApi } from "@/lib/api";
import { Student } from "@/utils/types";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, ExternalLink } from "lucide-react";
import dynamic from "next/dynamic";
import { getToken } from "@/lib/session";
import { useDarkMode } from "@/hooks/useDarkMode";
const SupportModal = dynamic(() => import("@/components/support/SupportModal"), { ssr: false });

interface NotificationSettings {
    telegram_chat_id: number | null;
    notifications_on: boolean;
    remind_1hr: boolean;
    remind_30min: boolean;
    remind_15min: boolean;
}

export default function ProfilePage() {
    const { data, loading, error } = useFetchWithCache<Student>(
        getProfileApi as () => Promise<Student>,
        "profile",
        30 * 24 * 60 * 60 * 1000
    );
    const [notifSettings, setNotifSettings] = useState<NotificationSettings | null>(null);
    const [notifLoading, setNotifLoading] = useState(true);
    const [supportOpen, setSupportOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { isDark, toggle } = useDarkMode();

    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    useEffect(() => {
        async function fetchSettings() {
            try {
                const token = getToken();
                const res = await fetch("/api/notifications", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                if (json.success && json.data) {
                    setNotifSettings(json.data);
                } else {
                    setNotifSettings({
                        telegram_chat_id: null,
                        notifications_on: false,
                        remind_1hr: true,
                        remind_30min: true,
                        remind_15min: true,
                    });
                }
            } catch {
                setNotifSettings({
                    telegram_chat_id: null,
                    notifications_on: false,
                    remind_1hr: true,
                    remind_30min: true,
                    remind_15min: true,
                });
            } finally {
                setNotifLoading(false);
            }
        }
        fetchSettings();
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") fetchSettings();
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    async function saveSettings(updated: Partial<NotificationSettings>) {
        setSaving(true);
        try {
            const token = getToken();
            const newSettings = { ...notifSettings, ...updated };
            if (updated.notifications_on === false || updated.notifications_on === true) {
                newSettings.telegram_chat_id = null;
            }
            await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(newSettings),
            });
            setNotifSettings(newSettings as NotificationSettings);
        } catch {
            console.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    }

    function handleToggle() {
        if (notifSettings?.notifications_on) {
            if (window.confirm("⚠️ Turning off will disconnect your Telegram completely.\n\nTo enable reminders again, you'll need to reconnect Telegram from scratch.\n\nAre you sure you want to turn off?")) {
                saveSettings({ notifications_on: false });
            }
        } else {
            saveSettings({ notifications_on: true });
        }
    }

    const telegramLink = data?.regNo ? `https://t.me/ClarixReminderBot?start=${data.regNo}` : null;

    if (loading) return <LoadingScreen />;

    return (
        <PageWrapper>
            <AnimatePresence>{supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}</AnimatePresence>

            {/* Header */}
            <div style={{ padding: "24px 20px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <motion.h1
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}
                >
                    Profile
                </motion.h1>
                {isMobile && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                            onClick={toggle}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: "4px 8px" }}
                        >
                            {isDark ? "☀️" : "🌙"}
                        </button>
                        <button
                            onClick={() => setSupportOpen(true)}
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, background: "linear-gradient(135deg, #ff5f5f, #ff9800)", color: "white", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(255,95,95,0.35)" }}
                        >
                            Donate
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div style={{ padding: "0 20px 16px" }}>
                    <div style={{ padding: "14px", borderRadius: 12, background: "var(--error-bg)", border: "1px solid var(--error-border)", color: "var(--error-text)", fontSize: 14, textAlign: "center" }}>
                        {error}
                    </div>
                </div>
            )}

            {data && <ProfileCard student={data} />}

            {!data && !loading && !error && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", fontSize: 15 }}>
                    No profile data found
                </div>
            )}

            {/* Telegram Notifications Card */}
            {!notifLoading && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        margin: "0 20px 24px",
                        background: "var(--card-bg)",
                        borderRadius: 20,
                        padding: 20,
                        boxShadow: "var(--card-shadow)",
                        border: "1px solid var(--border)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: notifSettings?.notifications_on ? "#eff6ff" : "var(--bg-tertiary)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                {notifSettings?.notifications_on
                                    ? <Bell size={18} color="#1d4ed8" />
                                    : <BellOff size={18} color="var(--text-muted)" />
                                }
                            </div>
                            <div>
                                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Class Reminders</p>
                                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>via Telegram</p>
                            </div>
                        </div>
                        <button
                            onClick={handleToggle}
                            disabled={saving}
                            style={{
                                width: 48, height: 26, borderRadius: 13,
                                background: notifSettings?.notifications_on ? "#1d4ed8" : "var(--border)",
                                border: "none", cursor: saving ? "not-allowed" : "pointer",
                                position: "relative", transition: "background 0.2s", flexShrink: 0,
                            }}
                        >
                            <div style={{
                                width: 20, height: 20, borderRadius: "50%", background: "white",
                                position: "absolute", top: 3,
                                left: notifSettings?.notifications_on ? 25 : 3,
                                transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            }} />
                        </button>
                    </div>

                    {notifSettings?.notifications_on && (
                        <>
                            {notifSettings?.telegram_chat_id ? (
                                <div style={{
                                    padding: "10px 14px", borderRadius: 12,
                                    background: "var(--success-bg)", border: "1px solid var(--success-border)",
                                    display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
                                }}>
                                    <span style={{ fontSize: 16 }}>✅</span>
                                    <p style={{ fontSize: 13, color: "var(--success-text)", fontWeight: 600 }}>Telegram connected</p>
                                </div>
                            ) : (
                                <div style={{ marginBottom: 16 }}>
                                    <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>
                                        Connect your Telegram to receive class reminders.
                                    </p>
                                    {telegramLink && (
                                        <button
                                            onClick={() => window.open(telegramLink, "_blank")}
                                            style={{
                                                display: "inline-flex", alignItems: "center", gap: 6,
                                                padding: "10px 16px", borderRadius: 12,
                                                background: "#0088cc", color: "white",
                                                fontSize: 13, fontWeight: 700,
                                                border: "none", cursor: "pointer",
                                                boxShadow: "0 2px 8px rgba(0,136,204,0.3)",
                                            }}
                                        >
                                            <ExternalLink size={14} />
                                            Connect Telegram
                                        </button>
                                    )}
                                </div>
                            )}

                            {notifSettings?.telegram_chat_id && (
                                <div>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        Remind me before class
                                    </p>
                                    {[
                                        { key: "remind_1hr", label: "1 hour before" },
                                        { key: "remind_30min", label: "30 minutes before" },
                                        { key: "remind_15min", label: "15 minutes before" },
                                    ].map(({ key, label }) => (
                                        <div key={key} style={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            padding: "10px 0", borderBottom: "1px solid var(--border-light)",
                                        }}>
                                            <p style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{label}</p>
                                            <button
                                                onClick={() => saveSettings({ [key]: !notifSettings[key as keyof NotificationSettings] })}
                                                disabled={saving}
                                                style={{
                                                    width: 40, height: 22, borderRadius: 11,
                                                    background: notifSettings[key as keyof NotificationSettings] ? "#1d4ed8" : "var(--border)",
                                                    border: "none", cursor: saving ? "not-allowed" : "pointer",
                                                    position: "relative", transition: "background 0.2s", flexShrink: 0,
                                                }}
                                            >
                                                <div style={{
                                                    width: 16, height: 16, borderRadius: "50%", background: "white",
                                                    position: "absolute", top: 3,
                                                    left: notifSettings[key as keyof NotificationSettings] ? 21 : 3,
                                                    transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                                }} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 14, lineHeight: 1.6 }}>
                                {notifSettings?.telegram_chat_id
                                    ? "Toggle off to disconnect Telegram and stop all reminders."
                                    : "Connect Telegram first to enable class reminders."
                                }
                            </p>
                        </>
                    )}
                </motion.div>
            )}
        </PageWrapper>
    );
}