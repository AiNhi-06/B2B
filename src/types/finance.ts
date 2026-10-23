export type DeliverySlot = 'MORNING' | 'AFTERNOON';
export interface EscrowAllocation {
  id: string; orderId: string; supplierId: string; goodsVnd: number; refundedVnd: number;
  status: 'HELD' | 'SETTLED'; feeVnd?: number; supplierNetVnd?: number; settledAt?: string;
}
export interface LedgerEntry {
  id: string; key: string; kind: 'HOLD' | 'REFUND' | 'SETTLEMENT' | 'WITHDRAWAL';
  orderId?: string; supplierId?: string; claimId?: string; withdrawalId?: string; amountVnd: number; feeVnd?: number; createdAt: string;
}
export interface Withdrawal {
  id: string; supplierId: string; amountVnd: number; status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestKey: string; createdAt: string; note?: string; reviewedAt?: string;
}
export interface FinanceSnapshot {
  allocations: EscrowAllocation[]; ledger: LedgerEntry[]; withdrawals: Withdrawal[];
  balances: { supplierId: string; availableVnd: number; reservedVnd: number; paidVnd: number }[];
}
