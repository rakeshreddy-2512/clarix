"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart } from "lucide-react";

const AMOUNTS = [
    { label: "₹10", value: 1000 },
    { label: "₹50", value: 5000 },
    { label: "₹100", value: 10000 },
    { label: "₹500", value: 50000 },
];

const modalStars = `
    @keyframes twinkle { 0%,100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
    @keyframes twinkle2 { 0%,100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.1; transform: scale(0.6); } }
    @keyframes twinkle3 { 0%,100% { opacity: 0.8; transform: scale(1.1); } 50% { opacity: 0.2; transform: scale(0.7); } }
    .sp-star { position: absolute; border-radius: 50%; background: #fff; pointer-events: none; }
    .sp-s1 { width: 2px; height: 2px; top: 8%; left: 12%; animation: twinkle 2.1s ease-in-out infinite; }
    .sp-s2 { width: 3px; height: 3px; top: 15%; left: 75%; animation: twinkle2 1.8s ease-in-out infinite; }
    .sp-s3 { width: 2px; height: 2px; top: 30%; left: 45%; animation: twinkle3 2.4s ease-in-out infinite; }
    .sp-s4 { width: 2px; height: 2px; top: 55%; left: 88%; animation: twinkle 1.6s ease-in-out infinite; }
    .sp-s5 { width: 3px; height: 3px; top: 65%; left: 20%; animation: twinkle2 2.8s ease-in-out infinite; }
    .sp-s6 { width: 2px; height: 2px; top: 75%; left: 60%; animation: twinkle3 1.9s ease-in-out infinite; }
    .sp-s7 { width: 2px; height: 2px; top: 85%; left: 8%; animation: twinkle 2.3s ease-in-out infinite; }
    .sp-s8 { width: 3px; height: 3px; top: 20%; left: 55%; animation: twinkle3 2.6s ease-in-out infinite; }
`;

interface SupportModalProps {
    onClose: () => void;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function SupportModal({ onClose }: SupportModalProps) {
    const [selectedAmount, setSelectedAmount] = useState(5000);
    const [customAmount, setCustomAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const getFinalAmount = () => {
        if (customAmount) return Math.round(parseFloat(customAmount) * 100);
        return selectedAmount;
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) { resolve(true); return; }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        const amount = getFinalAmount();
        if (amount < 100) { setError("Minimum amount is ₹1"); return; }
        setLoading(true);
        setError("");
        try {
            const loaded = await loadRazorpay();
            if (!loaded) { setError("Failed to load payment. Try again."); setLoading(false); return; }

            const orderRes = await fetch("/api/payment/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });
            const order = await orderRes.json();
            if (!orderRes.ok) { setError(order.error || "Failed to create order"); setLoading(false); return; }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "Clarix",
                description: "Support Clarix — SRM Academia Tracker",
                order_id: order.order_id,
                handler: async (response: any) => {
                    const verifyRes = await fetch("/api/payment/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    });
                    const verify = await verifyRes.json();
                    if (verify.success) {
                        setSuccess(true);
                    } else {
                        setError("Payment verification failed");
                    }
                },
                prefill: { name: "", email: "", contact: "" },
                theme: { color: "#302b63" },
                modal: {
                    ondismiss: () => { setLoading(false); }
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", () => {
                setError("Payment failed. Please try again.");
                setLoading(false);
            });
            rzp.open();
        } catch {
            setError("Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: "fixed", inset: 0, zIndex: 99999,
                background: "rgba(0,0,0,0.7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 24,
            }}
        >
            <style>{modalStars}</style>
            <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                style={{
                    width: "100%", maxWidth: 380, borderRadius: 28,
                    background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                    overflow: "hidden", position: "relative",
                }}
            >
                <div className="sp-star sp-s1" />
                <div className="sp-star sp-s2" />
                <div className="sp-star sp-s3" />
                <div className="sp-star sp-s4" />
                <div className="sp-star sp-s5" />
                <div className="sp-star sp-s6" />
                <div className="sp-star sp-s7" />
                <div className="sp-star sp-s8" />

                <button
                    onClick={onClose}
                    style={{
                        position: "absolute", top: 16, right: 16,
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: 8, width: 28, height: 28,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", zIndex: 1,
                    }}
                >
                    <X size={14} color="rgba(255,255,255,0.7)" />
                </button>

                <div style={{ padding: "32px 28px 28px", position: "relative", zIndex: 1 }}>
                    {success ? (
                        <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", marginBottom: 8 }}>
                                Thank you!
                            </h2>
                            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
                                Your support means a lot to Clarix ❤️
                            </p>
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                style={{
                                    width: "100%", padding: "14px", borderRadius: 14, border: "none",
                                    background: "linear-gradient(135deg, #ff6f00, #ff9800)",
                                    color: "#ffffff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                                }}
                            >
                                Close
                            </motion.button>
                        </div>
                    ) : (
                        <>
                            <div style={{ textAlign: "center", marginBottom: 24 }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: 16,
                                    background: "rgba(255,111,0,0.2)",
                                    border: "1px solid rgba(255,111,0,0.3)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    margin: "0 auto 16px",
                                }}>
                                    <Heart size={24} color="#ff9800" />
                                </div>
                                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", marginBottom: 6 }}>
                                    Support Clarix ❤️
                                </h2>
                                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
                                    Help keep Clarix free for all SRM students
                                </p>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                                {AMOUNTS.map(({ label, value }) => (
                                    <button
                                        key={value}
                                        onClick={() => { setSelectedAmount(value); setCustomAmount(""); }}
                                        style={{
                                            padding: "12px", borderRadius: 12,
                                            background: selectedAmount === value && !customAmount
                                                ? "rgba(255,111,0,0.3)"
                                                : "rgba(255,255,255,0.08)",
                                            border: selectedAmount === value && !customAmount
                                                ? "1px solid rgba(255,111,0,0.6)"
                                                : "1px solid rgba(255,255,255,0.12)",
                                            color: "#ffffff", fontSize: 15, fontWeight: 700,
                                            cursor: "pointer", transition: "all 0.15s",
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <input
                                    type="number"
                                    placeholder="Custom amount (₹)"
                                    value={customAmount}
                                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
                                    style={{
                                        width: "100%", padding: "12px 16px",
                                        borderRadius: 12, fontSize: 14, fontWeight: 500,
                                        background: "rgba(255,255,255,0.08)",
                                        border: customAmount
                                            ? "1px solid rgba(255,111,0,0.6)"
                                            : "1px solid rgba(255,255,255,0.12)",
                                        color: "#ffffff", outline: "none",
                                    }}
                                />
                            </div>

                            {error && (
                                <div style={{
                                    padding: "10px 14px", borderRadius: 10,
                                    background: "rgba(220,38,38,0.2)",
                                    border: "1px solid rgba(220,38,38,0.4)",
                                    color: "#fca5a5", fontSize: 13, fontWeight: 600, marginBottom: 16,
                                }}>
                                    ⚠️ {error}
                                </div>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handlePayment}
                                disabled={loading}
                                style={{
                                    width: "100%", padding: "14px", borderRadius: 14, border: "none",
                                    background: loading
                                        ? "rgba(255,255,255,0.1)"
                                        : "linear-gradient(135deg, #ff6f00, #ff9800)",
                                    color: loading ? "rgba(255,255,255,0.4)" : "#ffffff",
                                    fontSize: 15, fontWeight: 700,
                                    cursor: loading ? "not-allowed" : "pointer",
                                    boxShadow: loading ? "none" : "0 4px 20px rgba(255,111,0,0.4)",
                                }}
                            >
                                {loading ? "Processing..." : `Pay ${customAmount ? `₹${customAmount}` : AMOUNTS.find(a => a.value === selectedAmount)?.label || "₹50"}`}
                            </motion.button>

                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 12, textAlign: "center" }}>
                                Secured by Razorpay • UPI, Cards, Netbanking
                            </p>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}