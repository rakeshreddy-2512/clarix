import { getSession } from "./redis";
import { NextRequest } from "next/server";

export interface SessionData {
    regNo: string;
    name: string;
    cookies: string;
}

export async function getSessionFromRequest(req: NextRequest): Promise<{ session: SessionData; token: string } | null> {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) return null;

    const session = await getSession(token);
    if (!session) return null;

    return { session, token };
}