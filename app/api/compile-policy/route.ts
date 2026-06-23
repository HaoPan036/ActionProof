import { NextResponse } from "next/server";
import { z } from "zod";
import { SOP_COMPILER_MODEL } from "@/lib/config/models";
import { toPublicOpenAIError } from "@/lib/openai/client";
import { compilePolicyFromSop } from "@/lib/openai/compilePolicy";

const CompilePolicyRequestSchema = z.object({
  sopText: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sopText } = CompilePolicyRequestSchema.parse(body);
    const policy = await compilePolicyFromSop(sopText);

    return NextResponse.json({ policy });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request: sopText is required." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: toPublicOpenAIError(error, SOP_COMPILER_MODEL) },
      { status: 500 },
    );
  }
}
