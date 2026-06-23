import type { AuditEvent } from "@/lib/schemas/audit";

type AuditTimelineProps = {
  events: AuditEvent[];
};

const dotStyles = {
  ALLOW: "bg-emerald-500",
  APPROVAL: "bg-amber-500",
  DENY: "bg-rose-500",
} satisfies Record<AuditEvent["decision"], string>;

export function AuditTimeline({ events }: AuditTimelineProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
        Audit Timeline
      </h2>
      {events.length === 0 ? (
        <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
          No audit events yet.
        </p>
      ) : (
        <ol className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="flex gap-3">
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
                </div>
                <p className="mt-1 text-sm text-slate-600">{event.reason}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {event.matchedRuleId ?? "default-deny"}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
