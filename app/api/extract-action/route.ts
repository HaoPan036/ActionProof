import { NextResponse } from "next/server";
import { z } from "zod";
import { ACTION_EXTRACTOR_MODEL } from "@/lib/config/models";
import { toPublicOpenAIError } from "@/lib/openai/client";
import { extractToolCallFromRequest } from "@/lib/openai/extractToolCall";

const ExtractActionRequestSchema = z.object({
  userRequest: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userRequest } = ExtractActionRequestSchema.parse(body);
    const toolCall = await extractToolCallFromRequest(userRequest);

    return NextResponse.json({ toolCall });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request: userRequest is required." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: toPublicOpenAIError(error, ACTION_EXTRACTOR_MODEL) },
      { status: 500 },
    );
  }
}
