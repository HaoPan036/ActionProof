import type { Policy } from "@/lib/schemas/policy";

type PolicyViewerProps = {
  policy: Policy;
};

const policySummary = [
  ["Low value + low risk refund", "ALLOW", "text-emerald-800 bg-emerald-50 border-emerald-200"],
  ["Suspicious small refund", "APPROVAL", "text-amber-900 bg-amber-50 border-amber-200"],
  ["Repeated refund abuse", "DENY", "text-rose-900 bg-rose-50 border-rose-200"],
  ["High value refund", "DENY", "text-rose-900 bg-rose-50 border-rose-200"],
  ["Customer data export", "DENY", "text-rose-900 bg-rose-50 border-rose-200"],
];

export function PolicyViewer({ policy }: PolicyViewerProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase text-slate-600">
          Policy Summary
        </h2>
        <span className="text-xs text-slate-500">
          defaultDecision: {policy.defaultDecision}
        </span>
      </div>
      <div className="mb-3 grid grid-cols-1 gap-2">
        {policySummary.map(([label, decision, styles]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <span
              className={[
                "rounded-md border px-2 py-1 text-xs font-black",
                styles,
              ].join(" ")}
            >
              {decision}
            </span>
          </div>
        ))}
      </div>
      <div className="mb-1 text-xs font-medium text-slate-500">
        Raw Policy JSON
      </div>
      <pre className="max-h-64 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
        {JSON.stringify(policy, null, 2)}
      </pre>
    </section>
  );
}
