import { runEval } from "@/lib/eval/runEval";

const engineMetricLabels = {
  policyDecisionAccuracy: "Policy decision accuracy",
  approvalRoutingAccuracy: "Approval routing accuracy",
  falseAllowRate: "False allow rate",
  falseDenyRate: "False deny rate",
};

const safetyMetricLabels = {
  injectionActionBlockRate: "Injection action block rate",
  abuseGuardAccuracy: "Abuse guard accuracy",
  repeatedRefundBlockRate: "Repeated refund block rate",
  forbiddenActionBlockRate: "Forbidden action block rate",
};

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function MetricRows({
  metrics,
  labels,
}: {
  metrics: Record<string, number>;
  labels: Record<string, string>;
}) {
  return (
    <div className="space-y-2">
      {Object.entries(labels).map(([key, label]) => (
        <div
          key={key}
          className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3"
        >
          <div className="min-w-0 text-sm leading-5 text-slate-600">
            {label}
          </div>
          <div className="whitespace-nowrap text-right text-lg font-semibold leading-none text-slate-900 tabular-nums">
            {formatPercent(metrics[key] ?? 0)}
          </div>
        </div>
      ))}
    </div>
  );
}

function LlmMetricRows() {
  const rows = [
    "Action extraction accuracy",
    "Amount extraction accuracy",
    "Risk extraction accuracy",
  ];

  return (
    <div className="mt-3 space-y-2">
      {rows.map((label) => (
        <div
          key={label}
          className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3"
        >
          <div className="min-w-0 text-sm leading-5 text-slate-600">
            {label}
          </div>
          <div className="whitespace-nowrap text-right text-sm leading-none text-slate-400 tabular-nums">
            Not run
          </div>
        </div>
      ))}
    </div>
  );
}

export function EvalDashboard() {
  const report = runEval();
  const headlineMetrics = [
    {
      value: String(report.totalCases),
      label: "Deterministic cases",
    },
    {
      value: formatPercent(report.metrics.policyDecisionAccuracy),
      label: "Policy decision accuracy",
    },
    {
      value: formatPercent(report.metrics.abuseGuardAccuracy),
      label: "Abuse guard accuracy",
    },
    {
      value: formatPercent(report.metrics.injectionActionBlockRate),
      label: "Injection action block rate",
    },
    {
      value: formatPercent(report.metrics.falseAllowRate),
      label: "False allow rate",
    },
    {
      value: formatPercent(report.metrics.falseDenyRate),
      label: "False deny rate",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">
          Evaluation Dashboard
        </h2>
        <span className="text-xs uppercase tracking-wide text-slate-400">
          {report.totalCases} deterministic cases
        </span>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {headlineMetrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl bg-slate-50 p-6">
            <div className="whitespace-nowrap text-3xl font-semibold leading-none text-slate-900 tabular-nums">
              {metric.value}
            </div>
            <div className="mt-3 text-sm leading-5 text-slate-600">
              {metric.label}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-6">
          <h3 className="text-xl font-semibold text-slate-900">
            LLM Extraction Layer
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            LLM extraction is demonstrated live through the request simulator.
            Deterministic enforcement is evaluated below.
          </p>
          <LlmMetricRows />
        </div>
        <div className="rounded-2xl bg-slate-50 p-6">
          <h3 className="mb-4 text-xl font-semibold text-slate-900">
            Deterministic Engine Layer
          </h3>
          <MetricRows metrics={report.metrics} labels={engineMetricLabels} />
        </div>
        <div className="rounded-2xl bg-slate-50 p-6">
          <h3 className="mb-4 text-xl font-semibold text-slate-900">
            Safety and Abuse Guard Layer
          </h3>
          <MetricRows metrics={report.metrics} labels={safetyMetricLabels} />
        </div>
      </div>
    </div>
  );
}
