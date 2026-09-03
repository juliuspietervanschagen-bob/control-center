import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const leads = await prisma.lead.findMany({
    orderBy: [{ stage: "asc" }, { companyName: "asc" }],
  });
  return NextResponse.json({ leads });
}
