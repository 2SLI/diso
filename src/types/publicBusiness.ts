export interface PublicBusiness {
  id: string;
  name: string;
  industry: string;
  address: string;
  region: string;
  phone: string;
  sources: { id: string; provider: string; referenceDate: string }[];
}

export interface PublicBusinessIndex {
  updatedAt: string;
  businesses: PublicBusiness[];
}
