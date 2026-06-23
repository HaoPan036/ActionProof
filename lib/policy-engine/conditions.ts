import type { Condition, PolicyRule } from "@/lib/schemas/policy";
import type { ToolCall } from "@/lib/schemas/toolCall";
import { getSignalValue } from "./signals";

type Primitive = string | number | boolean;

function isPrimitive(value: unknown): value is Primitive {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function toPrimitiveArray(value: Condition["value"]): Primitive[] {
  return Array.isArray(value) ? value : [value];
}

function compareNumbers(
  actual: unknown,
  expected: unknown,
  compare: (left: number, right: number) => boolean,
): boolean {
  if (typeof actual !== "number" || typeof expected !== "number") {
    return false;
  }

  return compare(actual, expected);
}

export function matchesCondition(
  toolCall: ToolCall,
  condition: Condition,
): boolean {
  const actual = getSignalValue(toolCall, condition.field);
  const expected = condition.value;

  switch (condition.operator) {
    case "eq":
      return Object.is(actual, expected);
    case "neq":
      return !Object.is(actual, expected);
    case "lt":
      return compareNumbers(actual, expected, (left, right) => left < right);
    case "lte":
      return compareNumbers(actual, expected, (left, right) => left <= right);
    case "gt":
      return compareNumbers(actual, expected, (left, right) => left > right);
    case "gte":
      return compareNumbers(actual, expected, (left, right) => left >= right);
    case "in":
      return toPrimitiveArray(expected).some((value) => Object.is(actual, value));
    case "contains":
      if (typeof actual === "string" && typeof expected === "string") {
        return actual.includes(expected);
      }

      if (Array.isArray(actual) && isPrimitive(expected)) {
        return actual.some((value) => Object.is(value, expected));
      }

      return false;
    default:
      return false;
  }
}

export function matchesRule(toolCall: ToolCall, rule: PolicyRule): boolean {
  if (toolCall.action !== rule.action) {
    return false;
  }

  const allMatches = rule.all.every((condition) =>
    matchesCondition(toolCall, condition),
  );
  const anyMatches =
    rule.any.length === 0 ||
    rule.any.some((condition) => matchesCondition(toolCall, condition));

  return allMatches && anyMatches;
}
