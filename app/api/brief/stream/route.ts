import { z } from "zod";
import { streamGtmSignalAgent } from "@/lib/agent";
import { saveBrief } from "@/lib/store";
import { companyProfileSchema } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  profile: companyProfileSchema
});

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of streamGtmSignalAgent({ profile: payload.profile })) {
            if (event.type === "complete") saveBrief(event.brief);
            controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Agent run failed.";
          controller.enqueue(
            encoder.encode(`${JSON.stringify({ type: "error", message })}\n`)
          );
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start agent.";
    return Response.json({ error: message }, { status: 400 });
  }
}
