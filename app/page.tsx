"use client";

import { useState } from "react";
import { ApprovalPanel } from "@/components/ApprovalPanel";
import { ArchitectureNotes } from "@/components/ArchitectureNotes";
import { AuditTimeline } from "@/components/AuditTimeline";
import { DecisionCard } from "@/components/DecisionCard";
import { EvalDashboard } from "@/components/EvalDashboard";
import { PresentationMode } from "@/components/PresentationMode";
import { PolicyViewer } from "@/components/PolicyViewer";
import { RequestSimulator } from "@/components/RequestSimulator";
import { SopEditor } from "@/components/SopEditor";
import { defaultPolicy } from "@/lib/demo/defaultPolicy";
import { defaultSop } from "@/lib/demo/defaultSop";
import { toolPresets, type ToolPreset } from "@/lib/demo/simulatedTools";
import { decide } from "@/lib/policy-engine/decide";
import type { AuditEvent } from "@/lib/schemas/audit";
import type { DecisionResult, Policy } from "@/lib/schemas/policy";
import {
  ToolCallSchema,
  type ToolCall,
  type ToolCallInput,
} from "@/lib/schemas/toolCall";

const initialPreset = toolPresets[0];
const initialDecision = decide(initialPreset.toolCall, defaultPolicy);
const initialToolCall = ToolCallSchema.parse(initialPreset.toolCall);
type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

const valueCards = [
  {
    title: "Runtime Enforcement",
    body: "Every tool call is checked before execution.",
  },
  {
    title: "Refund Abuse Guard",
    body: "Small refunds are auto approved only when they are low value and low risk.",
  },
  {
    title: "Audit Proof",
    body: "Every decision links back to the SOP line that caused it.",
  },
];

export default function Home() {
  const [sopText, setSopText] = useState(defaultSop);
  const [policy, setPolicy] = useState<Policy>(defaultPolicy);
  const [selectedPresetId, setSelectedPresetId] = useState(initialPreset.id);
  const [currentScenarioLabel, setCurrentScenarioLabel] = useState(
    initialPreset.label,
  );
  const [decision, setDecision] = useState<DecisionResult>(initialDecision);
  const [currentToolCall, setCurrentToolCall] =
    useState<ToolCall>(initialToolCall);
  const [executed, setExecuted] = useState(initialDecision.decision === "ALLOW");
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(
    initialDecision.decision === "APPROVAL" ? "PENDING" : null,
  );
  const [highlightedSopLines, setHighlightedSopLines] = useState<number[]>(
    initialDecision.sourceSopLines,
  );
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
    const nextExecuted = nextDecision.decision === "ALLOW";
    const nextApprovalStatus: ApprovalStatus =
      nextDecision.decision === "APPROVAL" ? "PENDING" : null;
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
      approvalStatus: nextApprovalStatus,
      executed: nextExecuted,
    };

    setDecision(nextDecision);
    setCurrentToolCall(parsedToolCall);
    setExecuted(nextExecuted);
    setApprovalStatus(nextApprovalStatus);
    setHighlightedSopLines(nextDecision.sourceSopLines);
    setAuditEvents((events) => [event, ...events].slice(0, 8));
  }

  function runPreset(preset: ToolPreset) {
    setExtractError(null);
    setSelectedPresetId(preset.id);
    setCurrentScenarioLabel(preset.label);
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
      setCurrentScenarioLabel("Extracted natural language request");
      recordDecision(parsedToolCall, "extracted-action");
    } catch (error) {
      setExtractError(
        error instanceof Error ? error.message : "Action extraction failed.",
      );
    } finally {
      setIsExtracting(false);
    }
  }

  function appendApprovalAuditEvent(nextStatus: Exclude<ApprovalStatus, null>) {
    const nextExecuted = nextStatus === "APPROVED";
    const event: AuditEvent = {
      id: `audit_${Date.now()}_approval_${nextStatus.toLowerCase()}`,
      timestamp: new Date().toISOString(),
      toolCall: currentToolCall,
      decision: decision.decision,
      matchedRuleId: decision.matchedRuleId,
      reason:
        nextStatus === "APPROVED"
          ? "Synthetic human approval granted."
          : "Synthetic human approval rejected.",
      sourceSopLines: decision.sourceSopLines,
      containsPromptInjection: decision.containsPromptInjection,
      approvalStatus: nextStatus,
      executed: nextExecuted,
    };

    setApprovalStatus(nextStatus);
    setExecuted(nextExecuted);
    setAuditEvents((events) => [event, ...events].slice(0, 8));
  }

  function handleSourceLineClick(line: number) {
    setHighlightedSopLines([line]);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-6">
          <header className="rounded-2xl border border-slate-200 border-t-4 border-t-indigo-500 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Runtime Permission Gateway
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight">
              PolicyGate
            </h1>
            <p className="mt-6 max-w-4xl text-xl font-semibold leading-8 text-slate-900">
              Prompts are suggestions a model can ignore. PolicyGate is
              enforcement a model cannot.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
              A deterministic runtime permission gateway for AI agent tool
              calls.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {valueCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border-l-4 border-indigo-400 bg-slate-50 p-6"
                >
                  <div className="text-xl font-semibold text-slate-900">
                    {card.title}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {card.body}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm leading-6 text-slate-600">
              AI extracts candidate actions and risk signals. PolicyGate
              enforces the final decision with deterministic code.
            </p>
          </header>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-6">
          <PresentationMode
            presets={toolPresets}
            selectedPresetId={selectedPresetId}
            scenarioLabel={currentScenarioLabel}
            decision={decision}
            toolCall={currentToolCall}
            executed={executed}
            approvalStatus={approvalStatus}
            sopText={sopText}
            onRunPreset={runPreset}
            onSourceLineClick={handleSourceLineClick}
          />
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-slate-200" />
            <h2 className="text-sm font-medium uppercase tracking-widest text-slate-400">
              Technical Details
            </h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 lg:grid-cols-2">
          <SopEditor
            value={sopText}
            onChange={setSopText}
            onCompile={compileSop}
            onResetPolicy={resetPolicy}
            onLineSelect={handleSourceLineClick}
            highlightedLines={highlightedSopLines}
            isCompiling={isCompiling}
            error={compileError}
          />
          <PolicyViewer policy={policy} />
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 lg:grid-cols-[1.08fr_0.92fr]">
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
          <div className="space-y-6">
            <DecisionCard
              decision={decision}
              toolCall={currentToolCall}
              executed={executed}
              approvalStatus={approvalStatus}
              onSourceLineClick={handleSourceLineClick}
            />
            <ApprovalPanel
              visible={decision.decision === "APPROVAL"}
              approvalStatus={approvalStatus}
              toolCall={currentToolCall}
              onApprove={() => appendApprovalAuditEvent("APPROVED")}
              onReject={() => appendApprovalAuditEvent("REJECTED")}
            />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 lg:grid-cols-[0.95fr_1.05fr]">
          <AuditTimeline
            events={auditEvents}
            onSourceLineClick={handleSourceLineClick}
          />
          <EvalDashboard />
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-6">
          <ArchitectureNotes />
        </div>
      </section>
    </main>
  );
}
