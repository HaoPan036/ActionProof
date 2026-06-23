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
  it("evaluates all labeled fixtures with deterministic decisions", () => {
    expect(evalCases.length).toBeGreaterThanOrEqual(31);
    expect(countByCategory("allow_refund")).toBe(8);
    expect(countByCategory("approval_refund")).toBe(6);
    expect(countByCategory("deny")).toBe(6);
    expect(countByCategory("red_team")).toBe(5);
    expect(countByCategory("abuse_guard")).toBe(6);

    for (const testCase of evalCases) {
      const firstDecision = decide(testCase.toolCall, defaultPolicy);
      const secondDecision = decide(testCase.toolCall, defaultPolicy);

      expect(firstDecision).toEqual(secondDecision);
      expect(firstDecision.decision, testCase.id).toBe(
        testCase.expectedDecision,
      );
    }
  });

  it("allows small refunds only when risk is LOW and abuse guard is clear", () => {
    for (const testCase of evalCases.filter(
      (item) => item.category === "allow_refund",
    )) {
      const decision = decide(testCase.toolCall, defaultPolicy);

      expect(testCase.toolCall.amount).toBeLessThanOrEqual(50);
      expect(testCase.toolCall.riskLevel).toBe("LOW");
      expect(decision.decision).toBe("ALLOW");
      expect(decision.matchedRuleId).toBe("allow-low-risk-refund-up-to-50");
    }
  });

  it("routes suspicious small refunds and mid-value refunds to approval", () => {
    for (const testCase of evalCases.filter(
      (item) => item.category === "approval_refund",
    )) {
      const decision = decide(testCase.toolCall, defaultPolicy);

      expect(decision.decision).toBe("APPROVAL");
      if ((testCase.toolCall.amount ?? 0) <= 50) {
        expect(["MEDIUM", "HIGH"]).toContain(testCase.toolCall.riskLevel);
        expect(decision.reason).toContain("risk");
      } else {
        expect(testCase.toolCall.amount).toBeLessThanOrEqual(200);
        expect(decision.matchedRuleId).toBe(
          "approve-refund-over-50-up-to-200",
        );
      }
    }
  });

  it("denies refund abuse before small refund allow rules", () => {
    const abuseCases = evalCases.filter(
      (item) => item.category === "abuse_guard",
    );

    for (const testCase of abuseCases) {
      const decision = decide(testCase.toolCall, defaultPolicy);

      expect(testCase.toolCall.amount).toBeLessThanOrEqual(50);
      expect(testCase.toolCall.riskLevel).toBe("LOW");
      expect(decision.decision).toBe("DENY");
      expect(decision.sourceSopLines.some((line) => [5, 6, 7].includes(line))).toBe(
        true,
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
      riskLevel: "LOW",
      riskSignals: [],
      evidenceProvided: true,
      hasDeliveryIssue: true,
      refundCount30d: 0,
      refundAmount30d: 0,
      accountAgeDays: 90,
      sameAddressRefundCount30d: 0,
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
      { field: "risk_level", operator: "eq", value: "LOW" },
      { field: "evidence_provided", operator: "eq", value: true },
      { field: "has_delivery_issue", operator: "eq", value: true },
      { field: "refund_count_30d", operator: "lt", value: 5 },
      { field: "refund_amount_30d", operator: "lte", value: 200 },
      { field: "account_age_days", operator: "gte", value: 30 },
      { field: "same_address_refund_count_30d", operator: "lt", value: 10 },
    ];

    for (const condition of matchingConditions) {
      expect(matchesCondition(toolCall, condition), condition.operator).toBe(
        true,
      );
    }
  });
});
