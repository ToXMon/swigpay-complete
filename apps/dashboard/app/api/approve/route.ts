import { NextResponse } from "next/server";
import { updatePaymentStatus } from "@swigpay/agent-wallet";

export async function POST(req: Request) {
  const { id, action } = (await req.json()) as { id: number; action: "approve" | "reject" };
  if (!id || !action) return NextResponse.json({ error: "id and action required" }, { status: 400 });
  const status = action === "approve" ? "approved" : "rejected";
  updatePaymentStatus(id, status);
  return NextResponse.json({ success: true, id, status });
}
