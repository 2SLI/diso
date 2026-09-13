import type { Timestamp } from 'firebase/firestore';

export type ProfileVisibility = 'PRIVATE' | 'PUBLIC';

/** Employee-owned career profile. Company membership and permissions stay in companyMembers. */
export interface EmployeeProfile {
  uid: string;
  displayName: string;
  headline: string;
  bio: string;
  skills: string[];
  certifications: string[];
  careerSummary: string;
  portfolioUrl: string;
  visibility: ProfileVisibility;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/** Private settings, intentionally separated from public career information. */
export interface EmployeeCareerSettings {
  uid: string;
  jobSearchStatus: 'NOT_LOOKING' | 'OPEN_TO_OFFERS' | 'ACTIVELY_LOOKING';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
