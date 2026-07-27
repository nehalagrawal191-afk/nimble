import { NextResponse } from "next/server";
import { z } from "zod";
import { sendNewsletter } from "@/lib/email";
import { newsletterBriefSchema } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  brief: newsletterBriefSchema,
  recipient: z.string().email().max(254)
});

export async function POST(request: Request) {
  try {
    const { brief, recipient } = requestSchema.parse(await request.json());
    const result = await sendNewsletter(brief, recipient);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send newsletter.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
