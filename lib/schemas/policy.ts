import { z } from "zod";

export const POLICY_DECISIONS = ["ALLOW", "APPROVAL", "DENY"] as const;

export const ACTIONS = [
  "refund_order",
  "view_order",
  "send_coupon",
  "export_customer_data",
  "bulk_refund",
  "modify_policy",
  "unknown",
] as const;

export const CONDITION_OPERATORS = [
  "eq",
  "neq",
  "lt",
  "lte",
  "gt",
  "gte",
  "in",
  "contains",
] as const;

export const CONDITION_FIELDS = [
  "amount",
  "refund_count",
  "customer_data_type",
  "customer_tier",
  "reason_category",
  "contains_prompt_injection",
  "action_count",
  "risk_level",
  "evidence_provided",
  "has_delivery_issue",
  "refund_count_30d",
  "refund_amount_30d",
  "account_age_days",
  "same_address_refund_count_30d",
] as const;

const actionSet = new Set<string>(ACTIONS);

export const PolicyDecisionSchema = z.enum(POLICY_DECISIONS);

export const ActionSchema = z.preprocess((value) => {
  if (typeof value === "string" && actionSet.has(value)) {
    return value;
  }

  return "unknown";
}, z.enum(ACTIONS));

export const ConditionOperatorSchema = z.enum(CONDITION_OPERATORS);
export const ConditionFieldSchema = z.enum(CONDITION_FIELDS);

export const ConditionPrimitiveValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
]);

export const ConditionValueSchema = z.union([
  ConditionPrimitiveValueSchema,
  z.array(ConditionPrimitiveValueSchema),
]);

export const ConditionSchema = z.object({
  field: ConditionFieldSchema,
  operator: ConditionOperatorSchema,
  value: ConditionValueSchema,
});

export const PolicyRuleSchema = z.object({
  id: z.string().min(1),
  priority: z.number().int(),
  action: ActionSchema,
  decision: PolicyDecisionSchema,
  all: z.array(ConditionSchema).default([]),
  any: z.array(ConditionSchema).default([]),
  reason: z.string().min(1),
  sourceSopLines: z.array(z.number().int().positive()).default([]),
});

export const PolicySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  defaultDecision: z.literal("DENY").default("DENY"),
  rules: z.array(PolicyRuleSchema),
});

export const DecisionResultSchema = z.object({
  decision: PolicyDecisionSchema,
  matchedRuleId: z.string().nullable(),
  reason: z.string(),
  sourceSopLines: z.array(z.number().int().positive()),
  containsPromptInjection: z.boolean(),
});

export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type ConditionOperator = z.infer<typeof ConditionOperatorSchema>;
export type ConditionField = z.infer<typeof ConditionFieldSchema>;
export type ConditionValue = z.infer<typeof ConditionValueSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type PolicyRule = z.infer<typeof PolicyRuleSchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type DecisionResult = z.infer<typeof DecisionResultSchema>;
