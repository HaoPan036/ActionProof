import type { AuditEvent } from "@/lib/schemas/audit";
import type { DecisionResult } from "@/lib/schemas/policy";
import type { ToolCall } from "@/lib/schemas/toolCall";

const auditEvents: AuditEvent[] = [];

export function writeMcpAuditEvent(
  toolCall: ToolCall,
  decision: DecisionResult,
): AuditEvent {
  const event: AuditEvent = {
    id: `mcp_audit_${Date.now()}_${auditEvents.length + 1}`,
    timestamp: new Date().toISOString(),
    toolCall: {
      ...toolCall,
      contains_prompt_injection: decision.containsPromptInjection,
    },
    decision: decision.decision,
    matchedRuleId: decision.matchedRuleId,
    reason: decision.reason,
    sourceSopLines: decision.sourceSopLines,
    containsPromptInjection: decision.containsPromptInjection,
  };

  auditEvents.unshift(event);
  return event;
}

export function listMcpAuditEvents(): AuditEvent[] {
  return [...auditEvents];
}

export function formatAuditEvent(event: AuditEvent): string {
  return [
    `${event.timestamp} ${event.toolCall.action} -> ${event.decision}`,
    `matchedRuleId=${event.matchedRuleId ?? "default-deny"}`,
    `reason=${event.reason}`,
    `sourceSopLines=${event.sourceSopLines.join(",") || "none"}`,
  ].join(" | ");
}
