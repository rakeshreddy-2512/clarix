"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/session";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        if (isLoggedIn()) {
            router.push("/attendance");
        }
    }, []);

    return <LoginForm />;
}