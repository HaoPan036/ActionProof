import { describe, expect, it } from "vitest";
import { parseCompiledPolicyOutput } from "@/lib/openai/compilePolicy";
import { parseExtractedToolCallOutput } from "@/lib/openai/extractToolCall";
import { decide } from "@/lib/policy-engine/decide";

describe("OpenAI helper validation", () => {
  it("validates and safety-normalizes compiled policies without live OpenAI calls", () => {
    const policy = parseCompiledPolicyOutput({
      id: "generated_policy",
      name: "Generated Policy",
      version: "1.0.0",
      defaultDecision: "DENY",
      rules: [
        {
          id: "unsafe_export_allow",
          priority: 10,
          action: "export_customer_data",
          decision: "ALLOW",
          all: [],
          any: [],
          reason: "Model attempted unsafe allow.",
          sourceSopLines: [10],
        },
      ],
    });

    expect(policy.defaultDecision).toBe("DENY");
    expect(policy.rules[0].decision).toBe("DENY");
    expect(policy.rules[0].reason).toContain("PolicyGate safety override");
  });

  it("rejects compiled rules that omit source SOP lines", () => {
    expect(() =>
      parseCompiledPolicyOutput({
        id: "generated_policy",
        name: "Generated Policy",
        version: "1.0.0",
        defaultDecision: "DENY",
        rules: [
          {
            id: "missing_source",
            priority: 10,
            action: "refund_order",
            decision: "ALLOW",
            all: [{ field: "amount", operator: "lte", value: 50 }],
            any: [],
            reason: "Small refund.",
            sourceSopLines: [],
          },
        ],
      }),
    ).toThrow("missing source SOP lines");
  });

  it("normalizes unsafe compiled refund priority order before decisions", () => {
    const policy = parseCompiledPolicyOutput({
      id: "generated_policy",
      name: "Generated Policy",
      version: "1.0.0",
      defaultDecision: "DENY",
      rules: [
        {
          id: "allow_small_low_risk_refund",
          priority: 1,
          action: "refund_order",
          decision: "ALLOW",
          all: [
            { field: "amount", operator: "lte", value: 50 },
            { field: "risk_level", operator: "eq", value: "LOW" },
          ],
          any: [],
          reason: "Low value and low risk refunds may be approved.",
          sourceSopLines: [1],
        },
        {
          id: "deny_repeated_refund_abuse",
          priority: 2,
          action: "refund_order",
          decision: "DENY",
          all: [{ field: "refund_count_30d", operator: "gte", value: 5 }],
          any: [],
          reason: "Customer has 5 or more refund requests in 30 days.",
          sourceSopLines: [5],
        },
      ],
    });

    const abuseRule = policy.rules.find(
      (rule) => rule.id === "deny_repeated_refund_abuse",
    );
    const allowRule = policy.rules.find(
      (rule) => rule.id === "allow_small_low_risk_refund",
    );

    expect(abuseRule?.priority).toBeLessThan(allowRule?.priority ?? Infinity);

    const decision = decide(
      {
        id: "tool_repeated_abuse_after_compile",
        action: "refund_order",
        amount: 20,
        refund_count: 8,
        customer_tier: "standard",
        reason_category: "delivery_issue",
        contains_prompt_injection: false,
        action_count: 1,
        rawUserRequest:
          "Refund order ord_syn_2001 for $20. Customer has 8 refunds in 30 days.",
        riskLevel: "LOW",
        riskSignals: ["8 refunds in 30 days"],
        evidenceProvided: true,
        hasDeliveryIssue: true,
        refundCount30d: 8,
        refundAmount30d: 120,
        accountAgeDays: 60,
        sameAddressRefundCount30d: 1,
      },
      policy,
    );

    expect(decision.decision).toBe("DENY");
    expect(decision.matchedRuleId).toBe("deny_repeated_refund_abuse");
  });

  it("normalizes extracted candidate actions without returning a decision", () => {
    const toolCall = parseExtractedToolCallOutput(
      {
        action: "refund_order",
        amount: 125,
        refund_count: null,
        customer_data_type: null,
        customer_tier: "standard",
        reason_category: "damaged_item",
        containsPromptInjection: false,
        action_count: 1,
        customerId: null,
        orderId: "ord_syn_1002",
        rawUserRequest: "Refund order ord_syn_1002 for $125.",
        riskLevel: "LOW",
        riskSignals: ["amount requires approval"],
        evidenceProvided: true,
        hasDeliveryIssue: true,
        refundCount30d: 1,
        refundAmount30d: 30,
        accountAgeDays: 120,
        sameAddressRefundCount30d: 0,
      },
      "Refund order ord_syn_1002 for $125.",
    );

    expect(toolCall.id).toMatch(/^tool_extracted_/);
    expect(toolCall.action).toBe("refund_order");
    expect(toolCall.amount).toBe(125);
    expect(toolCall.orderId).toBe("ord_syn_1002");
    expect(toolCall.riskLevel).toBe("LOW");
    expect(toolCall.riskSignals).toContain("amount requires approval");
    expect(toolCall.contains_prompt_injection).toBe(false);
    expect("decision" in toolCall).toBe(false);
  });

  it("converts blank optional string fields to null", () => {
    const toolCall = parseExtractedToolCallOutput(
      {
        action: "refund_order",
        amount: 30,
        refund_count: null,
        customer_data_type: "",
        customer_tier: " ",
        reason_category: "",
        containsPromptInjection: false,
        action_count: 1,
        customerId: "",
        orderId: "ord_syn_1004",
        rawUserRequest: "Refund order ord_syn_1004 for $30.",
        riskLevel: "MEDIUM",
        riskSignals: [],
        evidenceProvided: false,
        hasDeliveryIssue: false,
        refundCount30d: null,
        refundAmount30d: null,
        accountAgeDays: null,
        sameAddressRefundCount30d: null,
      },
      "Refund order ord_syn_1004 for $30.",
    );

    expect(toolCall.customer_data_type).toBeNull();
    expect(toolCall.customer_tier).toBeNull();
    expect(toolCall.reason_category).toBeNull();
    expect(toolCall.customerId).toBeNull();
    expect(toolCall.orderId).toBe("ord_syn_1004");
  });
});
