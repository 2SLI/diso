import type { Timestamp } from 'firebase/firestore';
export type RfqStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED';
export interface Rfq {
  id: string;
  buyerCompanyId: string;
  title: string;
  description: string;
  category: string;
  quantity?: number;
  desiredDeliveryDate?: string;
  region?: string;
  attachments: string[];
  status: RfqStatus;
  isAnonymous: boolean;
  createdBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
