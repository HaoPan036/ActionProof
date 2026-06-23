type SopEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onCompile: () => void;
  onResetPolicy: () => void;
  isCompiling: boolean;
  error: string | null;
};

export function SopEditor({
  value,
  onChange,
  onCompile,
  onResetPolicy,
  isCompiling,
  error,
}: SopEditorProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          SOP Text
        </h2>
        <span className="text-xs text-slate-500">Synthetic demo policy</span>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-64 w-full resize-y rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-sm leading-6 text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-100"
      />
      {error ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCompile}
          disabled={isCompiling}
          className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isCompiling ? "Compiling..." : "Compile SOP"}
        </button>
        <button
          type="button"
          onClick={onResetPolicy}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Reset to Default Policy
        </button>
      </div>
    </section>
  );
}
