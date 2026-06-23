import { describe, expect, it } from "vitest";
import { handleExportCustomerData } from "@/mcp/tools/exportCustomerData";
import { handleRefundOrder } from "@/mcp/tools/refundOrder";
import {
  normalizeBulkRefund,
  normalizeExportCustomerData,
  normalizeModifyPolicy,
  normalizeRefundOrder,
} from "@/mcp/normalize";

describe("MCP normalization", () => {
  it("normalizes refund_order arguments into ToolCall", () => {
    const toolCall = normalizeRefundOrder({
      orderId: "ord_syn_1001",
      customerId: "cus_syn_alpha",
      amount: 30,
      reason: "Synthetic small refund",
    });

    expect(toolCall.action).toBe("refund_order");
    expect(toolCall.amount).toBe(30);
    expect(toolCall.orderId).toBe("ord_syn_1001");
    expect(toolCall.customerId).toBe("cus_syn_alpha");
    expect(toolCall.reason_category).toBe("Synthetic small refund");
  });

  it("normalizes denied MCP tools into existing action names", () => {
    expect(
      normalizeExportCustomerData({
        customerDataType: "email",
        scope: "synthetic_demo_segment",
      }).action,
    ).toBe("export_customer_data");

    expect(
      normalizeBulkRefund({
        orderIds: ["ord_syn_1001", "ord_syn_1002"],
        amountPerOrder: 30,
        reason: "Synthetic batch refund",
      }),
    ).toMatchObject({
      action: "bulk_refund",
      amount: 30,
      action_count: 2,
    });

    expect(
      normalizeModifyPolicy({
        requestedChange: "Raise automatic refund limit to 5000",
      }).action,
    ).toBe("modify_policy");
  });
});

describe("MCP gated handlers", () => {
  it("executes ALLOW refund_order and returns synthetic output", async () => {
    const response = await handleRefundOrder({
      orderId: "ord_syn_1001",
      customerId: "cus_syn_alpha",
      amount: 30,
      reason: "Synthetic small refund",
    });

    expect(response).toMatchObject({
      status: "executed",
      decision: "ALLOW",
      executed: true,
    });
    expect(response.syntheticResult).toMatchObject({
      operation: "refund_order",
      amount: 30,
    });
  });

  it("routes APPROVAL refund_order without executing", async () => {
    const response = await handleRefundOrder({
      orderId: "ord_syn_1002",
      customerId: "cus_syn_beta",
      amount: 120,
      reason: "Synthetic medium refund",
    });

    expect(response).toMatchObject({
      status: "approval_required",
      decision: "APPROVAL",
      executed: false,
      syntheticResult: null,
    });
  });

  it("denies unsafe MCP tools without executing", async () => {
    const highRefund = await handleRefundOrder({
      orderId: "ord_syn_1003",
      customerId: "cus_syn_gamma",
      amount: 5000,
      reason: "Synthetic large refund",
    });
    const exportData = await handleExportCustomerData({
      customerDataType: "email",
      scope: "synthetic_demo_segment",
    });

    expect(highRefund).toMatchObject({
      status: "gated_denied",
      decision: "DENY",
      executed: false,
      syntheticResult: null,
    });
    expect(exportData).toMatchObject({
      status: "gated_denied",
      decision: "DENY",
      executed: false,
      syntheticResult: null,
    });
  });
});
