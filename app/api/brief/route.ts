import { NextResponse } from "next/server";
import { z } from "zod";
import { runGtmSignalAgent } from "@/lib/agent";
import { saveBrief } from "@/lib/store";
import { companyProfileSchema } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  profile: companyProfileSchema
});

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());
    const brief = await runGtmSignalAgent({ profile: payload.profile });

    saveBrief(brief);
    return NextResponse.json({ brief });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate brief.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
