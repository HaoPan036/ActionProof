import {
  DecisionResultSchema,
  PolicySchema,
  type DecisionResult,
} from "@/lib/schemas/policy";
import { ToolCallSchema, type ToolCall } from "@/lib/schemas/toolCall";
import { matchesRule } from "./conditions";
import { enrichToolCallSignals } from "./signals";

function deny(reason: string, toolCall?: ToolCall): DecisionResult {
  return DecisionResultSchema.parse({
    decision: "DENY",
    matchedRuleId: null,
    reason,
    sourceSopLines: [],
    containsPromptInjection: toolCall?.contains_prompt_injection ?? false,
  });
}

export function decide(toolCallInput: unknown, policyInput: unknown): DecisionResult {
  const toolCallResult = ToolCallSchema.safeParse(toolCallInput);
  if (!toolCallResult.success) {
    return deny("Invalid tool call. Default DENY applied.");
  }

  const policyResult = PolicySchema.safeParse(policyInput);
  if (!policyResult.success) {
    return deny("Invalid policy. Default DENY applied.", toolCallResult.data);
  }

  const toolCall = enrichToolCallSignals(toolCallResult.data);
  const policy = policyResult.data;
  const orderedRules = [...policy.rules].sort(
    (left, right) => left.priority - right.priority,
  );

  const matchedRule = orderedRules.find((rule) => matchesRule(toolCall, rule));

  if (!matchedRule) {
    return DecisionResultSchema.parse({
      decision: policy.defaultDecision,
      matchedRuleId: null,
      reason: "No policy rule matched. Default DENY applied.",
      sourceSopLines: [],
      containsPromptInjection: toolCall.contains_prompt_injection,
    });
  }

  return DecisionResultSchema.parse({
    decision: matchedRule.decision,
    matchedRuleId: matchedRule.id,
    reason: matchedRule.reason,
    sourceSopLines: matchedRule.sourceSopLines,
    containsPromptInjection: toolCall.contains_prompt_injection,
  });
}
