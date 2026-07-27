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

function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return (h < 7 ? h + 12 : h) * 60 + m;
}

function getTodayIST(): string {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    return istNow.toISOString().split("T")[0];
}

function getCurrentISTMinutes(): number {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    return istNow.getHours() * 60 + istNow.getMinutes();
}

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const today = getTodayIST();
        const currentMinutes = getCurrentISTMinutes();

        // ✅ Step 1 — Read planner_cache once for all users
        const { data: plannerCache, error: plannerError } = await supabase
            .from("planner_cache")
            .select("planner_map")
            .eq("id", 1)
            .single();

        if (plannerError || !plannerCache) {
            return NextResponse.json({ error: "Planner cache not found" }, { status: 500 });
        }

        const plannerMap = plannerCache.planner_map;

        // ✅ Check today's day order once for all users
        const todayPlanner = plannerMap[today];
        if (!todayPlanner || !todayPlanner.dayOrder) {
            console.log(`⏭️ No classes today (${today}) — holiday or weekend`);
            return NextResponse.json({ success: true, remindersSent: 0, date: today, currentMinutes, message: "No classes today" });
        }

        const dayOrder = todayPlanner.dayOrder;
        console.log(`📅 Today is DO ${dayOrder}`);

        // ✅ Step 2 — Read all users with notifications enabled
        const { data: users, error } = await supabase
            .from("user_notifications")
            .select("*")
            .eq("notifications_on", true)
            .not("telegram_chat_id", "is", null)
            .not("timetable_json", "is", null);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!users || users.length === 0) {
            return NextResponse.json({ success: true, message: "No users to notify" });
        }

        let remindersSent = 0;

        // ✅ Step 3 — Send reminders for each user
        for (const user of users) {
            try {
                const timetable = user.timetable_json?.timetable;
                if (!timetable) continue;

                const daySlots = timetable[dayOrder] || [];
                if (daySlots.length === 0) continue;

                console.log(`📅 ${user.reg_number} — today is DO ${dayOrder}`);

                for (const slot of daySlots) {
                    const classMinutes = timeToMinutes(slot.startTime);
                    const minutesUntilClass = classMinutes - currentMinutes;

                    for (const course of slot.courses) {
                        let shouldSend = false;
                        let reminderText = "";

                        if (user.remind_1hr && minutesUntilClass >= 53 && minutesUntilClass <= 67) {
                            shouldSend = true;
                            reminderText = "1 hour";
                        } else if (user.remind_30min && minutesUntilClass >= 23 && minutesUntilClass <= 37) {
                            shouldSend = true;
                            reminderText = "30 minutes";
                        } else if (user.remind_15min && minutesUntilClass >= 8 && minutesUntilClass <= 22) {
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
                            console.log(`✅ Reminder sent to ${user.reg_number} for ${course.title}`);
                        }
                    }
                }
            } catch (err) {
                console.error(`Error processing user ${user.reg_number}:`, err);
            }
        }

        return NextResponse.json({ success: true, remindersSent, date: today, currentMinutes });
    } catch (error) {
        console.error("Cron error:", error);
        return NextResponse.json({ error: "Cron failed" }, { status: 500 });
    }
}