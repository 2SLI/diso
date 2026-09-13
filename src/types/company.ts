import type { Timestamp } from 'firebase/firestore';
export type CollaborationType =
  'SUPPLIER' | 'BUYER' | 'OEM' | 'ODM' | 'OUTSOURCING' | 'DISTRIBUTOR' | 'PARTNER';
export interface Company {
  id: string;
  name: string;
  businessNumber: string;
  businessStatus?: string;
  businessStatusCode?: string;
  businessTaxType?: string | null;
  industry: string;
  description: string;
  website: string;
  address?: string;
  region: string;
  logoUrl?: string;
  foundedYear?: number;
  employeeCount?: string;
  companyType?: string;
  cultureTags?: string[];
  benefits?: string[];
  offerings: string[];
  needs: string[];
  capabilities: string[];
  certifications: string[];
  serviceRegions: string[];
  collaborationTypes: CollaborationType[];
  verified: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  role: import('./user').CompanyRole;
  createdAt?: Timestamp;
}
