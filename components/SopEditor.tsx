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
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase text-slate-600">
          SOP to Policy
        </h2>
        <span className="text-xs text-slate-500">Source lines are clickable</span>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-36 w-full resize-y rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-sm leading-6 text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-100"
      />
      <div className="mt-3 max-h-72 overflow-auto rounded-md border border-slate-200 bg-white">
        {lines.map((line, index) => {
          const lineNumber = index + 1;
          const isHighlighted = highlightedLines.includes(lineNumber);

          return (
            <button
              key={`${lineNumber}-${line}`}
              type="button"
              onClick={() => onLineSelect(lineNumber)}
              className={[
                "grid w-full grid-cols-[2.75rem_1fr] gap-3 border-b border-l-4 border-b-slate-100 px-3 py-2 text-left text-sm last:border-b-0",
                isHighlighted
                  ? "border-l-amber-400 bg-amber-50 text-amber-950 ring-2 ring-inset ring-amber-200"
                  : "border-l-transparent bg-white text-slate-700 hover:bg-slate-50",
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
