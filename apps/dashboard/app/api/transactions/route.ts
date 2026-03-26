import { NextResponse } from "next/server";
import "../loadDashboardEnv";
import { getAllPayments, getPendingPayments } from "@swigpay/agent-wallet";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pending = url.searchParams.get("pending") === "true";
    const payments = pending ? getPendingPayments() : getAllPayments(100);
    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Failed to load transactions:", error);
    return NextResponse.json(
      { error: "Database not available. Run setup scripts first.", payments: [] },
      { status: 503 },
    );
  }
}
