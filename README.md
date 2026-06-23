# PolicyGate

PolicyGate is a runtime permission gateway for AI agents. It compiles written SOPs into deterministic policies and enforces those policies before any tool execution.

Phase 1 builds the deterministic foundation. Phase 2 adds OpenAI structured extraction for SOP compilation and candidate action extraction. The app does not expose MCP tools and does not connect to real company systems.

## Why prompt guardrails are insufficient

Prompt guardrails are useful guidance, but they are not a permission system. A model can be confused by conflicting instructions, prompt injection, incomplete context, or ambiguous natural language. PolicyGate treats model output as a candidate tool request, not as authority.

The final permission decision is always made by deterministic TypeScript code.

## What the model does

In Phase 2, a model may compile SOP text into policy JSON and extract candidate actions from natural language, such as:

- `refund_order`
- `export_customer_data`
- `modify_policy`

The model may also surface signals such as a possible prompt injection attempt. Those signals can be logged and evaluated by policy rules.

The model never returns `ALLOW`, `APPROVAL`, or `DENY` for a runtime request.

## What the deterministic engine does

The policy engine validates a tool call and a policy with Zod, checks policy rules by ascending priority, and returns one of:

- `ALLOW`
- `APPROVAL`
- `DENY`

If no policy rule matches, the engine returns `DENY`. The default policy denies unmatched actions.

## OpenAI setup

The deterministic preset demo works without OpenAI.

To enable SOP compilation and natural language action extraction, create `.env.local`:

```bash
OPENAI_API_KEY=your_api_key_here
```

The API key is read only by server-side API routes and is never exposed to the browser.

Model names are configured in `lib/config/models.ts`:

- `SOP_COMPILER_MODEL`
- `ACTION_EXTRACTOR_MODEL`

If the configured model is unavailable, the API route returns a clear error.

## Run locally

```bash
npm install
npm run dev
```

Open the local Next.js URL printed by the dev server.

Use preset buttons to run the deterministic demo without OpenAI. With `OPENAI_API_KEY` configured, use:

- `Compile SOP` to generate a policy from SOP text.
- `Extract Action` to turn a natural language request into a candidate `ToolCall`.

Final decisions still come only from `decide(toolCall, policy)`.

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
