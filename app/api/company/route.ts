import { NextResponse } from "next/server";
import { z } from "zod";
import { discoverCompanyProfile } from "@/lib/company";

export const runtime = "nodejs";

const requestSchema = z.object({
  website: z.string().min(3)
});

export async function POST(request: Request) {
  try {
    const { website } = requestSchema.parse(await request.json());
    const profile = await discoverCompanyProfile(website);
    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to research company.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
