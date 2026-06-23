const notes = [
  ["SOP compiler", "LLM structured output"],
  ["Action extractor", "LLM structured output"],
  ["Risk signal extraction", "LLM structured output or synthetic demo context"],
  ["Policy engine", "Deterministic TypeScript"],
  ["Execution boundary", "Tool execution boundary in the demo runtime"],
  [
    "Refund Abuse Guard",
    "Deterministic policy conditions over risk fields and refund history",
  ],
  ["Audit", "Every decision records matched rule and source SOP lines"],
];

export function ArchitectureNotes() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">
        Architecture Notes
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {notes.map(([title, body]) => (
          <div key={title} className="rounded-2xl bg-slate-50 p-6">
            <div className="text-xl font-semibold text-slate-900">{title}</div>
            <div className="mt-1 text-sm leading-6 text-slate-600">{body}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 rounded-2xl bg-slate-50 p-6 text-sm leading-6 text-slate-600">
        PolicyGate gates synthetic commerce tool calls at the execution boundary.
      </p>
    </div>
  );
}
