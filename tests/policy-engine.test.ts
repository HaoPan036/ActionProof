import { describe, expect, it } from "vitest";
import { defaultPolicy } from "@/lib/demo/defaultPolicy";
import { evalCases } from "@/lib/eval/cases";
import { matchesCondition } from "@/lib/policy-engine/conditions";
import { decide } from "@/lib/policy-engine/decide";
import type { Condition } from "@/lib/schemas/policy";
import type { ToolCall } from "@/lib/schemas/toolCall";

function countByCategory(category: string): number {
  return evalCases.filter((testCase) => testCase.category === category).length;
}

describe("policy engine", () => {
  it("evaluates the 25 labeled fixtures with deterministic decisions", () => {
    expect(evalCases).toHaveLength(25);
    expect(countByCategory("allow_refund")).toBe(8);
    expect(countByCategory("approval_refund")).toBe(6);
    expect(countByCategory("deny")).toBe(6);
    expect(countByCategory("red_team")).toBe(5);

    for (const testCase of evalCases) {
      const firstDecision = decide(testCase.toolCall, defaultPolicy);
      const secondDecision = decide(testCase.toolCall, defaultPolicy);

      expect(firstDecision).toEqual(secondDecision);
      expect(firstDecision.decision, testCase.id).toBe(
        testCase.expectedDecision,
      );
    }
  });

  it("allows refund amounts up to and including 50", () => {
    for (const testCase of evalCases.filter(
      (item) => item.category === "allow_refund",
    )) {
      const decision = decide(testCase.toolCall, defaultPolicy);

      expect(testCase.toolCall.amount).toBeLessThanOrEqual(50);
      expect(decision.decision).toBe("ALLOW");
      expect(decision.matchedRuleId).toBe("allow-refund-up-to-50");
    }
  });

  it("routes refund amounts above 50 and up to 200 to approval", () => {
    for (const testCase of evalCases.filter(
      (item) => item.category === "approval_refund",
    )) {
      const decision = decide(testCase.toolCall, defaultPolicy);

      expect(testCase.toolCall.amount).toBeGreaterThan(50);
      expect(testCase.toolCall.amount).toBeLessThanOrEqual(200);
      expect(decision.decision).toBe("APPROVAL");
      expect(decision.matchedRuleId).toBe(
        "approve-refund-over-50-up-to-200",
      );
    }
  });

  it("denies out-of-policy actions by rule or by default deny", () => {
    const deniedCases = evalCases.filter((item) => item.category === "deny");

    for (const testCase of deniedCases) {
      const decision = decide(testCase.toolCall, defaultPolicy);

      expect(decision.decision).toBe("DENY");
    }

    const unknownDecision = decide(
      {
        id: "unmatched_send_coupon",
        action: "send_coupon",
      },
      defaultPolicy,
    );

    expect(unknownDecision.decision).toBe("DENY");
    expect(unknownDecision.matchedRuleId).toBeNull();
    expect(unknownDecision.reason).toContain("Default DENY");
  });

  it("denies red team attempts before lower priority allow or approval rules", () => {
    const redTeamCases = evalCases.filter((item) => item.category === "red_team");

    for (const testCase of redTeamCases) {
      const decision = decide(testCase.toolCall, defaultPolicy);

      expect(decision.decision).toBe("DENY");
      expect(decision.containsPromptInjection).toBe(true);
      expect(decision.matchedRuleId).toContain("deny-prompt-injection");
    }
  });

  it("maps unrecognized action names to unknown and denies them by default", () => {
    const decision = decide(
      {
        id: "invalid_action_name",
        action: "drop_synthetic_table",
      },
      defaultPolicy,
    );

    expect(decision.decision).toBe("DENY");
    expect(decision.matchedRuleId).toBeNull();
  });

  it("supports every required condition operator", () => {
    const toolCall: ToolCall = {
      id: "operator_check",
      action: "refund_order",
      amount: 42,
      refund_count: 1,
      customer_data_type: "email",
      customer_tier: "plus",
      reason_category: "shipping_delay",
      contains_prompt_injection: false,
      action_count: 1,
    };

    const matchingConditions: Condition[] = [
      { field: "amount", operator: "eq", value: 42 },
      { field: "customer_tier", operator: "neq", value: "standard" },
      { field: "amount", operator: "lt", value: 50 },
      { field: "amount", operator: "lte", value: 42 },
      { field: "amount", operator: "gt", value: 10 },
      { field: "amount", operator: "gte", value: 42 },
      { field: "customer_data_type", operator: "in", value: ["email"] },
      { field: "reason_category", operator: "contains", value: "delay" },
    ];

    for (const condition of matchingConditions) {
      expect(matchesCondition(toolCall, condition), condition.operator).toBe(
        true,
      );
    }
  });
});
