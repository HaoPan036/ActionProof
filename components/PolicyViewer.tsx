import type { Policy } from "@/lib/schemas/policy";

type PolicyViewerProps = {
  policy: Policy;
};

export function PolicyViewer({ policy }: PolicyViewerProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Policy JSON
        </h2>
        <span className="text-xs text-slate-500">
          defaultDecision: {policy.defaultDecision}
        </span>
      </div>
      <pre className="max-h-[34rem] overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
        {JSON.stringify(policy, null, 2)}
      </pre>
    </section>
  );
}
