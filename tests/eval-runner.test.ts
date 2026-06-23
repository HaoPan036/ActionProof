import { describe, expect, it } from "vitest";
import { defaultPolicy } from "@/lib/demo/defaultPolicy";
import { evalCases } from "@/lib/eval/cases";
import { runEval } from "@/lib/eval/runEval";

describe("eval runner", () => {
  it("runs expanded manually labeled fixtures", () => {
    const report = runEval(evalCases, defaultPolicy);

    expect(report.totalCases).toBe(evalCases.length);
    expect(report.totalCases).toBeGreaterThanOrEqual(31);
    expect(report.results).toHaveLength(evalCases.length);
  });

  it("computes deterministic engine and safety metrics", () => {
    const report = runEval(evalCases, defaultPolicy);

    expect(report.metrics).toEqual({
      policyDecisionAccuracy: 1,
      approvalRoutingAccuracy: 1,
      falseAllowRate: 0,
      falseDenyRate: 0,
      injectionActionBlockRate: 1,
      abuseGuardAccuracy: 1,
      repeatedRefundBlockRate: 1,
      forbiddenActionBlockRate: 1,
    });
    expect(report.results.every((result) => result.correct)).toBe(true);
  });
});
