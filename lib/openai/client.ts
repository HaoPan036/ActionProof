import OpenAI, { APIError } from "openai";

export class OpenAIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAIConfigurationError";
  }
}

export function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new OpenAIConfigurationError(
      "OpenAI API key is not configured. Preset deterministic demo still works.",
    );
  }

  return new OpenAI({ apiKey });
}

export function toPublicOpenAIError(error: unknown, modelName: string): string {
  if (error instanceof OpenAIConfigurationError) {
    return error.message;
  }

  if (error instanceof APIError) {
    if (error.status === 404 || error.code === "model_not_found") {
      return `Configured model "${modelName}" is unavailable. Update lib/config/models.ts or your model environment override.`;
    }

    return `OpenAI request failed: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "OpenAI request failed with an unknown error.";
}
