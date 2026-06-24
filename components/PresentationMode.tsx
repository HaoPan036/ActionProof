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
  ALLOW: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  APPROVAL: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  DENY: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
} satisfies Record<DecisionResult["decision"], string>;

const decisionSoftStyles = {
  ALLOW: "ring-1 ring-emerald-200 bg-emerald-50",
  APPROVAL: "ring-1 ring-amber-200 bg-amber-50",
  DENY: "ring-1 ring-rose-200 bg-rose-50",
} satisfies Record<DecisionResult["decision"], string>;

const decisionTextStyles = {
  ALLOW: "text-emerald-600",
  APPROVAL: "text-amber-600",
  DENY: "text-rose-600",
} satisfies Record<DecisionResult["decision"], string>;

const matrixStyles = {
  ALLOW: "bg-emerald-50 text-emerald-700",
  APPROVAL: "bg-amber-50 text-amber-700",
  DENY: "bg-rose-50 text-rose-700",
} satisfies Record<DecisionResult["decision"], string>;

const decisionTitle = {
  ALLOW: "Allow",
  APPROVAL: "Approval",
  DENY: "Deny",
} satisfies Record<DecisionResult["decision"], string>;

const spotlightDecisionTitle = {
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

  return "Blocked before execution";
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
        "inline-flex min-w-24 justify-center rounded-lg px-3 py-1 text-xs font-semibold",
        matrixStyles[decision],
      ].join(" ")}
    >
      {decisionTitle[decision]}
    </span>
  );
}

function FlowStep({
  index,
  title,
  subtitle,
  activeDecision,
}: {
  index: string;
  title: string;
  subtitle: string;
  activeDecision?: DecisionResult["decision"];
}) {
  return (
    <div
      className={[
        "min-w-[10rem] flex-1 rounded-2xl p-4 text-center",
        activeDecision ? decisionSoftStyles[activeDecision] : "bg-slate-50",
      ].join(" ")}
    >
      <div className="font-mono text-xs text-slate-400">{index}</div>
      <div
        className={[
          "mt-2 text-sm font-semibold",
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
  const scenarioPresets = presentationScenarioIds
    .map((id) => presets.find((preset) => preset.id === id))
    .filter((preset): preset is ToolPreset => Boolean(preset));
  const execution = executionLabel(decision, executed, approvalStatus);
  const primarySourceLine = decision.sourceSopLines[0];
  const proofText = primarySourceLine
    ? getSopLineText(sopText, primarySourceLine)
    : "Default fail safe DENY";
  const sourceLineLabel = primarySourceLine
    ? `Line ${primarySourceLine}`
    : "Default fail safe DENY";

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Presentation Mode
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            Live Permission Demo
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Pick a scenario, then follow request to AI extraction to
            deterministic enforcement to audit proof.
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
                "rounded-xl px-4 py-3 text-left text-sm font-semibold transition hover:-translate-y-px active:scale-[0.98]",
                isSelected
                  ? "bg-indigo-600 text-slate-50 shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:text-indigo-600",
              ].join(" ")}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="flex min-w-[56rem] items-stretch gap-3">
          <FlowStep
            index="01"
            title="User request"
            subtitle={flowRequestLabel(toolCall, scenarioLabel)}
          />
          <div className="flex items-center text-slate-300">→</div>
          <FlowStep index="02" title="AI extracts" subtitle="candidate action" />
          <div className="flex items-center text-slate-300">→</div>
          <FlowStep index="03" title="PolicyGate" subtitle="deterministic" />
          <div className="flex items-center text-slate-300">→</div>
          <FlowStep
            index="04"
            title="Decision"
            subtitle={spotlightDecisionTitle[decision.decision]}
            activeDecision={decision.decision}
          />
          <div className="flex items-center text-slate-300">→</div>
          <FlowStep index="05" title="Audit proof" subtitle="SOP linked" />
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-6">
        <p className="text-sm font-semibold text-slate-600">
          Scenario · {scenarioLabel}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <span
            className={[
              "inline-flex rounded-xl px-5 py-4 text-5xl font-semibold leading-none tracking-tight",
              decisionBadgeStyles[decision.decision],
            ].join(" ")}
          >
            {spotlightDecisionTitle[decision.decision]}
          </span>
          <span className="text-xl font-semibold text-slate-900">
            {execution}
          </span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs text-slate-400">Matched rule</div>
            <div className="mt-2 break-all font-mono text-xs text-slate-900">
              {decision.matchedRuleId ?? "default-deny"}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Source SOP line</div>
            {primarySourceLine ? (
              <button
                type="button"
                onClick={() => onSourceLineClick(primarySourceLine)}
                className="mt-2 text-left text-sm font-semibold text-indigo-600 transition hover:-translate-y-px hover:text-slate-900 active:scale-[0.98]"
              >
                {sourceLineLabel}
              </button>
            ) : (
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {sourceLineLabel}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-slate-400">Reason</div>
            <div className="mt-2 text-sm leading-6 text-slate-600">
              {decision.reason}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Executed</div>
            <div className="mt-2 font-mono text-xs text-slate-900">
              {String(executed)}
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-slate-400">{proofText}</div>
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
