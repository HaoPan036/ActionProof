type ApprovalPanelProps = {
  visible: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  onApprove: () => void;
  onReject: () => void;
};

export function ApprovalPanel({
  visible,
  approvalStatus,
  onApprove,
  onReject,
}: ApprovalPanelProps) {
  if (!visible) {
    return null;
  }

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase text-amber-900">
            Approval Panel
          </h2>
          <p className="mt-1 text-sm text-amber-950">
            Small refund, but risk signals require human approval.
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Current status: {approvalStatus ?? "PENDING"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onApprove}
            disabled={approvalStatus === "APPROVED"}
            className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={approvalStatus === "REJECTED"}
            className="rounded-md bg-rose-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Reject
          </button>
        </div>
      </div>
    </section>
  );
}
