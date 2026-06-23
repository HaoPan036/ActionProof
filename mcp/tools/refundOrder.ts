import { z } from "zod";
import { defaultPolicy } from "@/lib/demo/defaultPolicy";
import { simulateRefundOrder } from "@/lib/demo/simulatedTools";
import { decide } from "@/lib/policy-engine/decide";
import { writeMcpAuditEvent } from "../auditStore";
import {
  RefundOrderArgsSchema,
  normalizeRefundOrder,
  type RefundOrderArgs,
} from "../normalize";
import { buildGatedResponse } from "./shared";

export const refundOrderInputSchema = {
  orderId: z.string().min(1),
  customerId: z.string().min(1),
  amount: z.number().nonnegative(),
  reason: z.string().min(1),
};

export async function handleRefundOrder(args: RefundOrderArgs) {
  const parsedArgs = RefundOrderArgsSchema.parse(args);
  const toolCall = normalizeRefundOrder(parsedArgs);
  const decision = decide(toolCall, defaultPolicy);
  writeMcpAuditEvent(toolCall, decision);

  const syntheticResult =
    decision.decision === "ALLOW" ? simulateRefundOrder(parsedArgs) : null;

  return buildGatedResponse(decision, syntheticResult);
}
