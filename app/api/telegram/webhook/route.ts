import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

async function sendTelegramMessage(chatId: number, text: string) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const message = body?.message;
        if (!message) return NextResponse.json({ ok: true });

        const chatId = message.chat.id;
        const text = message.text || "";

        // Handle /start command with reg number
        if (text.startsWith("/start")) {
            const parts = text.split(" ");
            const regNumber = parts[1]?.trim().toUpperCase();

            if (!regNumber) {
                await sendTelegramMessage(chatId,
                    "👋 Welcome to <b>Clarix</b>!\n\nTo enable class reminders, go to your Profile page in Clarix and click <b>Connect Telegram</b>."
                );
                return NextResponse.json({ ok: true });
            }

            // Save telegram_chat_id for this reg number
            const { error } = await supabase
                .from("user_notifications")
                .upsert({
                    reg_number: regNumber,
                    telegram_chat_id: chatId,
                    notifications_on: true,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "reg_number" });

            if (error) {
                console.error("Supabase error:", error);
                await sendTelegramMessage(chatId, "❌ Something went wrong. Please try again from Clarix.");
                return NextResponse.json({ ok: true });
            }

            // Get student name from Supabase if available
            const { data } = await supabase
                .from("user_notifications")
                .select("reg_number")
                .eq("reg_number", regNumber)
                .single();

            await sendTelegramMessage(chatId,
                `✅ <b>Clarix Reminders Enabled!</b>\n\nHi! You'll now receive class reminders before your scheduled classes.\n\n📚 Reg No: <b>${regNumber}</b>\n\nYou can manage reminder timing from your Profile page in Clarix.`
            );
        }

        // Handle /stop command
        if (text === "/stop") {
            await supabase
                .from("user_notifications")
                .update({ notifications_on: false, updated_at: new Date().toISOString() })
                .eq("telegram_chat_id", chatId);

            await sendTelegramMessage(chatId,
                "🔕 <b>Reminders disabled.</b>\n\nYou won't receive any more class reminders. You can re-enable them from your Profile page in Clarix."
            );
        }

        // Handle /status command
        if (text === "/status") {
            const { data } = await supabase
                .from("user_notifications")
                .select("*")
                .eq("telegram_chat_id", chatId)
                .single();

            if (!data) {
                await sendTelegramMessage(chatId, "❌ No account linked. Please connect from Clarix Profile page.");
            } else {
                await sendTelegramMessage(chatId,
                    `📊 <b>Your Reminder Status</b>\n\n` +
                    `Reg No: <b>${data.reg_number}</b>\n` +
                    `Reminders: <b>${data.notifications_on ? "✅ ON" : "🔕 OFF"}</b>\n` +
                    `1 hour before: <b>${data.remind_1hr ? "✅" : "❌"}</b>\n` +
                    `30 mins before: <b>${data.remind_30min ? "✅" : "❌"}</b>\n` +
                    `15 mins before: <b>${data.remind_15min ? "✅" : "❌"}</b>`
                );
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json({ ok: true });
    }
}