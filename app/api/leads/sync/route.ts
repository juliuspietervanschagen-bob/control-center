import { NextResponse } from "next/server";
import { syncLeadsFromDashboard } from "@/lib/externalDashboard";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { upserted } = await syncLeadsFromDashboard();
    const leads = await prisma.lead.findMany({
      orderBy: [{ stage: "asc" }, { companyName: "asc" }],
    });
    return NextResponse.json({ upserted, leads });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
