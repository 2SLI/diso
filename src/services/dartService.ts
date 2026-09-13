export type DartCompany = {
  corpCode: string;
  corpName: string;
  stockCode: string;
  modifiedAt: string;
};

export type DartCompanyProfile = DartCompany & {
  ceoName?: string;
  corporationClass?: string;
  legalRegistrationNumber?: string;
  businessRegistrationNumber?: string;
  address?: string;
  homepageUrl?: string;
  phoneNumber?: string;
  faxNumber?: string;
  industryCode?: string;
  establishedAt?: string;
  fiscalMonth?: string;
};

type DartCompanyIndex = { updatedAt: string; companies: DartCompany[] };
type DartCompanyProfileIndex = {
  updatedAt: string;
  profiles: Record<string, Omit<DartCompanyProfile, keyof DartCompany>>;
};
let indexPromise: Promise<DartCompanyIndex> | null = null;
let profilePromise: Promise<DartCompanyProfileIndex> | null = null;
let listedCompaniesPromise: Promise<DartCompanyProfile[]> | null = null;

async function loadIndex(): Promise<DartCompanyIndex> {
  indexPromise ??= fetch('/data/dart-companies.json').then(async (response) => {
    if (!response.ok) throw new Error('OpenDART 기업 목록을 불러오지 못했습니다.');
    return (await response.json()) as DartCompanyIndex;
  });
  return indexPromise;
}

async function loadProfiles(): Promise<DartCompanyProfileIndex> {
  profilePromise ??= fetch('/data/dart-company-profiles.json').then(async (response) => {
    if (!response.ok) throw new Error('OpenDART 기업개황을 불러오지 못했습니다.');
    return (await response.json()) as DartCompanyProfileIndex;
  });
  return profilePromise;
}

const withProfile = (
  company: DartCompany,
  profiles: DartCompanyProfileIndex['profiles'],
): DartCompanyProfile => ({ ...company, ...profiles[company.corpCode] });

const normalize = (value: string) => value.replace(/\s/g, '').toLocaleLowerCase('ko-KR');

export async function searchDartCompanies(
  keyword: string,
  maxResults = 12,
): Promise<DartCompany[]> {
  const query = normalize(keyword);
  if (query.length < 2) return [];
  const { companies } = await loadIndex();
  const startsWithQuery = companies.filter((company) =>
    normalize(company.corpName).startsWith(query),
  );
  const includesQuery = companies.filter(
    (company) =>
      !normalize(company.corpName).startsWith(query) && normalize(company.corpName).includes(query),
  );
  return [...startsWithQuery, ...includesQuery].slice(0, maxResults);
}

export async function getDartCompany(corpCode: string): Promise<DartCompanyProfile | null> {
  const [{ companies }, { profiles }] = await Promise.all([loadIndex(), loadProfiles()]);
  const company = companies.find((item) => item.corpCode === corpCode);
  return company ? withProfile(company, profiles) : null;
}

export async function getFeaturedDartCompanies(): Promise<DartCompany[]> {
  const featuredNames = ['삼성전자', '현대자동차', 'LG전자', 'SK하이닉스', '포스코홀딩스', '카카오'];
  const { companies } = await loadIndex();
  const featured = featuredNames.flatMap((name) =>
    companies.filter((company) => company.corpName === name && Boolean(company.stockCode)).slice(0, 1),
  );

  return featured.length >= 3
    ? featured
    : companies.filter((company) => Boolean(company.stockCode)).slice(0, featuredNames.length);
}

export async function getDartCompanyPage(
  offset = 0,
  limit = 24,
): Promise<{ companies: DartCompanyProfile[]; total: number }> {
  listedCompaniesPromise ??= Promise.all([loadIndex(), loadProfiles()]).then(([{ companies }, { profiles }]) =>
    companies
      .filter((company) => Boolean(company.stockCode) && Boolean(profiles[company.corpCode]))
      .map((company) => withProfile(company, profiles))
      .sort((first, second) => first.corpName.localeCompare(second.corpName, 'ko-KR')),
  );
  const listedCompanies = await listedCompaniesPromise;
  return {
    companies: listedCompanies.slice(offset, offset + limit),
    total: listedCompanies.length,
  };
}
