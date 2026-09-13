import type { Timestamp } from 'firebase/firestore';
export type QuoteStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REVISION_REQUESTED'
  | 'REVISED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';
export interface Quote {
  id: string;
  rfqId: string;
  buyerCompanyId: string;
  supplierCompanyId: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  deliveryDate?: string;
  paymentTerms?: string;
  message?: string;
  attachments: string[];
  status: QuoteStatus;
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
