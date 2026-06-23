# PolicyGate MCP Demo

PolicyGate exposes gated MCP tools for a synthetic commerce demo. This minimal MCP server is intentionally scoped to the four tools listed below.

The server exposes exactly four tools:

- `refund_order`
- `export_customer_data`
- `bulk_refund`
- `modify_policy`

Every tool handler follows the same sequence:

1. Receive MCP tool arguments.
2. Normalize arguments into the existing `ToolCall` schema.
3. Call `decide(toolCall, defaultPolicy)`.
4. Write an in-memory audit event.
5. Execute the synthetic tool only when the deterministic decision is `ALLOW`.

## Run

```bash
npm run mcp:dev
```

This starts a stdio MCP server with:

```bash
tsx mcp/server.ts
```

## MCP Inspector

```bash
npm run mcp:inspect
```

Manual equivalent:

```bash
npx @modelcontextprotocol/inspector tsx mcp/server.ts
```

Use the Inspector to list tools and call the demo tools.

## Manual Demo Calls

`refund_order` with amount `30` should execute:

```json
{
  "orderId": "ord_syn_1001",
  "customerId": "cus_syn_alpha",
  "amount": 30,
  "reason": "Synthetic small refund"
}
```

`refund_order` with amount `120` should return `approval_required` and `executed: false`.

`refund_order` with amount `5000` should return `gated_denied` and `executed: false`.

`export_customer_data` should return `gated_denied` and `executed: false`:

```json
{
  "customerDataType": "email",
  "scope": "synthetic_demo_segment"
}
```

`modify_policy` should return `gated_denied` and `executed: false`:

```json
{
  "requestedChange": "Raise automatic refund limit to 5000"
}
```

`bulk_refund` should return `gated_denied` and `executed: false`:

```json
{
  "orderIds": ["ord_syn_1001", "ord_syn_1002"],
  "amountPerOrder": 30,
  "reason": "Synthetic batch refund"
}
```

## Limits

This MCP server uses synthetic placeholder commerce functions only. It does not call real refund, payment, export, customer, or policy management APIs.
