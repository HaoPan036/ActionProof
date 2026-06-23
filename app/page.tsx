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
import type { DecisionResult, Policy } from "@/lib/schemas/policy";
import { ToolCallSchema, type ToolCall, type ToolCallInput } from "@/lib/schemas/toolCall";

const initialPreset = toolPresets[0];
const initialDecision = decide(initialPreset.toolCall, defaultPolicy);

export default function Home() {
  const [sopText, setSopText] = useState(defaultSop);
  const [policy, setPolicy] = useState<Policy>(defaultPolicy);
  const [selectedPresetId, setSelectedPresetId] = useState(initialPreset.id);
  const [decision, setDecision] = useState<DecisionResult>(initialDecision);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [naturalRequest, setNaturalRequest] = useState(
    "Refund order ord_syn_1002 for $125 because the item arrived damaged.",
  );
  const [extractedToolCall, setExtractedToolCall] = useState<ToolCall | null>(
    null,
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);

  function recordDecision(toolCallInput: ToolCallInput, sourceId: string) {
    const nextDecision = decide(toolCallInput, policy);
    const parsedToolCall = ToolCallSchema.parse(toolCallInput);
    const event: AuditEvent = {
      id: `audit_${Date.now()}_${sourceId}`,
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

    setDecision(nextDecision);
    setAuditEvents((events) => [event, ...events].slice(0, 8));
  }

  function runPreset(preset: ToolPreset) {
    setExtractError(null);
    setSelectedPresetId(preset.id);
    recordDecision(preset.toolCall, preset.id);
  }

  async function compileSop() {
    setIsCompiling(true);
    setCompileError(null);

    try {
      const response = await fetch("/api/compile-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sopText }),
      });
      const payload = (await response.json()) as {
        policy?: Policy;
        error?: string;
      };

      if (!response.ok || !payload.policy) {
        throw new Error(payload.error || "Policy compilation failed.");
      }

      setPolicy(payload.policy);
    } catch (error) {
      setCompileError(
        error instanceof Error ? error.message : "Policy compilation failed.",
      );
    } finally {
      setIsCompiling(false);
    }
  }

  function resetPolicy() {
    setCompileError(null);
    setPolicy(defaultPolicy);
  }

  async function extractAction() {
    setIsExtracting(true);
    setExtractError(null);

    try {
      const response = await fetch("/api/extract-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userRequest: naturalRequest }),
      });
      const payload = (await response.json()) as {
        toolCall?: ToolCall;
        error?: string;
      };

      if (!response.ok || !payload.toolCall) {
        throw new Error(payload.error || "Action extraction failed.");
      }

      const parsedToolCall = ToolCallSchema.parse(payload.toolCall);
      setExtractedToolCall(parsedToolCall);
      recordDecision(parsedToolCall, "extracted-action");
    } catch (error) {
      setExtractError(
        error instanceof Error ? error.message : "Action extraction failed.",
      );
    } finally {
      setIsExtracting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
                PolicyGate Phase 2
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-normal text-slate-950">
                Deterministic Permission Gateway
              </h1>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Runtime policy decisions are made by TypeScript rules before tool
              execution. OpenAI only compiles SOPs and extracts candidate
              actions.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SopEditor
            value={sopText}
            onChange={setSopText}
            onCompile={compileSop}
            onResetPolicy={resetPolicy}
            isCompiling={isCompiling}
            error={compileError}
          />
          <PolicyViewer policy={policy} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <RequestSimulator
            presets={toolPresets}
            selectedPresetId={selectedPresetId}
            onRunPreset={runPreset}
            naturalRequest={naturalRequest}
            onNaturalRequestChange={setNaturalRequest}
            onExtractAction={extractAction}
            extractedToolCall={extractedToolCall}
            isExtracting={isExtracting}
            error={extractError}
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
