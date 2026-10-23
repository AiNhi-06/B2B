export type BusinessRole = 'CUSTOMER' | 'SUPPLIER';
export interface BusinessProfile {
  id: string; role: BusinessRole; businessName: string; phone: string; taxCode: string;
  contactName: string; address: string; capacityKg?: number; certificateImage?: string; vietGapImage?: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'; legacy: boolean;
  rejectionReason?: string; submittedAt?: string; reviewedAt?: string;
}
export interface QualityReview {
  productId: string; supplierId: string; grade: 'A' | 'B'; yieldPercent?: number; brix?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; revision: number; note?: string; submittedAt: string; reviewedAt?: string;
}
export interface ClaimLine { productId: string; quantityKg: number; }
export interface Claim {
  id: string; orderId: string; customerId: string; supplierId: string; lines: ClaimLine[]; reason: string; images: string[];
  status: 'OPEN' | 'RESPONDED' | 'APPROVED' | 'REJECTED'; submittedAt: string;
  response?: string; approvedLines?: ClaimLine[]; refundVnd?: number; decisionNote?: string; decidedAt?: string;
}
