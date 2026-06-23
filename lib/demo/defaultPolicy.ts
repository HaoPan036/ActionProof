import { ACTIONS, PolicySchema, type Policy } from "@/lib/schemas/policy";

const injectionRules = ACTIONS.map((action, index) => ({
  id: `deny-prompt-injection-${action}`,
  priority: 10 + index,
  action,
  decision: "DENY" as const,
  all: [
    {
      field: "contains_prompt_injection" as const,
      operator: "eq" as const,
      value: true,
    },
  ],
  any: [],
  reason: "Policy bypass, hiding, or override attempt detected.",
  sourceSopLines: [13],
}));

export const defaultPolicy: Policy = PolicySchema.parse({
  id: "policygate-demo-policy",
  name: "PolicyGate Demo Policy",
  version: "1.0.0",
  defaultDecision: "DENY",
  rules: [
    ...injectionRules,
    {
      id: "allow-refund-up-to-50",
      priority: 100,
      action: "refund_order",
      decision: "ALLOW",
      all: [{ field: "amount", operator: "lte", value: 50 }],
      any: [],
      reason: "Refund amount is up to and including $50.",
      sourceSopLines: [7],
    },
    {
      id: "approve-refund-over-50-up-to-200",
      priority: 110,
      action: "refund_order",
      decision: "APPROVAL",
      all: [
        { field: "amount", operator: "gt", value: 50 },
        { field: "amount", operator: "lte", value: 200 },
      ],
      any: [],
      reason: "Refund amount is above $50 and up to and including $200.",
      sourceSopLines: [8],
    },
    {
      id: "deny-refund-over-200",
      priority: 120,
      action: "refund_order",
      decision: "DENY",
      all: [{ field: "amount", operator: "gt", value: 200 }],
      any: [],
      reason: "Refund amount is above $200.",
      sourceSopLines: [9],
    },
    {
      id: "deny-export-customer-data",
      priority: 130,
      action: "export_customer_data",
      decision: "DENY",
      all: [
        {
          field: "customer_data_type",
          operator: "in",
          value: ["email", "address", "phone", "personal_data"],
        },
      ],
      any: [],
      reason: "Exporting customer emails, addresses, phone numbers, or personal data is forbidden.",
      sourceSopLines: [10],
    },
    {
      id: "deny-modify-policy",
      priority: 140,
      action: "modify_policy",
      decision: "DENY",
      all: [],
      any: [],
      reason: "Modifying permission rules is forbidden.",
      sourceSopLines: [11],
    },
    {
      id: "deny-bulk-refund",
      priority: 150,
      action: "bulk_refund",
      decision: "DENY",
      all: [],
      any: [],
      reason: "Bulk refunds are forbidden.",
      sourceSopLines: [12],
    },
  ],
});
