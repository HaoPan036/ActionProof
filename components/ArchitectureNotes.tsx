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
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase text-slate-600">
        Architecture Notes
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {notes.map(([title, body]) => (
          <div key={title} className="rounded-md border border-slate-200 p-3">
            <div className="text-sm font-semibold text-slate-950">{title}</div>
            <div className="mt-1 text-sm leading-6 text-slate-600">{body}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
        PolicyGate gates synthetic commerce tool calls at the execution boundary.
      </p>
    </section>
  );
}
