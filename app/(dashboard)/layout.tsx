"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/session";
import BottomNav from "@/components/layout/BottomNav";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (!isLoggedIn()) {
            router.push("/login");
        } else {
            setChecking(false);
        }
    }, [router]);

    if (checking) return <LoadingScreen />;

    return (
        <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
            <BottomNav />
            {/* Content — margin handled by sidebar state in CSS */}
            <div className="md:pl-[220px] transition-all duration-300">
                {children}
            </div>
        </div>
    );
}