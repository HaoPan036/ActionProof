import { runEval } from "@/lib/eval/runEval";
import type { ToolPreset } from "@/lib/demo/simulatedTools";
import type { DecisionResult } from "@/lib/schemas/policy";
import type { ToolCall } from "@/lib/schemas/toolCall";

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

type PresentationModeProps = {
  presets: ToolPreset[];
  selectedPresetId: string;
  scenarioLabel: string;
  decision: DecisionResult;
  toolCall: ToolCall | null;
  executed: boolean;
  approvalStatus: ApprovalStatus;
  sopText: string;
  onRunPreset: (preset: ToolPreset) => void;
  onSourceLineClick: (line: number) => void;
};

const presentationScenarioIds = [
  "deny-attack-refund",
  "deny-high-value-refund",
  "allow-low-risk-refund",
  "approval-suspicious-small-refund",
  "deny-repeated-refund-abuse",
];

const decisionBadgeStyles = {
  ALLOW: "border-emerald-600 bg-emerald-50 text-emerald-600",
  APPROVAL: "border-amber-500 bg-amber-50 text-amber-500",
  DENY: "border-rose-600 bg-rose-50 text-rose-600",
} satisfies Record<DecisionResult["decision"], string>;

const decisionSoftStyles = {
  ALLOW: "bg-emerald-50 text-emerald-600",
  APPROVAL: "bg-amber-50 text-amber-500",
  DENY: "bg-rose-50 text-rose-600",
} satisfies Record<DecisionResult["decision"], string>;

const decisionTextStyles = {
  ALLOW: "text-emerald-600",
  APPROVAL: "text-amber-500",
  DENY: "text-rose-600",
} satisfies Record<DecisionResult["decision"], string>;

const decisionTitle = {
  ALLOW: "Allowed",
  APPROVAL: "Approval",
  DENY: "Denied",
} satisfies Record<DecisionResult["decision"], string>;

const refundMatrix = [
  {
    risk: "Low risk",
    low: "ALLOW",
    medium: "APPROVAL",
    high: "DENY",
  },
  {
    risk: "Medium / high risk",
    low: "APPROVAL",
    medium: "APPROVAL",
    high: "DENY",
  },
  {
    risk: "Repeated abuse",
    low: "DENY",
    medium: "DENY",
    high: "DENY",
  },
] satisfies Array<{
  risk: string;
  low: DecisionResult["decision"];
  medium: DecisionResult["decision"];
  high: DecisionResult["decision"];
}>;

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function executionLabel(
  decision: DecisionResult,
  executed: boolean,
  approvalStatus: ApprovalStatus,
): string {
  if (decision.decision === "ALLOW") {
    return executed ? "Allowed and executed" : "Allowed, not executed";
  }

  if (decision.decision === "APPROVAL") {
    if (approvalStatus === "APPROVED") {
      return "Approval granted and executed";
    }

    if (approvalStatus === "REJECTED") {
      return "Approval rejected, not executed";
    }

    return "Approval required, not executed";
  }

  return "Denied before execution";
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return String(value);
}

function displayAmount(value: unknown): string {
  if (typeof value === "number") {
    return `$${value}`;
  }

  return displayValue(value);
}

function getSopLineText(sopText: string, line: number): string {
  const rawLine = sopText.split("\n")[line - 1]?.trim();

  return rawLine ? rawLine.replace(/^\d+\.\s*/, "") : "Source line not found.";
}

function flowRequestLabel(toolCall: ToolCall | null, scenarioLabel: string) {
  if (toolCall?.action === "refund_order" && typeof toolCall.amount === "number") {
    return `"Refund $${toolCall.amount}"`;
  }

  return scenarioLabel;
}

function MatrixBadge({ decision }: { decision: DecisionResult["decision"] }) {
  return (
    <span
      className={[
        "inline-flex rounded-2xl border px-3 py-1 text-xs font-semibold",
        decisionBadgeStyles[decision],
      ].join(" ")}
    >
      {decisionTitle[decision]}
    </span>
  );
}

function FlowStep({
  title,
  subtitle,
  activeDecision,
}: {
  title: string;
  subtitle: string;
  activeDecision?: DecisionResult["decision"];
}) {
  return (
    <div
      className={[
        "min-w-0 flex-1 rounded-2xl p-4 text-center",
        activeDecision ? decisionSoftStyles[activeDecision] : "bg-slate-50",
      ].join(" ")}
    >
      <div
        className={[
          "text-sm font-semibold",
          activeDecision ? decisionTextStyles[activeDecision] : "text-slate-900",
        ].join(" ")}
      >
        {title}
      </div>
      <div
        className={[
          "mt-2 truncate text-xs",
          activeDecision ? decisionTextStyles[activeDecision] : "text-slate-400",
        ].join(" ")}
      >
        {subtitle}
      </div>
    </div>
  );
}

export function PresentationMode({
  presets,
  selectedPresetId,
  scenarioLabel,
  decision,
  toolCall,
  executed,
  approvalStatus,
  sopText,
  onRunPreset,
  onSourceLineClick,
}: PresentationModeProps) {
  const report = runEval();
  const scenarioPresets = presentationScenarioIds
    .map((id) => presets.find((preset) => preset.id === id))
    .filter((preset): preset is ToolPreset => Boolean(preset));
  const execution = executionLabel(decision, executed, approvalStatus);
  const primarySourceLine = decision.sourceSopLines[0];
  const proofText = primarySourceLine
    ? getSopLineText(sopText, primarySourceLine)
    : "Default fail safe DENY";
  const metrics = [
    [`${report.totalCases}`, "Deterministic cases"],
    [formatPercent(report.metrics.policyDecisionAccuracy), "Decision accuracy"],
    [formatPercent(report.metrics.falseAllowRate), "False allow rate"],
    [formatPercent(report.metrics.abuseGuardAccuracy), "Abuse guard accuracy"],
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Presentation Mode
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            Live Permission Demo
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Choose a scenario and watch the request move from AI extraction to
            deterministic enforcement and SOP-linked audit proof.
          </p>
        </div>
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Final decision: deterministic TypeScript
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {scenarioPresets.map((preset) => {
          const isSelected = preset.id === selectedPresetId;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onRunPreset(preset)}
              className={[
                "rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
                isSelected
                  ? "bg-indigo-600 text-slate-50"
                  : "bg-slate-50 text-slate-600 hover:text-indigo-600",
              ].join(" ")}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-2 md:flex-row md:items-stretch">
        <FlowStep
          title="User request"
          subtitle={flowRequestLabel(toolCall, scenarioLabel)}
        />
        <div className="hidden items-center text-slate-400 md:flex">{">"}</div>
        <FlowStep title="AI extracts" subtitle="candidate action" />
        <div className="hidden items-center text-slate-400 md:flex">{">"}</div>
        <FlowStep title="PolicyGate" subtitle="deterministic" />
        <div className="hidden items-center text-slate-400 md:flex">{">"}</div>
        <FlowStep
          title="Decision"
          subtitle={decisionTitle[decision.decision]}
          activeDecision={decision.decision}
        />
        <div className="hidden items-center text-slate-400 md:flex">{">"}</div>
        <FlowStep title="Audit proof" subtitle="SOP linked" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl bg-slate-50 p-6">
          <p className="text-xs text-slate-400">
            Scenario · {scenarioLabel}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span
              className={[
                "inline-flex rounded-2xl border-2 px-5 py-3 text-5xl font-semibold leading-none tracking-tight",
                decisionBadgeStyles[decision.decision],
              ].join(" ")}
            >
              {decisionTitle[decision.decision]}
            </span>
            <span className="text-xl font-semibold text-slate-900">
              {execution}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs text-slate-400">Action</div>
              <div className="mt-2 font-mono text-xs text-slate-900">
                {toolCall?.action ?? "unknown"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Amount</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {displayAmount(toolCall?.amount)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Matched rule</div>
              <div className="mt-2 break-all font-mono text-xs text-slate-900">
                {decision.matchedRuleId ?? "default-deny"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Executed</div>
              <div className="mt-2 font-mono text-xs text-slate-900">
                {String(executed)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Risk level</div>
              <div className="mt-2 text-sm text-slate-600">
                {displayValue(toolCall?.riskLevel)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Risk signals</div>
              <div className="mt-2 text-sm text-slate-600">
                {toolCall?.riskSignals?.length
                  ? toolCall.riskSignals.join(", ")
                  : "None"}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-xs text-slate-400">Reason</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {decision.reason}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="rounded-2xl bg-slate-50 p-6">
            <h3 className="text-xl font-semibold text-slate-900">
              Audit proof
            </h3>
            {primarySourceLine ? (
              <>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  This decision is backed by SOP line {primarySourceLine}.
                </p>
                <button
                  type="button"
                  onClick={() => onSourceLineClick(primarySourceLine)}
                  className="mt-4 w-full rounded-2xl bg-white p-4 text-left text-sm text-slate-600 transition hover:text-indigo-600"
                >
                  <span className="font-mono text-xs text-indigo-600">
                    Line {primarySourceLine}
                  </span>
                  <span className="mt-1 block leading-6">{proofText}</span>
                </button>
              </>
            ) : (
              <p className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-600">
                Default fail safe DENY
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-slate-50 p-6">
            <h3 className="text-xl font-semibold text-slate-900">
              Eval proof
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {metrics.map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-white p-4">
                  <div className="text-2xl font-semibold text-slate-900">
                    {value}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-slate-50 p-6">
        <table className="w-full min-w-[36rem] table-fixed border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-normal text-slate-400" />
              <th className="p-2 text-center text-xs font-normal text-slate-400">
                {"<= $50"}
              </th>
              <th className="p-2 text-center text-xs font-normal text-slate-400">
                $50-$200
              </th>
              <th className="p-2 text-center text-xs font-normal text-slate-400">
                &gt; $200
              </th>
            </tr>
          </thead>
          <tbody>
            {refundMatrix.map((row) => (
              <tr key={row.risk}>
                <td className="p-2 text-sm text-slate-600">{row.risk}</td>
                <td className="p-2 text-center">
                  <MatrixBadge decision={row.low} />
                </td>
                <td className="p-2 text-center">
                  <MatrixBadge decision={row.medium} />
                </td>
                <td className="p-2 text-center">
                  <MatrixBadge decision={row.high} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
