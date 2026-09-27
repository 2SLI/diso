import type { Timestamp } from 'firebase/firestore';

export type PostType = 'SUPPLY' | 'DEMAND' | 'CAPACITY' | 'NEWS';
export interface CompanyPost {
  id: string;
  companyId: string;
  companyName: string;
  companyIndustry: string;
  companyRegion: string;
  type: PostType;
  title: string;
  body: string;
  authorId: string;
  createdAt?: Timestamp;
}
export type InquiryType = 'QUOTE_REQUEST' | 'SUPPLY_PROPOSAL' | 'COLLABORATION' | 'MEETING';
export interface PostInquiry {
  id: string;
  postId: string;
  postTitle: string;
  buyerCompanyId: string;
  buyerCompanyName: string;
  supplierCompanyId: string;
  supplierCompanyName: string;
  senderCompanyId: string;
  type: InquiryType;
  quantity?: number;
  message: string;
  status: 'PENDING' | 'CLOSED';
  createdBy: string;
  createdAt?: Timestamp;
}
