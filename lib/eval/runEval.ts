import { defaultPolicy } from "@/lib/demo/defaultPolicy";
import { decide } from "@/lib/policy-engine/decide";
import type { Policy, PolicyDecision } from "@/lib/schemas/policy";
import type { EvalCase } from "./cases";
import { evalCases } from "./cases";

export type EvalCaseResult = {
  id: string;
  expectedDecision: PolicyDecision;
  actualDecision: PolicyDecision;
  matchedRuleId: string | null;
  correct: boolean;
  isPromptInjection: boolean;
};

export type EvalMetrics = {
  policyDecisionAccuracy: number;
  approvalRoutingAccuracy: number;
  falseAllowRate: number;
  falseDenyRate: number;
  injectionActionBlockRate: number;
};

export type EvalReport = {
  totalCases: number;
  metrics: EvalMetrics;
  results: EvalCaseResult[];
};

function safeRate(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

export function runEval(
  cases: EvalCase[] = evalCases,
  policy: Policy = defaultPolicy,
): EvalReport {
  const results = cases.map((testCase) => {
    const decision = decide(testCase.toolCall, policy);

    return {
      id: testCase.id,
      expectedDecision: testCase.expectedDecision,
      actualDecision: decision.decision,
      matchedRuleId: decision.matchedRuleId,
      correct: decision.decision === testCase.expectedDecision,
      isPromptInjection: testCase.isPromptInjection ?? false,
    };
  });

  const correctCount = results.filter((result) => result.correct).length;
  const approvalCases = results.filter(
    (result) => result.expectedDecision === "APPROVAL",
  );
  const falseAllows = results.filter(
    (result) =>
      result.actualDecision === "ALLOW" && result.expectedDecision !== "ALLOW",
  );
  const nonAllowCases = results.filter(
    (result) => result.expectedDecision !== "ALLOW",
  );
  const falseDenies = results.filter(
    (result) =>
      result.actualDecision === "DENY" && result.expectedDecision !== "DENY",
  );
  const nonDenyCases = results.filter(
    (result) => result.expectedDecision !== "DENY",
  );
  const injectionCases = results.filter((result) => result.isPromptInjection);
  const blockedInjectionCases = injectionCases.filter(
    (result) => result.actualDecision === "DENY",
  );

  return {
    totalCases: cases.length,
    metrics: {
      policyDecisionAccuracy: safeRate(correctCount, results.length),
      approvalRoutingAccuracy: safeRate(
        approvalCases.filter((result) => result.actualDecision === "APPROVAL")
          .length,
        approvalCases.length,
      ),
      falseAllowRate: safeRate(falseAllows.length, nonAllowCases.length),
      falseDenyRate: safeRate(falseDenies.length, nonDenyCases.length),
      injectionActionBlockRate: safeRate(
        blockedInjectionCases.length,
        injectionCases.length,
      ),
    },
    results,
  };
}
