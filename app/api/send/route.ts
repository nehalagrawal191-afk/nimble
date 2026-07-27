import { NextResponse } from "next/server";
import { z } from "zod";
import { sendNewsletter } from "@/lib/email";
import { newsletterBriefSchema } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  brief: newsletterBriefSchema
});

export async function POST(request: Request) {
  try {
    const { brief } = requestSchema.parse(await request.json());
    const result = await sendNewsletter(brief);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send newsletter.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
