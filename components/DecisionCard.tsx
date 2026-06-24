import type { DecisionResult } from "@/lib/schemas/policy";
import type { ToolCall } from "@/lib/schemas/toolCall";

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

type DecisionCardProps = {
  decision: DecisionResult;
  toolCall: ToolCall | null;
  executed: boolean;
  approvalStatus: ApprovalStatus;
  onSourceLineClick: (line: number) => void;
};

const decisionStyles = {
  ALLOW: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  APPROVAL: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  DENY: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
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

function abuseGuardResult(toolCall: ToolCall | null): string {
  if (!toolCall || toolCall.action !== "refund_order") {
    return "Not applicable";
  }

  if ((toolCall.refundCount30d ?? 0) >= 5) {
    return "Repeated refund abuse";
  }

  if ((toolCall.refundAmount30d ?? 0) > 200) {
    return "30 day refund amount exceeded";
  }

  if ((toolCall.sameAddressRefundCount30d ?? 0) >= 10) {
    return "Shared address refund cluster";
  }

  if ((toolCall.amount ?? 0) <= 50 && toolCall.riskLevel === "LOW") {
    return "Low risk refund";
  }

  if ((toolCall.amount ?? 0) <= 50 && toolCall.riskLevel) {
    return "Suspicious small refund";
  }

  if ((toolCall.amount ?? 0) > 200) {
    return "High value refund";
  }

  return "Amount requires review";
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return String(value);
}

function sopLineSummary(lines: number[]): string {
  if (lines.length === 0) {
    return "Default fail safe DENY";
  }

  return `This decision is backed by SOP line ${lines.join(", ")}.`;
}

export function DecisionCard({
  decision,
  toolCall,
  executed,
  approvalStatus,
  onSourceLineClick,
}: DecisionCardProps) {
  const sourceLines = decision.sourceSopLines;
  const riskLevel = toolCall?.riskLevel ?? "Not provided";
  const compactRows = [
    ["Matched rule", decision.matchedRuleId ?? "default-deny"],
    ["Reason", decision.reason],
    ["Risk level", riskLevel],
    ["Risk signals", toolCall?.riskSignals?.length ? toolCall.riskSignals.join(", ") : "None"],
    ["Amount", displayValue(toolCall?.amount)],
    ["Refund count 30d", displayValue(toolCall?.refundCount30d)],
    ["Executed", String(executed)],
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-100">
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">
            Decision and Approval
          </h2>
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Deterministic result
          </span>
        </div>
        <span
          className={[
            "inline-flex rounded-xl px-5 py-4 text-5xl font-semibold leading-none tracking-tight",
            decisionStyles[decision.decision],
          ].join(" ")}
        >
          {decision.decision}
        </span>
      </div>
      <div className="mt-6 rounded-2xl bg-slate-50 p-6">
        <div className="text-xl font-semibold text-slate-900">
          {executionLabel(decision, executed, approvalStatus)}
        </div>
        <div className="mt-2 text-sm text-slate-600">
          {abuseGuardResult(toolCall)}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
        <div className="text-xl font-semibold text-slate-900">Audit proof</div>
        <div className="mt-2">{sopLineSummary(sourceLines)}</div>
        {sourceLines.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {sourceLines.map((line) => (
              <button
                key={line}
                type="button"
                onClick={() => onSourceLineClick(line)}
                className="rounded-lg bg-white px-3 py-2 font-mono text-xs text-indigo-600 transition hover:-translate-y-px hover:text-slate-900 active:scale-[0.98]"
              >
                Line {line}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-3 text-sm">
        {compactRows.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-1 gap-2 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[9rem_1fr]"
          >
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              {label}
            </dt>
            <dd className="text-sm text-slate-600 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid grid-cols-1 gap-6">
        <div className="rounded-2xl bg-slate-50 p-6">
          <div className="text-xs uppercase tracking-wide text-slate-400">
            Raw user request
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {toolCall?.rawUserRequest ?? toolCall?.userRequest ?? "Not provided"}
          </p>
        </div>
        <details className="rounded-2xl bg-slate-50 p-6">
          <summary className="cursor-pointer text-xs uppercase tracking-wide text-slate-400">
            Candidate ToolCall JSON
          </summary>
          <pre className="mt-4 max-h-40 overflow-auto rounded-2xl bg-white p-4 font-mono text-xs leading-5 text-slate-600">
            {toolCall ? JSON.stringify(toolCall, null, 2) : "No tool call yet."}
          </pre>
        </details>
      </div>
    </div>
  );
}
