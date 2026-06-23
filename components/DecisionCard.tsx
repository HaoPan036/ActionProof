import type { DecisionResult } from "@/lib/schemas/policy";

type DecisionCardProps = {
  decision: DecisionResult;
};

const decisionStyles = {
  ALLOW: "border-emerald-200 bg-emerald-50 text-emerald-900",
  APPROVAL: "border-amber-200 bg-amber-50 text-amber-950",
  DENY: "border-rose-200 bg-rose-50 text-rose-950",
} satisfies Record<DecisionResult["decision"], string>;

export function DecisionCard({ decision }: DecisionCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Decision Result
        </h2>
        <span
          className={[
            "rounded-md border px-3 py-1 text-sm font-bold",
            decisionStyles[decision.decision],
          ].join(" ")}
        >
          {decision.decision}
        </span>
      </div>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="font-medium text-slate-500">Matched rule</dt>
          <dd className="mt-1 font-mono text-slate-900">
            {decision.matchedRuleId ?? "default-deny"}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Reason</dt>
          <dd className="mt-1 text-slate-900">{decision.reason}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Source SOP lines</dt>
          <dd className="mt-1 font-mono text-slate-900">
            {decision.sourceSopLines.length > 0
              ? decision.sourceSopLines.join(", ")
              : "none"}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Prompt injection signal</dt>
          <dd className="mt-1 text-slate-900">
            {decision.containsPromptInjection ? "recorded" : "not recorded"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
