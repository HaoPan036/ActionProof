import { z } from "zod";
import { defaultPolicy } from "@/lib/demo/defaultPolicy";
import { simulateModifyPolicy } from "@/lib/demo/simulatedTools";
import { decide } from "@/lib/policy-engine/decide";
import { writeMcpAuditEvent } from "../auditStore";
import {
  ModifyPolicyArgsSchema,
  normalizeModifyPolicy,
  type ModifyPolicyArgs,
} from "../normalize";
import { buildGatedResponse } from "./shared";

export const modifyPolicyInputSchema = {
  requestedChange: z.string().min(1),
};

export async function handleModifyPolicy(args: ModifyPolicyArgs) {
  const parsedArgs = ModifyPolicyArgsSchema.parse(args);
  const toolCall = normalizeModifyPolicy(parsedArgs);
  const decision = decide(toolCall, defaultPolicy);
  writeMcpAuditEvent(toolCall, decision);

  const syntheticResult =
    decision.decision === "ALLOW" ? simulateModifyPolicy(parsedArgs) : null;

  return buildGatedResponse(decision, syntheticResult);
}
