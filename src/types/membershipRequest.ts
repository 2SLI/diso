import type { Timestamp } from 'firebase/firestore';
import type { CompanyRole } from './user';

export type MembershipRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MembershipRequest {
  id: string;
  companyId: string;
  userId: string;
  displayName: string;
  email: string;
  department: string;
  jobTitle: string;
  requestedRole: CompanyRole;
  status: MembershipRequestStatus;
  createdAt?: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
}
