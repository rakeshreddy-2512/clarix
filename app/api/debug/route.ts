import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import axios from "axios";

export async function GET(req: NextRequest) {
    try {
        const auth = await getSessionFromRequest(req);
        if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { cookies } = auth.session;
        const res = await axios.get(
            "https://academia.srmist.edu.in/srm_university/academia-academic-services/page/My_Time_Table_2023_24",
            {
                headers: {
                    Cookie: cookies,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                },
            }
        );

        // Return first 3000 chars so we can see the structure
        return NextResponse.json({
            length: res.data.length,
            preview: res.data.substring(0, 3000),
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}