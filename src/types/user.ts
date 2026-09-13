import type { Timestamp } from 'firebase/firestore';
export type CompanyRole = 'OWNER' | 'ADMIN' | 'PURCHASER' | 'SALES' | 'VIEWER';
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  companyId?: string;
  pendingCompanyId?: string;
  role?: CompanyRole;
  createdAt?: Timestamp;
}
