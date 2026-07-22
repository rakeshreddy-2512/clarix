import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface UserNotification {
    reg_number: string;
    telegram_chat_id: number | null;
    notifications_on: boolean;
    remind_1hr: boolean;
    remind_30min: boolean;
    remind_15min: boolean;
    timetable_json: any;
    batch: number;
    updated_at: string;
}