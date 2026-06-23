import {
  PolicySchema,
  type Action,
  type ConditionField,
  type ConditionOperator,
  type Policy,
  type PolicyRule,
} from "@/lib/schemas/policy";

const forbiddenActions = new Set<Action>([
  "export_customer_data",
  "bulk_refund",
  "modify_policy",
]);

function hasNumericCondition(
  rule: PolicyRule,
  field: ConditionField,
  operator: ConditionOperator,
  value: number,
): boolean {
  return [...rule.all, ...rule.any].some(
    (condition) =>
      condition.field === field &&
      condition.operator === operator &&
      condition.value === value,
  );
}

function hasBooleanCondition(
  rule: PolicyRule,
  field: ConditionField,
  operator: ConditionOperator,
  value: boolean,
): boolean {
  return [...rule.all, ...rule.any].some(
    (condition) =>
      condition.field === field &&
      condition.operator === operator &&
      condition.value === value,
  );
}

function isRefundAbuseDeny(rule: PolicyRule): boolean {
  return (
    rule.action === "refund_order" &&
    rule.decision === "DENY" &&
    (hasNumericCondition(rule, "refund_count_30d", "gte", 5) ||
      hasNumericCondition(rule, "refund_amount_30d", "gt", 200) ||
      hasNumericCondition(rule, "same_address_refund_count_30d", "gte", 10))
  );
}

function isPromptInjectionDeny(rule: PolicyRule): boolean {
  return (
    rule.decision === "DENY" &&
    hasBooleanCondition(rule, "contains_prompt_injection", "eq", true)
  );
}

function isHighValueRefundDeny(rule: PolicyRule): boolean {
  return (
    rule.action === "refund_order" &&
    rule.decision === "DENY" &&
    hasNumericCondition(rule, "amount", "gt", 200)
  );
}

function isForbiddenActionDeny(rule: PolicyRule): boolean {
  return rule.decision === "DENY" && forbiddenActions.has(rule.action);
}

function isRefundAllow(rule: PolicyRule): boolean {
  return rule.action === "refund_order" && rule.decision === "ALLOW";
}

function isFallbackRule(rule: PolicyRule): boolean {
  return (
    rule.action === "unknown" ||
    (rule.decision === "DENY" && rule.all.length === 0 && rule.any.length === 0)
  );
}

function safetyTier(rule: PolicyRule): number {
  if (isRefundAbuseDeny(rule)) {
    return 0;
  }

  if (isPromptInjectionDeny(rule)) {
    return 1;
  }

  if (isHighValueRefundDeny(rule)) {
    return 2;
  }

  if (isForbiddenActionDeny(rule)) {
    return 3;
  }

  if (rule.action === "refund_order" && rule.decision === "DENY") {
    return 4;
  }

  if (rule.action === "refund_order" && rule.decision === "APPROVAL") {
    return 5;
  }

  if (isRefundAllow(rule)) {
    return 6;
  }

  if (isFallbackRule(rule)) {
    return 9;
  }

  if (rule.decision === "DENY") {
    return 7;
  }

  if (rule.decision === "APPROVAL") {
    return 8;
  }

  return 10;
}

export function normalizePolicy(policy: Policy): Policy {
  const parsedPolicy = PolicySchema.parse({
    ...policy,
    defaultDecision: "DENY",
  });

  const orderedRules = parsedPolicy.rules
    .map((rule, originalIndex) => ({ rule, originalIndex }))
    .sort((left, right) => {
      const tierDiff = safetyTier(left.rule) - safetyTier(right.rule);
      if (tierDiff !== 0) {
        return tierDiff;
      }

      const priorityDiff = left.rule.priority - right.rule.priority;
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const idDiff = left.rule.id.localeCompare(right.rule.id);
      if (idDiff !== 0) {
        return idDiff;
      }

      return left.originalIndex - right.originalIndex;
    })
    .map(({ rule }, index) => ({
      ...rule,
      priority: index + 1,
    }));

  return PolicySchema.parse({
    ...parsedPolicy,
    defaultDecision: "DENY",
    rules: orderedRules,
  });
}
