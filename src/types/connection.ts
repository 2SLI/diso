import type { Timestamp } from 'firebase/firestore';
export type ConnectionStatus = 'PENDING' | 'CONNECTED' | 'BLOCKED';
export interface Connection {
  id: string;
  companyAId: string;
  companyBId: string;
  status: ConnectionStatus;
  createdBy: string;
  createdAt?: Timestamp;
}
