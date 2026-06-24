import type { ToolPreset } from "@/lib/demo/simulatedTools";
import type { ToolCall } from "@/lib/schemas/toolCall";

type RequestSimulatorProps = {
  presets: ToolPreset[];
  selectedPresetId: string;
  onRunPreset: (preset: ToolPreset) => void;
  naturalRequest: string;
  onNaturalRequestChange: (value: string) => void;
  onExtractAction: () => void;
  extractedToolCall: ToolCall | null;
  isExtracting: boolean;
  error: string | null;
};

const presetGroups = [
  {
    title: "Safe",
    ids: ["allow-low-risk-refund"],
  },
  {
    title: "Needs Review",
    ids: ["approval-suspicious-small-refund", "approval-refund-120"],
  },
  {
    title: "Blocked",
    ids: [
      "deny-repeated-refund-abuse",
      "deny-attack-refund",
      "deny-high-value-refund",
      "deny-data-export",
      "deny-bulk-refund",
      "deny-modify-policy",
    ],
  },
];

const recordingTargetIds = new Set([
  "deny-repeated-refund-abuse",
  "deny-attack-refund",
]);

export function RequestSimulator({
  presets,
  selectedPresetId,
  onRunPreset,
  naturalRequest,
  onNaturalRequestChange,
  onExtractAction,
  extractedToolCall,
  isExtracting,
  error,
}: RequestSimulatorProps) {
  const selectedPreset =
    presets.find((preset) => preset.id === selectedPresetId) ?? presets[0];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">
          Agent Request Simulator
        </h2>
        <span className="text-xs uppercase tracking-wide text-slate-400">
          AI extracts; PolicyGate decides
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div>
          <h3 className="text-xs uppercase tracking-wide text-slate-400">
            Mode A: Preset Tool Calls
          </h3>
          <div className="mt-4 space-y-6">
            {presetGroups.map((group) => {
              const groupPresets = group.ids
                .map((id) => presets.find((preset) => preset.id === id))
                .filter((preset): preset is ToolPreset => Boolean(preset));

              return (
                <div key={group.title} className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    {group.title}
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {groupPresets.map((preset) => {
                      const isSelected = preset.id === selectedPresetId;
                      const isRecordingTarget = recordingTargetIds.has(preset.id);

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => onRunPreset(preset)}
                          className={[
                            "rounded-xl px-4 py-3 text-left text-sm font-semibold transition hover:-translate-y-px active:scale-[0.98]",
                            isSelected
                              ? "bg-indigo-600 text-slate-50 shadow-sm"
                              : "bg-white text-slate-600 hover:text-indigo-600",
                          ].join(" ")}
                        >
                          <span>{preset.label}</span>
                          {isRecordingTarget ? (
                            <span className="mt-2 block text-xs uppercase tracking-wide text-slate-400">
                              Recording target
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-wide text-slate-400">
            Mode B: Natural Language Request
          </h3>
          <textarea
            value={naturalRequest}
            onChange={(event) => onNaturalRequestChange(event.target.value)}
            className="mt-4 min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600 outline-none transition focus:border-indigo-600 focus:bg-white"
            placeholder="Refund order ord_syn_1004 for $30. No evidence was provided and this customer has recent refund activity."
          />
          <button
            type="button"
            onClick={onExtractAction}
            disabled={isExtracting}
            className="mt-3 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-slate-50 transition hover:-translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50"
          >
            {isExtracting ? "Extracting..." : "Extract Action"}
          </button>
          {error ? (
            <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <details className="rounded-2xl bg-slate-50 p-6">
          <summary className="cursor-pointer text-xs uppercase tracking-wide text-slate-400">
            Selected preset ToolCall
          </summary>
          <pre className="mt-4 max-h-40 overflow-auto rounded-2xl bg-white p-4 font-mono text-xs leading-5 text-slate-600">
            {JSON.stringify(selectedPreset.toolCall, null, 2)}
          </pre>
        </details>
        <details className="rounded-2xl bg-slate-50 p-6">
          <summary className="cursor-pointer text-xs uppercase tracking-wide text-slate-400">
            Extracted ToolCall
          </summary>
          <pre className="mt-4 max-h-40 overflow-auto rounded-2xl bg-white p-4 font-mono text-xs leading-5 text-slate-600">
            {extractedToolCall
              ? JSON.stringify(extractedToolCall, null, 2)
              : "No extracted tool call yet."}
          </pre>
        </details>
      </div>
    </div>
  );
}
