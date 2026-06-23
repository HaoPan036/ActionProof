import { z } from "zod";
import { ActionSchema } from "./policy";

export const RiskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const ToolCallSchema = z.object({
  id: z.string().min(1),
  action: ActionSchema,
  amount: z.number().nonnegative().nullable().optional(),
  refund_count: z.number().int().nonnegative().nullable().optional(),
  customer_data_type: z.string().nullable().optional(),
  customer_tier: z.string().nullable().optional(),
  reason_category: z.string().nullable().optional(),
  contains_prompt_injection: z.boolean().default(false),
  action_count: z.number().int().positive().default(1),
  customerId: z.string().nullable().optional(),
  orderId: z.string().nullable().optional(),
  rawUserRequest: z.string().nullable().optional(),
  userRequest: z.string().nullable().optional(),
  riskLevel: RiskLevelSchema.nullable().optional(),
  riskSignals: z.array(z.string()).default([]),
  evidenceProvided: z.boolean().nullable().optional(),
  hasDeliveryIssue: z.boolean().nullable().optional(),
  refundCount30d: z.number().int().nonnegative().nullable().optional(),
  refundAmount30d: z.number().nonnegative().nullable().optional(),
  accountAgeDays: z.number().int().nonnegative().nullable().optional(),
  sameAddressRefundCount30d: z.number().int().nonnegative().nullable().optional(),
});

export type ToolCall = z.output<typeof ToolCallSchema>;
export type ToolCallInput = z.input<typeof ToolCallSchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
