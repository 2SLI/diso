import type { Company } from '../types/company';

export interface CompanyRecommendation {
  company: Company;
  score: number;
  reasons: string[];
}

const normalize = (value: string) => value.trim().toLowerCase();
const overlap = (left: string[], right: string[]) =>
  left.filter((item) => right.map(normalize).includes(normalize(item)));

export function recommendCompanies(
  myCompany: Company,
  candidates: Company[],
): CompanyRecommendation[] {
  return candidates
    .filter((candidate) => candidate.id !== myCompany.id)
    .map((company) => {
      const suppliedForMe = overlap(myCompany.needs, company.offerings);
      const iCanSupply = overlap(myCompany.offerings, company.needs);
      const capabilityMatch = overlap(myCompany.capabilities, company.capabilities);
      const sameRegion = myCompany.region === company.region;
      const reasons = [
        ...suppliedForMe.map((item) => `${item} 제공 가능`),
        ...iCanSupply.map((item) => `${item} 수요 보유`),
        ...capabilityMatch.map((item) => `${item} 역량 일치`),
        ...(sameRegion ? ['동일 지역'] : []),
      ].slice(0, 3);
      const score =
        suppliedForMe.length * 4 +
        iCanSupply.length * 3 +
        capabilityMatch.length +
        (sameRegion ? 1 : 0);
      return { company, score, reasons };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}
