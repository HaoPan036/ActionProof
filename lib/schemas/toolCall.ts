import { z } from "zod";
import { ActionSchema } from "./policy";

export const ToolCallSchema = z.object({
  id: z.string().min(1),
  action: ActionSchema,
  amount: z.number().nonnegative().optional(),
  refund_count: z.number().int().nonnegative().optional(),
  customer_data_type: z.string().optional(),
  customer_tier: z.string().optional(),
  reason_category: z.string().optional(),
  contains_prompt_injection: z.boolean().default(false),
  action_count: z.number().int().positive().default(1),
  orderId: z.string().optional(),
  userRequest: z.string().optional(),
});

export type ToolCall = z.output<typeof ToolCallSchema>;
export type ToolCallInput = z.input<typeof ToolCallSchema>;
