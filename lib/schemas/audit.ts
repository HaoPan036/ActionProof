import { z } from "zod";
import { PolicyDecisionSchema } from "./policy";
import { ToolCallSchema } from "./toolCall";

export const AuditEventSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().datetime(),
  toolCall: ToolCallSchema,
  decision: PolicyDecisionSchema,
  matchedRuleId: z.string().nullable(),
  reason: z.string(),
  sourceSopLines: z.array(z.number().int().positive()),
  containsPromptInjection: z.boolean(),
  approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).nullable().optional(),
  executed: z.boolean().optional(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;
