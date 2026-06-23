import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { pathToFileURL } from "node:url";
import { bulkRefundInputSchema, handleBulkRefund } from "./tools/bulkRefund";
import {
  exportCustomerDataInputSchema,
  handleExportCustomerData,
} from "./tools/exportCustomerData";
import { modifyPolicyInputSchema, handleModifyPolicy } from "./tools/modifyPolicy";
import { refundOrderInputSchema, handleRefundOrder } from "./tools/refundOrder";

function toMcpTextResponse(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

export function createPolicyGateMcpServer() {
  const server = new McpServer({
    name: "policygate-synthetic-commerce",
    version: "0.3.0",
  });

  server.registerTool(
    "refund_order",
    {
      title: "Refund Order",
      description: "Synthetic refund tool gated by PolicyGate before execution.",
      inputSchema: refundOrderInputSchema,
    },
    async (args) => toMcpTextResponse(await handleRefundOrder(args)),
  );

  server.registerTool(
    "export_customer_data",
    {
      title: "Export Customer Data",
      description:
        "Synthetic customer data export tool gated by PolicyGate before execution.",
      inputSchema: exportCustomerDataInputSchema,
    },
    async (args) => toMcpTextResponse(await handleExportCustomerData(args)),
  );

  server.registerTool(
    "bulk_refund",
    {
      title: "Bulk Refund",
      description: "Synthetic bulk refund tool gated by PolicyGate before execution.",
      inputSchema: bulkRefundInputSchema,
    },
    async (args) => toMcpTextResponse(await handleBulkRefund(args)),
  );

  server.registerTool(
    "modify_policy",
    {
      title: "Modify Policy",
      description: "Synthetic policy modification tool gated by PolicyGate.",
      inputSchema: modifyPolicyInputSchema,
    },
    async (args) => toMcpTextResponse(await handleModifyPolicy(args)),
  );

  return server;
}

async function main() {
  const server = createPolicyGateMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("PolicyGate MCP server failed to start.", error);
    process.exit(1);
  });
}
