import type { Policy } from "@/lib/schemas/policy";

type PolicyViewerProps = {
  policy: Policy;
};

const policySummary = [
  ["Low value + low risk refund", "ALLOW"],
  ["Suspicious small refund", "APPROVAL"],
  ["Repeated refund abuse", "DENY"],
  ["High value refund", "DENY"],
  ["Customer data export", "DENY"],
];

const decisionStyles = {
  ALLOW: "bg-emerald-50 text-emerald-700",
  APPROVAL: "bg-amber-50 text-amber-700",
  DENY: "bg-rose-50 text-rose-700",
} as const;

export function PolicyViewer({ policy }: PolicyViewerProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">
          Policy Summary
        </h2>
        <span className="font-mono text-xs text-slate-400">
          defaultDecision: {policy.defaultDecision}
        </span>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-3">
        {policySummary.map(([label, decision]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4"
          >
            <span className="text-sm text-slate-600">{label}</span>
            <span
              className={[
                "rounded-lg px-3 py-2 text-xs font-semibold",
                decisionStyles[decision as keyof typeof decisionStyles],
              ].join(" ")}
            >
              {decision}
            </span>
          </div>
        ))}
      </div>
      <details className="mt-6 rounded-2xl bg-slate-50 p-6">
        <summary className="cursor-pointer text-xs uppercase tracking-wide text-slate-400">
          Raw Policy JSON
        </summary>
        <pre className="mt-4 max-h-64 overflow-auto rounded-2xl bg-white p-4 font-mono text-xs leading-5 text-slate-600">
          {JSON.stringify(policy, null, 2)}
        </pre>
      </details>
    </div>
  );
}
