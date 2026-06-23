type SopEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SopEditor({ value, onChange }: SopEditorProps) {
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
    </section>
  );
}
