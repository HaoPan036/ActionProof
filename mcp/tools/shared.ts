import type { DecisionResult } from "@/lib/schemas/policy";

export function buildGatedResponse(
  decision: DecisionResult,
  syntheticResult: unknown | null,
) {
  const executed = decision.decision === "ALLOW";

  return {
    status:
      decision.decision === "ALLOW"
        ? "executed"
        : decision.decision === "APPROVAL"
          ? "approval_required"
          : "gated_denied",
    decision: decision.decision,
    matchedRuleId: decision.matchedRuleId,
    reason: decision.reason,
    sourceSopLines: decision.sourceSopLines,
    executed,
    syntheticResult: executed ? syntheticResult : null,
  };
}
