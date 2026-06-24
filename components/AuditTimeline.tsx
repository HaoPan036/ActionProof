import { useMemo, useState } from "react";
import type { AuditEvent } from "@/lib/schemas/audit";

type AuditTimelineProps = {
  events: AuditEvent[];
  onSourceLineClick: (line: number) => void;
};

type AuditFilter = "All" | "Allowed" | "Approval" | "Denied" | "Abuse Guard";

const decisionBadgeStyles = {
  ALLOW: "bg-emerald-50 text-emerald-700",
  APPROVAL: "bg-amber-50 text-amber-700",
  DENY: "bg-rose-50 text-rose-700",
} satisfies Record<AuditEvent["decision"], string>;

const filters: AuditFilter[] = [
  "All",
  "Allowed",
  "Approval",
  "Denied",
  "Abuse Guard",
];

function isAbuseEvent(event: AuditEvent): boolean {
  const toolCall = event.toolCall;

  return (
    toolCall.action === "refund_order" &&
    ((toolCall.refundCount30d ?? 0) >= 5 ||
      (toolCall.refundAmount30d ?? 0) > 200 ||
      (toolCall.sameAddressRefundCount30d ?? 0) >= 10)
  );
}

function keyParameters(event: AuditEvent): string {
  const toolCall = event.toolCall;
  const parts = [
    toolCall.amount !== null && toolCall.amount !== undefined
      ? `amount=${toolCall.amount}`
      : null,
    toolCall.riskLevel ? `risk=${toolCall.riskLevel}` : null,
    toolCall.refundCount30d !== null && toolCall.refundCount30d !== undefined
      ? `refundCount30d=${toolCall.refundCount30d}`
      : null,
    toolCall.refundAmount30d !== null && toolCall.refundAmount30d !== undefined
      ? `refundAmount30d=${toolCall.refundAmount30d}`
      : null,
    toolCall.sameAddressRefundCount30d !== null &&
    toolCall.sameAddressRefundCount30d !== undefined
      ? `sameAddressRefundCount30d=${toolCall.sameAddressRefundCount30d}`
      : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : "No key parameters";
}

export function AuditTimeline({ events, onSourceLineClick }: AuditTimelineProps) {
  const [filter, setFilter] = useState<AuditFilter>("All");
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filter === "Allowed") {
        return event.decision === "ALLOW";
      }

      if (filter === "Approval") {
        return event.decision === "APPROVAL";
      }

      if (filter === "Denied") {
        return event.decision === "DENY";
      }

      if (filter === "Abuse Guard") {
        return isAbuseEvent(event);
      }

      return true;
    });
  }, [events, filter]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">
          Audit Timeline
        </h2>
        <div className="flex flex-wrap gap-3">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={[
                "rounded-xl px-3 py-2 text-xs uppercase tracking-wide transition hover:-translate-y-px active:scale-[0.98]",
                filter === item
                  ? "bg-indigo-600 text-slate-50 shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:text-indigo-600",
              ].join(" ")}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {filteredEvents.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
          No audit events for this filter.
        </p>
      ) : (
        <ol className="mt-6 space-y-6">
          {filteredEvents.map((event) => (
            <li key={event.id} className="rounded-2xl bg-slate-50 p-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span
                    className={[
                      "rounded-lg px-3 py-2 text-xs font-semibold",
                      decisionBadgeStyles[event.decision],
                    ].join(" ")}
                  >
                    {event.decision}
                  </span>
                  <span className="font-mono text-xs text-slate-600">
                    {event.toolCall.action}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-600">
                    executed={String(event.executed ?? false)}
                  </span>
                  {event.approvalStatus ? (
                    <span className="rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-600">
                      approval={event.approvalStatus}
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {event.toolCall.rawUserRequest ??
                    event.toolCall.userRequest ??
                    "No raw request"}
                </p>
                <p className="mt-3 font-mono text-xs text-slate-600">
                  {keyParameters(event)}
                </p>
                <p className="mt-3 text-sm text-slate-600">{event.reason}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs">
                  <span className="font-mono text-slate-600">
                    {event.matchedRuleId ?? "default-deny"}
                  </span>
                  {event.sourceSopLines.map((line) => (
                    <button
                      key={line}
                      type="button"
                      onClick={() => onSourceLineClick(line)}
                      className="rounded-lg bg-white px-3 py-2 font-mono text-xs text-indigo-600 transition hover:-translate-y-px hover:text-slate-900 active:scale-[0.98]"
                    >
                      SOP {line}
                    </button>
                  ))}
                  {event.toolCall.riskSignals.length > 0 ? (
                    <span className="text-slate-600">
                      {event.toolCall.riskSignals.join(", ")}
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
