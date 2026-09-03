import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { compileEditedEmail } from "@/lib/ai";
import { sendApprovedEmail, SmtpError } from "@/lib/mailer";
import { updateLeadStatus } from "@/lib/externalDashboard";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const payload = (await request.json().catch(() => ({}))) as {
    subject?: string;
    bodyText?: string;
  };
  const subject = (payload.subject ?? lead.subject ?? "").trim();
  const bodyText = (payload.bodyText ?? lead.bodyText ?? "").trim();
  if (!subject || !bodyText) {
    return NextResponse.json({ error: "Approve a draft before sending." }, { status: 400 });
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

  try {
    const result = await sendApprovedEmail({
      to: lead.email,
      subject,
      text: bodyText,
      html: compiled.html,
    });

    try {
      await updateLeadStatus(lead.dashboardId, "SENT", {
        subject,
        contacted_at: new Date().toISOString(),
      });
    } catch (syncError) {
      const reason = syncError instanceof Error ? syncError.message : String(syncError);
      await prisma.lead.update({
        where: { id },
        data: {
          subject,
          bodyText,
          html: compiled.html,
          stage: "SENT",
          sentAt: new Date(),
          dashboardStatus: "CONTACTED",
          error: `Sent, but dashboard sync failed: ${reason}`,
        },
      });
      return NextResponse.json({
        warning: `Email left this platform, but the external dashboard did not accept the status update. ${reason}`,
        mocked: result.mocked,
      });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        subject,
        bodyText,
        html: compiled.html,
        stage: "SENT",
        sentAt: new Date(),
        dashboardStatus: "CONTACTED",
        error: null,
      },
    });

    return NextResponse.json({ lead: updated, mocked: result.mocked });
  } catch (error) {
    const message =
      error instanceof SmtpError
        ? error.message
        : error instanceof Error
          ? error.message
          : "The mail server rejected this send.";
    await prisma.lead.update({
      where: { id },
      data: { error: message },
    });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
