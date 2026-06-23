import type { DecisionResult } from "@/lib/schemas/policy";
import type { ToolCall } from "@/lib/schemas/toolCall";

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

type DemoStageProps = {
  scenarioLabel: string;
  decision: DecisionResult;
  toolCall: ToolCall | null;
  executed: boolean;
  approvalStatus: ApprovalStatus;
  onSourceLineClick: (line: number) => void;
};

const decisionStyles = {
  ALLOW: "border-emerald-300 bg-emerald-50 text-emerald-900",
  APPROVAL: "border-amber-300 bg-amber-50 text-amber-950",
  DENY: "border-rose-300 bg-rose-50 text-rose-950",
} satisfies Record<DecisionResult["decision"], string>;

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

function lineSummary(sourceSopLines: number[]): string {
  if (sourceSopLines.length === 0) {
    return "Default DENY";
  }

  return `SOP line ${sourceSopLines.join(", ")}`;
}

export function DemoStage({
  scenarioLabel,
  decision,
  toolCall,
  executed,
  approvalStatus,
  onSourceLineClick,
}: DemoStageProps) {
  const execution = executionLabel(decision, executed, approvalStatus);

  return (
    <section className="mb-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold uppercase text-slate-600">
            Demo Stage
          </h2>
          <span className="text-xs font-medium text-slate-500">
            AI extracts candidate actions and risk signals. PolicyGate enforces
            the final decision with deterministic code.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-md border border-slate-200 bg-slate-950 p-4 text-white">
          <div className="text-xs font-semibold uppercase text-cyan-300">
            Selected scenario
          </div>
          <div className="mt-2 text-2xl font-black leading-tight">
            {scenarioLabel}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <div className="text-xs uppercase text-slate-400">
                Candidate action
              </div>
              <div className="mt-1 font-mono text-sm text-white">
                {toolCall?.action ?? "unknown"}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-400">Executed</div>
              <div className="mt-1 text-sm font-bold text-white">
                {String(executed)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-400">
                Matched rule
              </div>
              <div className="mt-1 truncate font-mono text-sm text-white">
                {decision.matchedRuleId ?? "default-deny"}
              </div>
            </div>
          </div>
        </div>

        <div
          className={[
            "rounded-md border p-4 shadow-sm",
            decisionStyles[decision.decision],
          ].join(" ")}
        >
          <div className="text-xs font-semibold uppercase">Decision</div>
          <div className="mt-2 text-5xl font-black leading-none">
            {decision.decision}
          </div>
          <div className="mt-3 text-lg font-bold">{execution}</div>
          <div className="mt-4 rounded-md border border-current/20 bg-white/60 p-3 text-sm">
            <div className="font-semibold">Audit proof</div>
            <div className="mt-1">
              This decision is backed by {lineSummary(decision.sourceSopLines)}.
            </div>
            {decision.sourceSopLines.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {decision.sourceSopLines.map((line) => (
                  <button
                    key={line}
                    type="button"
                    onClick={() => onSourceLineClick(line)}
                    className="rounded-md border border-current/30 bg-white px-2 py-1 font-mono text-xs font-black"
                  >
                    Line {line}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
