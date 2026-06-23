import { z } from "zod";
import { defaultPolicy } from "@/lib/demo/defaultPolicy";
import { simulateExportCustomerData } from "@/lib/demo/simulatedTools";
import { decide } from "@/lib/policy-engine/decide";
import { writeMcpAuditEvent } from "../auditStore";
import {
  ExportCustomerDataArgsSchema,
  normalizeExportCustomerData,
  type ExportCustomerDataArgs,
} from "../normalize";
import { buildGatedResponse } from "./shared";

export const exportCustomerDataInputSchema = {
  customerDataType: z.string().min(1),
  scope: z.string().min(1),
};

export async function handleExportCustomerData(args: ExportCustomerDataArgs) {
  const parsedArgs = ExportCustomerDataArgsSchema.parse(args);
  const toolCall = normalizeExportCustomerData(parsedArgs);
  const decision = decide(toolCall, defaultPolicy);
  writeMcpAuditEvent(toolCall, decision);

  const syntheticResult =
    decision.decision === "ALLOW" ? simulateExportCustomerData(parsedArgs) : null;

  return buildGatedResponse(decision, syntheticResult);
}
