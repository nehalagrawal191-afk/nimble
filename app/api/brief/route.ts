import { NextResponse } from "next/server";
import { z } from "zod";
import { runGtmSignalAgent } from "@/lib/agent";
import { saveBrief } from "@/lib/store";

export const runtime = "nodejs";

const requestSchema = z.object({
  prompt: z.string().min(10),
  competitors: z.string().min(3)
});

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());
    const competitorList = payload.competitors
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const brief = await runGtmSignalAgent({
      prompt: payload.prompt,
      competitors: competitorList
    });

    saveBrief(brief);
    return NextResponse.json({ brief });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate brief.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
