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
          className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <div className="min-w-0 text-sm font-medium leading-5 text-slate-600">
            {label}
          </div>
          <div className="whitespace-nowrap text-right text-lg font-black leading-none text-slate-950 tabular-nums">
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
          className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <div className="min-w-0 text-sm font-medium leading-5 text-slate-600">
            {label}
          </div>
          <div className="whitespace-nowrap text-right text-sm font-bold leading-none text-slate-500 tabular-nums">
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
      tone: "border-cyan-200 bg-cyan-50 text-cyan-900",
    },
    {
      value: formatPercent(report.metrics.policyDecisionAccuracy),
      label: "Policy decision accuracy",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
    },
    {
      value: formatPercent(report.metrics.abuseGuardAccuracy),
      label: "Abuse guard accuracy",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
    },
    {
      value: formatPercent(report.metrics.injectionActionBlockRate),
      label: "Injection action block rate",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
    },
    {
      value: formatPercent(report.metrics.falseAllowRate),
      label: "False allow rate",
      tone: "border-slate-200 bg-slate-50 text-slate-900",
    },
    {
      value: formatPercent(report.metrics.falseDenyRate),
      label: "False deny rate",
      tone: "border-slate-200 bg-slate-50 text-slate-900",
    },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase text-slate-600">
          Evaluation Dashboard
        </h2>
        <span className="text-xs text-slate-500">
          {report.totalCases} deterministic cases
        </span>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {headlineMetrics.map((metric) => (
          <div
            key={metric.label}
            className={[
              "rounded-lg border p-4 shadow-sm",
              metric.tone,
            ].join(" ")}
          >
            <div className="text-3xl font-black">{metric.value}</div>
            <div className="mt-2 text-sm font-semibold leading-5">
              {metric.label}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-3">
        <div className="rounded-md border border-slate-200 p-3">
          <h3 className="text-sm font-semibold text-slate-950">
            LLM Extraction Layer
          </h3>
          <p className="mt-2 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            LLM extraction is demonstrated live through the request simulator.
            Deterministic enforcement is evaluated below.
          </p>
          <LlmMetricRows />
        </div>
        <div className="rounded-md border border-slate-200 p-3">
          <h3 className="mb-3 text-sm font-semibold text-slate-950">
            Deterministic Engine Layer
          </h3>
          <MetricRows metrics={report.metrics} labels={engineMetricLabels} />
        </div>
        <div className="rounded-md border border-slate-200 p-3">
          <h3 className="mb-3 text-sm font-semibold text-slate-950">
            Safety and Abuse Guard Layer
          </h3>
          <MetricRows metrics={report.metrics} labels={safetyMetricLabels} />
        </div>
      </div>
    </section>
  );
}
