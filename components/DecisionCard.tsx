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
  ALLOW: "border-emerald-200 bg-emerald-50 text-emerald-900 ring-emerald-100",
  APPROVAL: "border-amber-200 bg-amber-50 text-amber-950 ring-amber-100",
  DENY: "border-rose-200 bg-rose-50 text-rose-950 ring-rose-100",
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
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase text-slate-600">
            Decision and Approval
          </h2>
          <span className="text-xs font-medium text-slate-500">
            Deterministic result
          </span>
        </div>
        <span
          className={[
            "inline-flex rounded-md border px-5 py-3 text-3xl font-black ring-4",
            decisionStyles[decision.decision],
          ].join(" ")}
        >
          {decision.decision}
        </span>
      </div>
      <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="text-lg font-bold text-slate-950">
          {executionLabel(decision, executed, approvalStatus)}
        </div>
        <div className="mt-1 text-sm text-slate-600">
          {abuseGuardResult(toolCall)}
        </div>
      </div>

      <div className="mb-4 rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-950">
        <div className="font-black">Audit proof</div>
        <div className="mt-1">{sopLineSummary(sourceLines)}</div>
        {sourceLines.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {sourceLines.map((line) => (
              <button
                key={line}
                type="button"
                onClick={() => onSourceLineClick(line)}
                className="rounded-md border border-cyan-300 bg-white px-2 py-1 font-mono text-xs font-black text-cyan-950 hover:bg-cyan-100"
              >
                Line {line}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <dl className="grid grid-cols-1 gap-2 text-sm">
        {compactRows.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-1 gap-1 rounded-md border border-slate-100 px-3 py-2 sm:grid-cols-[9rem_1fr]"
          >
            <dt className="font-medium text-slate-500">{label}</dt>
            <dd className="text-slate-900">{value}</dd>
          </div>
        ))}
        <div>
          <dt className="px-3 pt-2 font-medium text-slate-500">
            Source SOP lines
          </dt>
          <dd className="mt-1 flex flex-wrap gap-2 px-3 pb-2">
            {sourceLines.length > 0 ? (
              sourceLines.map((line) => (
                <button
                  key={line}
                  type="button"
                  onClick={() => onSourceLineClick(line)}
                  className="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 font-mono text-xs font-semibold text-cyan-900 hover:bg-cyan-100"
                >
                  Line {line}
                </button>
              ))
            ) : (
              <span className="text-slate-700">Default fail safe DENY</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <div className="rounded-md border border-slate-100 p-3">
          <div className="mb-1 text-xs font-medium text-slate-500">
            Raw user request
          </div>
          <p className="text-sm leading-6 text-slate-700">
            {toolCall?.rawUserRequest ?? toolCall?.userRequest ?? "Not provided"}
          </p>
        </div>
        <div>
          <div className="mb-1 text-xs font-medium text-slate-500">
            Candidate ToolCall JSON
          </div>
          <pre className="max-h-36 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">
            {toolCall ? JSON.stringify(toolCall, null, 2) : "No tool call yet."}
          </pre>
        </div>
      </div>
    </section>
  );
}
