import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        const { amount } = await req.json();
        if (!amount || amount < 100) {
            return NextResponse.json({ error: "Minimum amount is ₹1" }, { status: 400 });
        }
        const order = await razorpay.orders.create({
            amount: amount,
            currency: "INR",
            receipt: `clarix_${Date.now()}`,
        });
        return NextResponse.json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
        });
    } catch (err) {
        console.error("Razorpay order error:", err);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}