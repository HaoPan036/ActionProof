import type { ToolCall } from "@/lib/schemas/toolCall";

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|system|policy|sop|permission)\s+(instructions|rules|controls)?/i,
  /bypass\s+(the\s+)?(policy|approval|permission|control|guardrail)/i,
  /override\s+(the\s+)?(policy|approval|permission|control|guardrail)/i,
  /hide\s+(this|the request|the action|the refund|the export)/i,
  /do\s+not\s+(log|audit|record)/i,
  /without\s+(approval|permission|review)/i,
  /secretly|silently/i,
];

export function detectPromptInjection(text: string | undefined): boolean {
  if (!text) {
    return false;
  }

  return PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

export function enrichToolCallSignals(toolCall: ToolCall): ToolCall {
  const textFields = [toolCall.userRequest, toolCall.reason_category];
  const detected = textFields.some(detectPromptInjection);

  return {
    ...toolCall,
    contains_prompt_injection:
      toolCall.contains_prompt_injection || detected,
  };
}

export function getSignalValue(
  toolCall: ToolCall,
  field: keyof Pick<
    ToolCall,
    | "amount"
    | "refund_count"
    | "customer_data_type"
    | "customer_tier"
    | "reason_category"
    | "contains_prompt_injection"
    | "action_count"
  >,
) {
  return toolCall[field];
}
