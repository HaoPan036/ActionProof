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
  ALLOW: "border-emerald-200 bg-emerald-50 text-emerald-900",
  APPROVAL: "border-amber-200 bg-amber-50 text-amber-950",
  DENY: "border-rose-200 bg-rose-50 text-rose-950",
} satisfies Record<DecisionResult["decision"], string>;

const riskStyles = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-800",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-900",
  HIGH: "border-rose-200 bg-rose-50 text-rose-900",
};

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

export function DecisionCard({
  decision,
  toolCall,
  executed,
  approvalStatus,
  onSourceLineClick,
}: DecisionCardProps) {
  const sourceLines = decision.sourceSopLines;
  const riskLevel = toolCall?.riskLevel ?? "Not provided";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase text-slate-600">
          Decision and Approval
        </h2>
        <span
          className={[
            "rounded-md border px-3 py-1 text-sm font-bold",
            decisionStyles[decision.decision],
          ].join(" ")}
        >
          {decision.decision}
        </span>
      </div>
      <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="text-sm font-semibold text-slate-950">
          {executionLabel(decision, executed, approvalStatus)}
        </div>
        <div className="mt-1 text-sm text-slate-600">{decision.reason}</div>
      </div>

      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-500">Matched rule</dt>
          <dd className="mt-1 font-mono text-slate-900">
            {decision.matchedRuleId ?? "default-deny"}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Source SOP lines</dt>
          <dd className="mt-1 flex flex-wrap gap-2">
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
        <div>
          <dt className="font-medium text-slate-500">Risk level</dt>
          <dd className="mt-1">
            <span
              className={[
                "rounded-md border px-2 py-1 text-xs font-semibold",
                toolCall?.riskLevel
                  ? riskStyles[toolCall.riskLevel]
                  : "border-slate-200 bg-slate-50 text-slate-600",
              ].join(" ")}
            >
              {riskLevel}
            </span>
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Abuse guard result</dt>
          <dd className="mt-1 text-slate-900">{abuseGuardResult(toolCall)}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Refund count 30d</dt>
          <dd className="mt-1 text-slate-900">
            {toolCall?.refundCount30d ?? "Not provided"}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Refund amount 30d</dt>
          <dd className="mt-1 text-slate-900">
            {toolCall?.refundAmount30d ?? "Not provided"}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Same address refunds 30d</dt>
          <dd className="mt-1 text-slate-900">
            {toolCall?.sameAddressRefundCount30d ?? "Not provided"}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Evidence provided</dt>
          <dd className="mt-1 text-slate-900">
            {toolCall?.evidenceProvided === null ||
            toolCall?.evidenceProvided === undefined
              ? "Not provided"
              : String(toolCall.evidenceProvided)}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Delivery issue</dt>
          <dd className="mt-1 text-slate-900">
            {toolCall?.hasDeliveryIssue === null ||
            toolCall?.hasDeliveryIssue === undefined
              ? "Not provided"
              : String(toolCall.hasDeliveryIssue)}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Risk signals</dt>
          <dd className="mt-1 text-slate-900">
            {toolCall?.riskSignals?.length
              ? toolCall.riskSignals.join(", ")
              : "None"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 space-y-3">
        <div>
          <div className="mb-1 text-xs font-medium text-slate-500">
            Raw user request
          </div>
          <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            {toolCall?.rawUserRequest ?? toolCall?.userRequest ?? "Not provided"}
          </p>
        </div>
        <div>
          <div className="mb-1 text-xs font-medium text-slate-500">
            Candidate ToolCall JSON
          </div>
          <pre className="max-h-64 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">
            {toolCall ? JSON.stringify(toolCall, null, 2) : "No tool call yet."}
          </pre>
        </div>
      </div>
    </section>
  );
}
