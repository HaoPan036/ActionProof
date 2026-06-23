import type { ToolPreset } from "@/lib/demo/simulatedTools";

type RequestSimulatorProps = {
  presets: ToolPreset[];
  selectedPresetId: string;
  onRun: (preset: ToolPreset) => void;
};

export function RequestSimulator({
  presets,
  selectedPresetId,
  onRun,
}: RequestSimulatorProps) {
  const selectedPreset =
    presets.find((preset) => preset.id === selectedPresetId) ?? presets[0];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
        Request Simulator
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {presets.map((preset) => {
          const isSelected = preset.id === selectedPresetId;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onRun(preset)}
              className={[
                "rounded-md border px-3 py-2 text-left text-sm font-medium transition",
                isSelected
                  ? "border-cyan-600 bg-cyan-50 text-cyan-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-slate-50",
              ].join(" ")}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <pre className="mt-4 max-h-56 overflow-auto rounded-md bg-slate-100 p-3 text-xs leading-5 text-slate-800">
        {JSON.stringify(selectedPreset.toolCall, null, 2)}
      </pre>
    </section>
  );
}
