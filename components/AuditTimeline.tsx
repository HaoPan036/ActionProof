import { useMemo, useState } from "react";
import type { AuditEvent } from "@/lib/schemas/audit";

type AuditTimelineProps = {
  events: AuditEvent[];
  onSourceLineClick: (line: number) => void;
};

type AuditFilter = "All" | "Allowed" | "Approval" | "Denied" | "Abuse Guard";

const dotStyles = {
  ALLOW: "bg-emerald-500",
  APPROVAL: "bg-amber-500",
  DENY: "bg-rose-500",
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
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold uppercase text-slate-600">
          Audit Timeline
        </h2>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={[
                "rounded-md border px-2 py-1 text-xs font-semibold",
                filter === item
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {filteredEvents.length === 0 ? (
        <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
          No audit events for this filter.
        </p>
      ) : (
        <ol className="space-y-3">
          {filteredEvents.map((event) => (
            <li key={event.id} className="flex gap-3 rounded-md border border-slate-100 p-3">
              <span
                className={[
                  "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                  dotStyles[event.decision],
                ].join(" ")}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="font-semibold text-slate-900">
                    {event.decision}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    {event.toolCall.action}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    executed={String(event.executed ?? false)}
                  </span>
                  {event.approvalStatus ? (
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                      approval={event.approvalStatus}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-slate-700">
                  {event.toolCall.rawUserRequest ??
                    event.toolCall.userRequest ??
                    "No raw request"}
                </p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {keyParameters(event)}
                </p>
                <p className="mt-1 text-sm text-slate-600">{event.reason}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="font-mono text-slate-500">
                    {event.matchedRuleId ?? "default-deny"}
                  </span>
                  {event.sourceSopLines.map((line) => (
                    <button
                      key={line}
                      type="button"
                      onClick={() => onSourceLineClick(line)}
                      className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-0.5 font-mono font-semibold text-cyan-900"
                    >
                      SOP {line}
                    </button>
                  ))}
                  {event.toolCall.riskSignals.length > 0 ? (
                    <span className="text-slate-500">
                      {event.toolCall.riskSignals.join(", ")}
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
