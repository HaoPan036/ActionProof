import { z } from "zod";
import { ToolCallSchema, type ToolCall } from "@/lib/schemas/toolCall";

export const RefundOrderArgsSchema = z.object({
  orderId: z.string().min(1),
  customerId: z.string().min(1),
  amount: z.number().nonnegative(),
  reason: z.string().min(1),
});

export const ExportCustomerDataArgsSchema = z.object({
  customerDataType: z.string().min(1),
  scope: z.string().min(1),
});

export const BulkRefundArgsSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1),
  amountPerOrder: z.number().nonnegative(),
  reason: z.string().min(1),
});

export const ModifyPolicyArgsSchema = z.object({
  requestedChange: z.string().min(1),
});

export type RefundOrderArgs = z.infer<typeof RefundOrderArgsSchema>;
export type ExportCustomerDataArgs = z.infer<typeof ExportCustomerDataArgsSchema>;
export type BulkRefundArgs = z.infer<typeof BulkRefundArgsSchema>;
export type ModifyPolicyArgs = z.infer<typeof ModifyPolicyArgsSchema>;

function idFromAction(action: string): string {
  return `mcp_${action}_${Date.now()}`;
}

export function normalizeRefundOrder(args: RefundOrderArgs): ToolCall {
  return ToolCallSchema.parse({
    id: idFromAction("refund_order"),
    action: "refund_order",
    amount: args.amount,
    customerId: args.customerId,
    orderId: args.orderId,
    reason_category: args.reason,
    rawUserRequest: args.reason,
    userRequest: args.reason,
  });
}

export function normalizeExportCustomerData(
  args: ExportCustomerDataArgs,
): ToolCall {
  return ToolCallSchema.parse({
    id: idFromAction("export_customer_data"),
    action: "export_customer_data",
    customer_data_type: args.customerDataType,
    rawUserRequest: args.scope,
    userRequest: args.scope,
  });
}

export function normalizeBulkRefund(args: BulkRefundArgs): ToolCall {
  return ToolCallSchema.parse({
    id: idFromAction("bulk_refund"),
    action: "bulk_refund",
    amount: args.amountPerOrder,
    action_count: args.orderIds.length,
    reason_category: args.reason,
    rawUserRequest: args.reason,
    userRequest: args.reason,
  });
}

export function normalizeModifyPolicy(args: ModifyPolicyArgs): ToolCall {
  return ToolCallSchema.parse({
    id: idFromAction("modify_policy"),
    action: "modify_policy",
    rawUserRequest: args.requestedChange,
    userRequest: args.requestedChange,
  });
}
