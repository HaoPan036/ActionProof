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

const decisionStyles = {
  ALLOW: "border-emerald-300 bg-emerald-50 text-emerald-900",
  APPROVAL: "border-amber-300 bg-amber-50 text-amber-950",
  DENY: "border-rose-300 bg-rose-50 text-rose-950",
} satisfies Record<DecisionResult["decision"], string>;

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

function getSopLineText(sopText: string, line: number): string {
  const rawLine = sopText.split("\n")[line - 1]?.trim();

  return rawLine ? rawLine.replace(/^\d+\.\s*/, "") : "Source line not found.";
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
    [formatPercent(report.metrics.policyDecisionAccuracy), "Policy decision accuracy"],
    [formatPercent(report.metrics.falseAllowRate), "False allow rate"],
    [formatPercent(report.metrics.abuseGuardAccuracy), "Abuse guard accuracy"],
  ];

  return (
    <section className="mb-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Live Permission Demo
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Choose a scenario and see whether the agent action is allowed,
              routed to approval, or denied before execution.
            </p>
          </div>
          <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-950">
            Final decision: deterministic TypeScript
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[0.8fr_1.25fr] xl:grid-cols-[0.72fr_1.28fr_0.9fr]">
        <div className="rounded-md border border-slate-200 p-3">
          <h3 className="text-xs font-black uppercase text-slate-500">
            Scenario selector
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {scenarioPresets.map((preset) => {
              const isSelected = preset.id === selectedPresetId;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onRunPreset(preset)}
                  className={[
                    "rounded-md border px-3 py-3 text-left text-sm font-black transition",
                    isSelected
                      ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-800 hover:border-cyan-300 hover:bg-cyan-50",
                  ].join(" ")}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={[
            "rounded-md border p-4 shadow-sm",
            decisionStyles[decision.decision],
          ].join(" ")}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase">Decision</div>
              <div className="mt-2 text-6xl font-black leading-none">
                {decision.decision}
              </div>
              <div className="mt-3 text-xl font-black">{execution}</div>
              <div className="mt-2 text-sm font-semibold">
                Scenario: {scenarioLabel}
              </div>
            </div>
            <div className="rounded-md border border-current/20 bg-white/60 px-3 py-2 text-sm font-black">
              executed={String(executed)}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-md border border-current/15 bg-white/50 p-3">
              <div className="text-xs font-semibold uppercase opacity-70">
                Action
              </div>
              <div className="mt-1 font-mono font-black">
                {toolCall?.action ?? "unknown"}
              </div>
            </div>
            <div className="rounded-md border border-current/15 bg-white/50 p-3">
              <div className="text-xs font-semibold uppercase opacity-70">
                Amount
              </div>
              <div className="mt-1 font-black">
                {displayValue(toolCall?.amount)}
              </div>
            </div>
            <div className="rounded-md border border-current/15 bg-white/50 p-3">
              <div className="text-xs font-semibold uppercase opacity-70">
                Matched rule
              </div>
              <div className="mt-1 break-all font-mono text-xs font-black">
                {decision.matchedRuleId ?? "default-deny"}
              </div>
            </div>
            <div className="rounded-md border border-current/15 bg-white/50 p-3">
              <div className="text-xs font-semibold uppercase opacity-70">
                Risk level
              </div>
              <div className="mt-1 font-black">
                {displayValue(toolCall?.riskLevel)}
              </div>
            </div>
          </div>
          <div className="mt-3 rounded-md border border-current/15 bg-white/50 p-3 text-sm">
            <div className="text-xs font-semibold uppercase opacity-70">
              Short reason
            </div>
            <div className="mt-1 font-semibold">{decision.reason}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-md border border-cyan-200 bg-cyan-50 p-4 text-cyan-950">
            <h3 className="text-xs font-black uppercase">SOP proof</h3>
            <div className="mt-2 text-sm font-semibold">Audit proof:</div>
            {primarySourceLine ? (
              <>
                <p className="mt-1 text-sm leading-6">
                  This decision is backed by SOP line {primarySourceLine}.
                </p>
                <button
                  type="button"
                  onClick={() => onSourceLineClick(primarySourceLine)}
                  className="mt-3 rounded-md border border-cyan-300 bg-white p-3 text-left text-sm font-semibold text-cyan-950 hover:bg-cyan-100"
                >
                  <span className="font-mono text-xs font-black">
                    Line {primarySourceLine}
                  </span>
                  <span className="mt-1 block leading-6">{proofText}</span>
                </button>
              </>
            ) : (
              <p className="mt-2 rounded-md border border-cyan-200 bg-white p-3 text-sm font-black">
                Default fail safe DENY
              </p>
            )}
          </div>

          <div className="rounded-md border border-slate-200 p-4">
            <h3 className="text-xs font-black uppercase text-slate-500">
              Eval proof
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {metrics.map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-md border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="text-2xl font-black text-slate-950">
                    {value}
                  </div>
                  <div className="mt-1 text-xs font-semibold leading-4 text-slate-600">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
