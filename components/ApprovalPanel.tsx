import type { ToolCall } from "@/lib/schemas/toolCall";

type ApprovalPanelProps = {
  visible: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  toolCall: ToolCall | null;
  onApprove: () => void;
  onReject: () => void;
};

function approvalReason(toolCall: ToolCall | null): string {
  const amount = toolCall?.amount;
  const riskLevel = toolCall?.riskLevel;

  if (
    typeof amount === "number" &&
    amount <= 50 &&
    (riskLevel === "MEDIUM" || riskLevel === "HIGH")
  ) {
    return "Small refund, but risk signals require human approval.";
  }

  if (typeof amount === "number" && amount > 50 && amount <= 200) {
    return "Amount requires human approval before execution.";
  }

  return "Human approval required before execution.";
}

export function ApprovalPanel({
  visible,
  approvalStatus,
  toolCall,
  onApprove,
  onReject,
}: ApprovalPanelProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Approval Panel
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            {approvalReason(toolCall)}
          </p>
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
            Current status: {approvalStatus ?? "PENDING"}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onApprove}
            disabled={approvalStatus === "APPROVED"}
            className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-slate-50 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={approvalStatus === "REJECTED"}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
