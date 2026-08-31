import { useEffect, useState } from "react";

export function useDarkMode() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("clarix_dark_mode");
        if (saved === "true") {
            setIsDark(true);
            document.documentElement.classList.add("dark");
        }
    }, []);

    const toggle = () => {
        const next = !isDark;
        setIsDark(next);
        if (next) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("clarix_dark_mode", "true");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("clarix_dark_mode", "false");
        }
    };

    return { isDark, toggle };
}