# PolicyGate

PolicyGate is a runtime permission gateway for AI agents. It compiles written SOPs into deterministic policies and enforces those policies before any tool execution.

Phase 1 builds the deterministic foundation only. It does not call an LLM, does not expose MCP tools, and does not connect to real company systems.

## Why prompt guardrails are insufficient

Prompt guardrails are useful guidance, but they are not a permission system. A model can be confused by conflicting instructions, prompt injection, incomplete context, or ambiguous natural language. PolicyGate treats model output as a candidate tool request, not as authority.

The final permission decision is always made by deterministic TypeScript code.

## What the model does

In a future phase, a model may extract candidate actions from natural language, such as:

- `refund_order`
- `export_customer_data`
- `modify_policy`

The model may also surface signals such as a possible prompt injection attempt. Those signals can be logged and evaluated by policy rules.

## What the deterministic engine does

The policy engine validates a tool call and a policy with Zod, checks policy rules by ascending priority, and returns one of:

- `ALLOW`
- `APPROVAL`
- `DENY`

If no policy rule matches, the engine returns `DENY`. The default policy denies unmatched actions.

## Run locally

```bash
npm install
npm run dev
```

Open the local Next.js URL printed by the dev server.

## Run tests

```bash
npx vitest run
```

## Build

```bash
npm run build
```

## Roadmap

- Phase 1: deterministic foundation
- Phase 2: OpenAI structured outputs
- Phase 3: MCP gated tools
- Phase 4: UI polish and eval dashboard
- Phase 5: submission packaging

## Data safety

This repository uses synthetic demo data only. Do not add real company data, internal business rules, internal table names, private customer information, credentials, API keys, or secrets.

There are no credentials in this repo, and Phase 1 does not require any external service keys.
