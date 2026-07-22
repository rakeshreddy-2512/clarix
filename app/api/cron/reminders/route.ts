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

function getCurrentDayOrder(timetableJson: any): number {
    // Get today's day order from planner if available
    // For now use a simple weekday mapping
    const day = new Date().getDay();
    const dayOrderMap: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };
    return dayOrderMap[day] || 1;
}

function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return (h < 7 ? h + 12 : h) * 60 + m;
}

export async function GET(req: NextRequest) {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Get all users with notifications enabled and telegram connected
        const { data: users, error } = await supabase
            .from("user_notifications")
            .select("*")
            .eq("notifications_on", true)
            .not("telegram_chat_id", "is", null)
            .not("timetable_json", "is", null);

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!users || users.length === 0) {
            return NextResponse.json({ success: true, message: "No users to notify" });
        }

        const now = new Date();
        // Convert to IST (UTC+5:30)
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(now.getTime() + istOffset);
        const currentMinutes = istNow.getHours() * 60 + istNow.getMinutes();

        let remindersSent = 0;

        for (const user of users) {
            try {
                const timetable = user.timetable_json?.timetable;
                if (!timetable) continue;

                const dayOrder = getCurrentDayOrder(user.timetable_json);
                const daySlots = timetable[dayOrder] || [];

                for (const slot of daySlots) {
                    const classMinutes = timeToMinutes(slot.startTime);
                    const minutesUntilClass = classMinutes - currentMinutes;

                    for (const course of slot.courses) {
                        let shouldSend = false;
                        let reminderText = "";

                        if (user.remind_1hr && minutesUntilClass === 60) {
                            shouldSend = true;
                            reminderText = "1 hour";
                        } else if (user.remind_30min && minutesUntilClass === 30) {
                            shouldSend = true;
                            reminderText = "30 minutes";
                        } else if (user.remind_15min && minutesUntilClass === 15) {
                            shouldSend = true;
                            reminderText = "15 minutes";
                        }

                        if (shouldSend) {
                            const message =
                                `🔔 <b>Class Reminder — Clarix</b>\n\n` +
                                `📚 <b>${course.title}</b>\n` +
                                `🏫 Room: <b>${course.room}</b>\n` +
                                `⏰ Starts in: <b>${reminderText}</b>\n` +
                                `🕐 Time: <b>${slot.startTime} - ${slot.endTime}</b>\n` +
                                `📅 Day Order: <b>${dayOrder}</b>`;

                            await sendTelegramMessage(user.telegram_chat_id, message);
                            remindersSent++;
                        }
                    }
                }
            } catch (err) {
                console.error(`Error processing user ${user.reg_number}:`, err);
            }
        }

        return NextResponse.json({ success: true, remindersSent });
    } catch (error) {
        console.error("Cron error:", error);
        return NextResponse.json({ error: "Cron failed" }, { status: 500 });
    }
}