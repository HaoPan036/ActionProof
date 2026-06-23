import { z } from "zod";
import { defaultPolicy } from "@/lib/demo/defaultPolicy";
import { simulateBulkRefund } from "@/lib/demo/simulatedTools";
import { decide } from "@/lib/policy-engine/decide";
import { writeMcpAuditEvent } from "../auditStore";
import {
  BulkRefundArgsSchema,
  normalizeBulkRefund,
  type BulkRefundArgs,
} from "../normalize";
import { buildGatedResponse } from "./shared";

export const bulkRefundInputSchema = {
  orderIds: z.array(z.string().min(1)).min(1),
  amountPerOrder: z.number().nonnegative(),
  reason: z.string().min(1),
};

export async function handleBulkRefund(args: BulkRefundArgs) {
  const parsedArgs = BulkRefundArgsSchema.parse(args);
  const toolCall = normalizeBulkRefund(parsedArgs);
  const decision = decide(toolCall, defaultPolicy);
  writeMcpAuditEvent(toolCall, decision);

  const syntheticResult =
    decision.decision === "ALLOW" ? simulateBulkRefund(parsedArgs) : null;

  return buildGatedResponse(decision, syntheticResult);
}
