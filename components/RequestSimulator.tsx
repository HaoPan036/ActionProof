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
    tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  {
    title: "Needs Review",
    ids: ["approval-suspicious-small-refund", "approval-refund-120"],
    tone: "border-amber-200 bg-amber-50 text-amber-950",
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
    tone: "border-rose-200 bg-rose-50 text-rose-950",
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
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase text-slate-600">
          Agent Request Simulator
        </h2>
        <span className="text-xs text-slate-500">
          AI extracts; PolicyGate decides
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
            Mode A: Preset Tool Calls
          </h3>
          <div className="space-y-3">
            {presetGroups.map((group) => {
              const groupPresets = group.ids
                .map((id) => presets.find((preset) => preset.id === id))
                .filter((preset): preset is ToolPreset => Boolean(preset));

              return (
                <div key={group.title} className="rounded-md border border-slate-200 p-2">
                  <div
                    className={[
                      "mb-2 rounded-md border px-2 py-1 text-xs font-black uppercase",
                      group.tone,
                    ].join(" ")}
                  >
                    {group.title}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    {groupPresets.map((preset) => {
                      const isSelected = preset.id === selectedPresetId;
                      const isRecordingTarget = recordingTargetIds.has(preset.id);

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => onRunPreset(preset)}
                          className={[
                            "rounded-md border px-3 py-2 text-left text-sm font-bold transition",
                            isSelected
                              ? "border-cyan-700 bg-cyan-50 text-cyan-950 ring-2 ring-cyan-100"
                              : isRecordingTarget
                                ? "border-rose-300 bg-rose-50 text-rose-950 shadow-sm hover:border-rose-500"
                                : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <span>{preset.label}</span>
                          {isRecordingTarget ? (
                            <span className="mt-1 block text-xs font-semibold uppercase text-rose-700">
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
          <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
            Mode B: Natural Language Request
          </h3>
          <textarea
            value={naturalRequest}
            onChange={(event) => onNaturalRequestChange(event.target.value)}
            className="min-h-36 w-full resize-y rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-100"
            placeholder="Refund order ord_syn_1004 for $30. No evidence was provided and this customer has recent refund activity."
          />
          <button
            type="button"
            onClick={onExtractAction}
            disabled={isExtracting}
            className="mt-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isExtracting ? "Extracting..." : "Extract Action"}
          </button>
          {error ? (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-medium text-slate-500">
            Selected preset ToolCall
          </div>
          <pre className="max-h-36 overflow-auto rounded-md bg-slate-100 p-3 text-xs leading-5 text-slate-800">
            {JSON.stringify(selectedPreset.toolCall, null, 2)}
          </pre>
        </div>
        <div>
          <div className="mb-1 text-xs font-medium text-slate-500">
            Extracted ToolCall
          </div>
          <pre className="max-h-36 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">
            {extractedToolCall
              ? JSON.stringify(extractedToolCall, null, 2)
              : "No extracted tool call yet."}
          </pre>
        </div>
      </div>
    </section>
  );
}
