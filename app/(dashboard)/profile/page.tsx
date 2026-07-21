"use client";

import PageWrapper from "@/components/layout/PageWrapper";
import ProfileCard from "@/components/profile/ProfileCard";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useFetchWithCache } from "@/hooks/useFetchWithCache";
import { getProfileApi } from "@/lib/api";
import { Student } from "@/utils/types";
import { motion } from "framer-motion";

export default function ProfilePage() {
    const { data, loading, error } = useFetchWithCache<Student>(
        getProfileApi as () => Promise<Student>,
        "profile",
        30 * 24 * 60 * 60 * 1000 // 1 month TTL — profile rarely changes
    );

    if (loading) return <LoadingScreen />;

    return (
        <PageWrapper>
            <div style={{ padding: "24px 20px 20px" }}>
                <motion.h1
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}
                >
                    Profile
                </motion.h1>
            </div>

            {error && (
                <div style={{ padding: "0 20px 16px" }}>
                    <div style={{ padding: "14px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 14, textAlign: "center" }}>
                        {error}
                    </div>
                </div>
            )}

            {data && <ProfileCard student={data} />}

            {!data && !loading && !error && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 15 }}>
                    No profile data found
                </div>
            )}
        </PageWrapper>
    );
}