import { NextResponse } from "next/server";
import "../loadDashboardEnv";
import { updatePaymentStatus } from "@swigpay/agent-wallet";
import { z } from "zod";

// Use absolute path to original database
process.env.DB_PATH ??= "/Users/tolushekoni/Documents/swigpay-complete/swigpay.db";

const approvalSchema = z.object({
  id: z.number().int().positive(),
  action: z.enum(["approve", "reject"]),
});

function isSameOriginRequest(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (!origin || !host) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Request not allowed." }, { status: 403 });
  }

  try {
    const parsedBody = approvalSchema.safeParse(await req.json());

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const status = parsedBody.data.action === "approve" ? "approved" : "rejected";
    updatePaymentStatus(parsedBody.data.id, status);

    return NextResponse.json({ success: true, id: parsedBody.data.id, status });
  } catch (error) {
    console.error("Failed to update payment approval", error);
    return NextResponse.json({ error: "Unable to update approval." }, { status: 500 });
  }
}
