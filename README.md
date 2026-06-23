# PolicyGate

PolicyGate is a runtime permission gateway for AI agents. It compiles written SOPs into deterministic policies and enforces those policies before any tool execution.

Phase 1 builds the deterministic foundation. Phase 2 adds OpenAI structured extraction for SOP compilation and candidate action extraction. Phase 3 adds an isolated stdio MCP server with gated tools for a synthetic commerce demo. The app does not connect to real company systems.
Phase 4 polishes the demo flow with SOP traceability, approval handling, an audit timeline, and a deterministic Refund Abuse Guard.

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

AI extracts candidate actions and risk signals. PolicyGate enforces the final decision with deterministic code.

## What the deterministic engine does

The policy engine validates a tool call and a policy with Zod, checks policy rules by ascending priority, and returns one of:

- `ALLOW`
- `APPROVAL`
- `DENY`

If no policy rule matches, the engine returns `DENY`. The default policy denies unmatched actions.

## Refund Abuse Guard

Small refunds are only auto approved when they are both low value and low risk. A $30 refund can be allowed when the request has evidence, a delivery issue, and no suspicious refund history.

Small refunds with MEDIUM or HIGH risk are routed to human approval. Repeated refund patterns are blocked by deterministic rules, not by model judgment:

- 5 or more refund requests in the last 30 days means `DENY`.
- More than $200 refunded in the last 30 days means `DENY`.
- 10 or more refunds to the same shipping address in the last 30 days means `DENY`.

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

## Demo Flow

1. Compile SOP.
2. Run `Allow refund 30, low risk`.
3. Run `Suspicious small refund 30`.
4. Approve or reject the approval-required request.
5. Run `Deny repeated refund abuse`.
6. Run `Attack refund 5000`.
7. Run `Deny data export`.
8. Click a SOP source line in the decision card.
9. Review the eval dashboard.

The full preset flow is designed to fit in a short hackathon demo recording.

## MCP demo

PolicyGate exposes gated MCP tools for a synthetic commerce demo. It is intentionally scoped to the four tools listed below.

Run the stdio MCP server:

```bash
npm run mcp:dev
```

Launch MCP Inspector:

```bash
npm run mcp:inspect
```

Manual Inspector command:

```bash
npx @modelcontextprotocol/inspector tsx mcp/server.ts
```

The MCP server exposes exactly:

- `refund_order`
- `export_customer_data`
- `bulk_refund`
- `modify_policy`

Each tool normalizes arguments into `ToolCall`, calls `decide(toolCall, defaultPolicy)`, writes an audit event, and executes the synthetic tool only when the deterministic decision is `ALLOW`.

## Run tests

```bash
npx vitest run
```

## Build

```bash
npm run build
```

## Deployment

For Vercel, set `OPENAI_API_KEY` in Project Settings -> Environment Variables.

Do not expose API keys to the browser. PolicyGate reads `OPENAI_API_KEY` only from server-side API routes.

The preset deterministic demo works without OpenAI. The OpenAI SOP compiler and natural language extraction demo require `OPENAI_API_KEY`.

## Screenshots

Use `public/demo-screenshots/` for lightweight pitch or Devpost screenshots. Do not commit large media files.

## Roadmap

- Phase 1: deterministic foundation
- Phase 2: OpenAI structured outputs
- Phase 3: MCP gated tools
- Phase 4: UI polish and eval dashboard
- Phase 5: submission packaging

## Data safety

This repository uses synthetic demo data only. Do not add real company data, internal business rules, internal table names, private customer information, credentials, API keys, or secrets.

There are no credentials in this repo. The deterministic demo and MCP demo do not require external service keys.
