import { describe, expect, it } from "vitest";
import { parseCompiledPolicyOutput } from "@/lib/openai/compilePolicy";
import { parseExtractedToolCallOutput } from "@/lib/openai/extractToolCall";

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
});
