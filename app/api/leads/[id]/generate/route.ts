import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateDraft } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }
  if (lead.stage === "SENT") {
    return NextResponse.json({ error: "This lead has already been contacted." }, { status: 409 });
  }

  try {
    const draft = await generateDraft({
      companyName: lead.companyName,
      email: lead.email,
      industry: lead.industry,
      language: lead.language,
      website: lead.website,
      dashboardId: lead.dashboardId,
    });
    const updated = await prisma.lead.update({
      where: { id },
      data: {
        subject: draft.subject,
        bodyText: draft.bodyText,
        html: draft.html,
        stage: "READY_FOR_REVIEW",
        generatedAt: new Date(),
        error: null,
      },
    });
    return NextResponse.json({ lead: updated, composer: draft.composer, wordCount: draft.wordCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Draft generation failed.";
    await prisma.lead.update({
      where: { id },
      data: { error: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
