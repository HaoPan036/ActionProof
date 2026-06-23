import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { SOP_COMPILER_MODEL } from "@/lib/config/models";
import { createOpenAIClient } from "@/lib/openai/client";
import { normalizePolicy } from "@/lib/policy-engine/normalizePolicy";
import {
  ACTIONS,
  CONDITION_FIELDS,
  CONDITION_OPERATORS,
  POLICY_DECISIONS,
  PolicySchema,
  type Policy,
  type PolicyRule,
} from "@/lib/schemas/policy";

const OpenAIConditionPrimitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
]);

const OpenAIConditionSchema = z.object({
  field: z.enum(CONDITION_FIELDS),
  operator: z.enum(CONDITION_OPERATORS),
  value: z.union([
    OpenAIConditionPrimitiveSchema,
    z.array(OpenAIConditionPrimitiveSchema),
  ]),
});

const OpenAIPolicyRuleSchema = z.object({
  id: z.string(),
  priority: z.number().int(),
  action: z.enum(ACTIONS),
  decision: z.enum(POLICY_DECISIONS),
  all: z.array(OpenAIConditionSchema),
  any: z.array(OpenAIConditionSchema),
  reason: z.string(),
  sourceSopLines: z.array(z.number().int().positive()),
});

const OpenAIPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  defaultDecision: z.literal("DENY"),
  rules: z.array(OpenAIPolicyRuleSchema),
});

const riskyActions = new Set(["export_customer_data", "bulk_refund", "modify_policy"]);

function enforceGeneratedPolicySafety(policy: Policy): Policy {
  const safeRules: PolicyRule[] = policy.rules.map((rule) => {
    if (riskyActions.has(rule.action) && rule.decision === "ALLOW") {
      return {
        ...rule,
        decision: "DENY",
        reason: `PolicyGate safety override: ${rule.action} cannot be automatically allowed in the demo.`,
      };
    }

    return rule;
  });

  return PolicySchema.parse({
    ...policy,
    defaultDecision: "DENY",
    rules: safeRules,
  });
}

export function parseCompiledPolicyOutput(output: unknown): Policy {
  const policy = PolicySchema.parse(OpenAIPolicySchema.parse(output));

  for (const rule of policy.rules) {
    if (rule.sourceSopLines.length === 0) {
      throw new Error(`Generated rule "${rule.id}" is missing source SOP lines.`);
    }

    if (!rule.reason.trim()) {
      throw new Error(`Generated rule "${rule.id}" is missing a reason.`);
    }
  }

  return normalizePolicy(enforceGeneratedPolicySafety(policy));
}

export async function compilePolicyFromSop(sopText: string): Promise<Policy> {
  const trimmedSop = sopText.trim();

  if (!trimmedSop) {
    throw new Error("SOP text is required.");
  }

  const openai = createOpenAIClient();
  const completion = await openai.chat.completions.parse({
    model: SOP_COMPILER_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You compile synthetic demo SOP text into deterministic PolicyGate policy JSON. You never decide runtime permissions. Only produce policy rules that deterministic TypeScript will enforce later.",
      },
      {
        role: "user",
        content: [
          "Compile this SOP into a PolicyGate Policy object.",
          "Rules:",
          "- defaultDecision must be DENY.",
          "- Every rule must include sourceSopLines and a human readable reason.",
          "- Actions must be from the allowed enum only.",
          "- Decisions must be ALLOW, APPROVAL, or DENY only.",
          "- When SOP text explicitly says automatically approved or auto approved, use ALLOW for that matching rule.",
          "- If SOP language is ambiguous, choose DENY or APPROVAL instead of ALLOW.",
          "- Do not create ALLOW rules for export_customer_data, bulk_refund, or modify_policy in this demo.",
          "- Use all conditions for conjunctive checks and any conditions for alternatives.",
          "",
          "SOP:",
          trimmedSop,
        ].join("\n"),
      },
    ],
    response_format: zodResponseFormat(OpenAIPolicySchema, "policygate_policy"),
  });

  const parsed = completion.choices[0]?.message.parsed;

  if (!parsed) {
    throw new Error("OpenAI did not return a parsed policy.");
  }

  return parseCompiledPolicyOutput(parsed);
}
