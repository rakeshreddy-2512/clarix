"use client";
import { useEffect, useRef, useState } from "react";

export default function ClarixLogo() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);
    const [fontReady, setFontReady] = useState(false);

    // ✅ Use document.fonts.ready — font is self-hosted so always available
    useEffect(() => {
        const checkFont = async () => {
            await document.fonts.load("700 48px 'Dancing Script'");
            setFontReady(true);
        };
        checkFont();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const box = boxRef.current;
        if (!canvas || !box) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = box.offsetWidth;
        const H = box.offsetHeight;
        canvas.width = W;
        canvas.height = H;

        const stars: any[] = [];
        for (let i = 0; i < 80; i++) {
            stars.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: Math.random() * 1.1 + 0.2,
                alpha: Math.random(),
                speed: Math.random() * 0.012 + 0.003,
                dir: Math.random() > 0.5 ? 1 : -1,
            });
        }

        const shooting: any[] = [];

        const spawnShooting = () => {
            const active = shooting.filter(s => s.alpha > 0).length;
            if (active >= 2) return;
            shooting.push({
                x: W * 0.5 + Math.random() * W * 0.5,
                y: Math.random() * H * 0.3,
                speed: Math.random() * 1.5 + 1.5,
                alpha: 1,
                tail: [] as { x: number; y: number }[],
                len: Math.random() * 35 + 25,
                width: Math.random() * 0.5 + 0.4,
                color: Math.random() > 0.5 ? "200,220,255" : "255,240,200",
            });
        };

        spawnShooting();
        const shootInterval = setInterval(spawnShooting, 2500);

        let animId: number;
        const draw = () => {
            ctx.clearRect(0, 0, W, H);

            stars.forEach(s => {
                s.alpha += s.speed * s.dir;
                if (s.alpha >= 1) s.dir = -1;
                if (s.alpha <= 0.05) s.dir = 1;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
                ctx.fill();
                if (s.r > 0.85 && s.alpha > 0.55) {
                    ctx.strokeStyle = `rgba(255,255,255,${s.alpha * 0.35})`;
                    ctx.lineWidth = 0.3;
                    ctx.beginPath();
                    ctx.moveTo(s.x - s.r * 3, s.y);
                    ctx.lineTo(s.x + s.r * 3, s.y);
                    ctx.moveTo(s.x, s.y - s.r * 3);
                    ctx.lineTo(s.x, s.y + s.r * 3);
                    ctx.stroke();
                }
            });

            for (let i = shooting.length - 1; i >= 0; i--) {
                const s = shooting[i];
                s.x -= s.speed * 1.2;
                s.y += s.speed * 0.8;
                s.tail.push({ x: s.x, y: s.y });
                if (s.tail.length > s.len) s.tail.shift();
                s.alpha -= 0.01;

                if (s.tail.length > 1) {
                    for (let j = 1; j < s.tail.length; j++) {
                        const t = j / s.tail.length;
                        ctx.beginPath();
                        ctx.moveTo(s.tail[j - 1].x, s.tail[j - 1].y);
                        ctx.lineTo(s.tail[j].x, s.tail[j].y);
                        ctx.strokeStyle = `rgba(${s.color},${t * s.alpha})`;
                        ctx.lineWidth = t * s.width * 1.5;
                        ctx.stroke();
                    }
                    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 4);
                    g.addColorStop(0, `rgba(255,255,255,${s.alpha})`);
                    g.addColorStop(1, `rgba(${s.color},0)`);
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
                    ctx.fillStyle = g;
                    ctx.fill();
                }

                if (s.alpha <= 0 || s.x < -60 || s.y > H + 60) {
                    shooting.splice(i, 1);
                }
            }

            animId = requestAnimationFrame(draw);
        };

        animId = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(animId);
            clearInterval(shootInterval);
        };
    }, []);

    // ✅ Show black box until font is ready
    if (!fontReady) {
        return (
            <div style={{
                width: 220,
                height: 90,
                borderRadius: 20,
                background: "#000000",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }} />
        );
    }

    return (
        <div
            ref={boxRef}
            style={{
                position: "relative",
                width: 220,
                height: 90,
                borderRadius: 20,
                background: "#000000",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0, left: 0,
                    width: "100%", height: "100%",
                }}
            />
            <div style={{ position: "relative", zIndex: 2, display: "flex" }}>
                {"Clarix".split("").map((letter, i) => (
                    <span
                        key={i}
                        style={{
                            fontFamily: "'Dancing Script', cursive",
                            fontWeight: 700,
                            fontSize: 48,
                            color: "#ffffff",
                            display: "inline-block",
                            opacity: 0,
                            animation: `letterAppear 0.4s ease forwards`,
                            animationDelay: `${i * 0.35}s`,
                            lineHeight: 1,
                        }}
                    >
                        {letter}
                    </span>
                ))}
            </div>
            <style>{`
                @keyframes letterAppear {
                    0% { opacity: 0; transform: translateY(10px); }
                    60% { opacity: 1; transform: translateY(-2px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}