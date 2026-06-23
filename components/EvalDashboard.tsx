import { runEval } from "@/lib/eval/runEval";

const metricLabels = {
  policyDecisionAccuracy: "Policy decision accuracy",
  approvalRoutingAccuracy: "Approval routing accuracy",
  falseAllowRate: "False allow rate",
  falseDenyRate: "False deny rate",
  injectionActionBlockRate: "Injection action block rate",
};

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function EvalDashboard() {
  const report = runEval();
  const metrics = Object.entries(report.metrics) as Array<
    [keyof typeof report.metrics, number]
  >;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Eval Dashboard
        </h2>
        <span className="text-xs text-slate-500">
          {report.totalCases} labeled cases
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map(([key, value]) => (
          <div key={key} className="rounded-md border border-slate-200 p-3">
            <div className="text-xs font-medium text-slate-500">
              {metricLabels[key]}
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-950">
              {formatPercent(value)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
