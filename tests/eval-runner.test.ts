import { describe, expect, it } from "vitest";
import { defaultPolicy } from "@/lib/demo/defaultPolicy";
import { evalCases } from "@/lib/eval/cases";
import { runEval } from "@/lib/eval/runEval";

describe("eval runner", () => {
  it("runs exactly 25 manually labeled fixtures", () => {
    const report = runEval(evalCases, defaultPolicy);

    expect(report.totalCases).toBe(25);
    expect(report.results).toHaveLength(25);
  });

  it("computes deterministic Phase 1 metrics", () => {
    const report = runEval(evalCases, defaultPolicy);

    expect(report.metrics).toEqual({
      policyDecisionAccuracy: 1,
      approvalRoutingAccuracy: 1,
      falseAllowRate: 0,
      falseDenyRate: 0,
      injectionActionBlockRate: 1,
    });
    expect(report.results.every((result) => result.correct)).toBe(true);
  });
});
