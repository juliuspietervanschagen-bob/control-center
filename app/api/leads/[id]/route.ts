import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { compileEditedEmail } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }
  if (lead.stage === "SENT") {
    return NextResponse.json({ error: "Sent emails cannot be edited." }, { status: 409 });
  }

  const body = (await request.json()) as { subject?: string; bodyText?: string };
  const subject = (body.subject ?? lead.subject ?? "").trim();
  const bodyText = (body.bodyText ?? lead.bodyText ?? "").trim();
  if (!subject || !bodyText) {
    return NextResponse.json({ error: "Subject and body are required." }, { status: 400 });
  }

  const compiled = await compileEditedEmail({
    companyName: lead.companyName,
    email: lead.email,
    industry: lead.industry,
    language: lead.language,
    website: lead.website,
    dashboardId: lead.dashboardId,
    subject,
    bodyText,
  });

  const updated = await prisma.lead.update({
    where: { id },
    data: {
      subject,
      bodyText,
      html: compiled.html,
      stage: "READY_FOR_REVIEW",
    },
  });

  return NextResponse.json({ lead: updated, wordCount: compiled.wordCount });
}
