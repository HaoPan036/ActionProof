export type SyntheticOrder = {
  id: string;
  customerId: string;
  customerTier: "standard" | "plus" | "enterprise-demo";
  amountPaid: number;
  refundCount: number;
};

export const syntheticOrders: SyntheticOrder[] = [
  {
    id: "ord_syn_1001",
    customerId: "cus_syn_alpha",
    customerTier: "standard",
    amountPaid: 32,
    refundCount: 0,
  },
  {
    id: "ord_syn_1002",
    customerId: "cus_syn_beta",
    customerTier: "plus",
    amountPaid: 125,
    refundCount: 1,
  },
  {
    id: "ord_syn_1003",
    customerId: "cus_syn_gamma",
    customerTier: "enterprise-demo",
    amountPaid: 260,
    refundCount: 2,
  },
];
