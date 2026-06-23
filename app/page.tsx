"use client";

import { useState } from "react";
import { AuditTimeline } from "@/components/AuditTimeline";
import { DecisionCard } from "@/components/DecisionCard";
import { EvalDashboard } from "@/components/EvalDashboard";
import { PolicyViewer } from "@/components/PolicyViewer";
import { RequestSimulator } from "@/components/RequestSimulator";
import { SopEditor } from "@/components/SopEditor";
import { defaultPolicy } from "@/lib/demo/defaultPolicy";
import { defaultSop } from "@/lib/demo/defaultSop";
import { toolPresets, type ToolPreset } from "@/lib/demo/simulatedTools";
import { decide } from "@/lib/policy-engine/decide";
import type { AuditEvent } from "@/lib/schemas/audit";
import type { DecisionResult } from "@/lib/schemas/policy";
import { ToolCallSchema } from "@/lib/schemas/toolCall";

const initialPreset = toolPresets[0];
const initialDecision = decide(initialPreset.toolCall, defaultPolicy);

export default function Home() {
  const [sopText, setSopText] = useState(defaultSop);
  const [selectedPresetId, setSelectedPresetId] = useState(initialPreset.id);
  const [decision, setDecision] = useState<DecisionResult>(initialDecision);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  function runPreset(preset: ToolPreset) {
    const nextDecision = decide(preset.toolCall, defaultPolicy);
    const parsedToolCall = ToolCallSchema.parse(preset.toolCall);
    const event: AuditEvent = {
      id: `audit_${Date.now()}_${preset.id}`,
      timestamp: new Date().toISOString(),
      toolCall: {
        ...parsedToolCall,
        contains_prompt_injection: nextDecision.containsPromptInjection,
      },
      decision: nextDecision.decision,
      matchedRuleId: nextDecision.matchedRuleId,
      reason: nextDecision.reason,
      sourceSopLines: nextDecision.sourceSopLines,
      containsPromptInjection: nextDecision.containsPromptInjection,
    };

    setSelectedPresetId(preset.id);
    setDecision(nextDecision);
    setAuditEvents((events) => [event, ...events].slice(0, 8));
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
                PolicyGate Phase 1
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-normal text-slate-950">
                Deterministic Permission Gateway
              </h1>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Runtime policy decisions are made by TypeScript rules before tool
              execution. Demo data is synthetic.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SopEditor value={sopText} onChange={setSopText} />
          <PolicyViewer policy={defaultPolicy} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <RequestSimulator
            presets={toolPresets}
            selectedPresetId={selectedPresetId}
            onRun={runPreset}
          />
          <DecisionCard decision={decision} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <AuditTimeline events={auditEvents} />
          <EvalDashboard />
        </div>
      </div>
    </main>
  );
}
