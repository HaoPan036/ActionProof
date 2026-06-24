type SopEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onCompile: () => void;
  onResetPolicy: () => void;
  onLineSelect: (line: number) => void;
  highlightedLines: number[];
  isCompiling: boolean;
  error: string | null;
};

export function SopEditor({
  value,
  onChange,
  onCompile,
  onResetPolicy,
  onLineSelect,
  highlightedLines,
  isCompiling,
  error,
}: SopEditorProps) {
  const lines = value.split("\n");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">
          SOP to Policy
        </h2>
        <span className="text-xs uppercase tracking-wide text-slate-400">
          Source lines are clickable
        </span>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-6 min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-600 outline-none transition focus:border-indigo-600 focus:bg-white"
      />
      <div className="mt-6 max-h-72 overflow-auto rounded-2xl bg-slate-50 p-3">
        {lines.map((line, index) => {
          const lineNumber = index + 1;
          const isHighlighted = highlightedLines.includes(lineNumber);

          return (
            <button
              key={`${lineNumber}-${line}`}
              type="button"
              onClick={() => onLineSelect(lineNumber)}
              className={[
                "grid w-full grid-cols-[2.75rem_1fr] gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:-translate-y-px active:scale-[0.98]",
                isHighlighted
                  ? "bg-white text-slate-900 ring-2 ring-inset ring-indigo-600"
                  : "text-slate-600 hover:bg-white",
              ].join(" ")}
            >
              <span className="font-mono text-xs text-slate-400">
                {lineNumber}
              </span>
              <span className="leading-6">{line.replace(/^\d+\.\s*/, "")}</span>
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onCompile}
          disabled={isCompiling}
          className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-slate-50 transition hover:-translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50"
        >
          {isCompiling ? "Compiling..." : "Compile SOP"}
        </button>
        <button
          type="button"
          onClick={onResetPolicy}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:-translate-y-px hover:text-indigo-600 active:scale-[0.98]"
        >
          Reset to Default Policy
        </button>
      </div>
    </div>
  );
}
