import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  BriefcaseBusiness,
  Bookmark,
  Building2,
  CheckCircle2,
  Globe2,
  MapPin,
  MoreHorizontal,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Send,
  Users,
  X,
} from 'lucide-react';
import { CompanyCard } from '../components/company/CompanyCard';
import { Badge, Button, Card, EmptyState, Input, Select, Textarea } from '../components/common/ui';
import { TagInput } from '../components/common/TagInput';
import { industryGroups, industries, regions } from '../constants/industries';
import { useAuth } from '../hooks/useAuth';
import { useCompanies, useCompany } from '../hooks/useCompanies';
import { useMyCompany } from '../hooks/useMyCompany';
import { requestConnection } from '../services/connectionService';
import { verifyMyCompanyBusinessNumber } from '../services/businessVerificationService';
import { getCachedDartCompanyProfile } from '../services/dartProfileService';
import {
  getDartCompany,
  getDartCompanyPage,
  searchDartCompanies,
  type DartCompany,
  type DartCompanyProfile,
} from '../services/dartService';
import type { Company } from '../types/company';

export function CompaniesPage() {
  const { companies, loading, error } = useCompanies();
  const [keyword, setKeyword] = useState('');
  const [industry, setIndustry] = useState('');
  const [region, setRegion] = useState('');
  const [offering, setOffering] = useState('');
  const [need, setNeed] = useState('');
  const [collaborationType, setCollaborationType] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dartResults, setDartResults] = useState<DartCompany[]>([]);
  const [dartDirectory, setDartDirectory] = useState<DartCompanyProfile[]>([]);
  const [dartDirectoryTotal, setDartDirectoryTotal] = useState(0);
  const [dartDirectoryLoading, setDartDirectoryLoading] = useState(true);
  const [dartLoading, setDartLoading] = useState(false);
  const hasSearchKeyword = keyword.trim().length >= 2;
  const hasActiveFilters = Boolean(
    keyword || industry || region || offering || need || collaborationType,
  );
  const filtered = companies.filter(
    (company) =>
      `${company.name}${company.industry}${company.offerings.join('')}${company.needs.join('')}${company.capabilities.join('')}`
        .toLowerCase()
        .includes(keyword.toLowerCase()) &&
      (!industry || company.industry === industry) &&
      (!region || company.region === region) &&
      (!offering || company.offerings.join(' ').toLowerCase().includes(offering.toLowerCase())) &&
      (!need || company.needs.join(' ').toLowerCase().includes(need.toLowerCase())) &&
      (!collaborationType ||
        company.collaborationTypes.includes(
          collaborationType as Company['collaborationTypes'][number],
        )),
  );
  const resetFilters = () => {
    setKeyword('');
    setIndustry('');
    setRegion('');
    setOffering('');
    setNeed('');
    setCollaborationType('');
  };
  useEffect(() => {
    const query = keyword.trim();
    if (query.length < 2) return;
    let active = true;
    const timer = window.setTimeout(() => {
      if (active) setDartLoading(true);
      void searchDartCompanies(query)
        .then((results) => active && setDartResults(results))
        .catch(() => active && setDartResults([]))
        .finally(() => active && setDartLoading(false));
    }, 220);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [keyword]);
  useEffect(() => {
    let active = true;
    void getDartCompanyPage()
      .then(({ companies: directory, total }) => {
        if (!active) return;
        setDartDirectory(directory);
        setDartDirectoryTotal(total);
      })
      .catch(() => active && setDartDirectory([]))
      .finally(() => active && setDartDirectoryLoading(false));
    return () => {
      active = false;
    };
  }, []);
  const loadMoreDartCompanies = () => {
    setDartDirectoryLoading(true);
    void getDartCompanyPage(dartDirectory.length)
      .then(({ companies: nextCompanies, total }) => {
        setDartDirectory((current) => [...current, ...nextCompanies]);
        setDartDirectoryTotal(total);
      })
      .finally(() => setDartDirectoryLoading(false));
  };
  const displayedDartCompanies = hasSearchKeyword ? dartResults : dartDirectory;
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <p className="text-sm font-semibold text-brand-600">COMPANY DIRECTORY</p>
      <h1 className="mt-1 text-3xl font-bold">기업 찾기</h1>
      <p className="mt-2 text-slate-600">우리 회사의 다음 협업 파트너를 찾아보세요.</p>
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm md:p-3">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="h-11 border-0 bg-slate-50 pl-10 pr-9 shadow-none focus:bg-white"
              placeholder="기업명, 제품, 기술 검색"
              aria-label="기업 검색"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword('')}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                aria-label="검색어 지우기"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-label="상세 필터"
            aria-expanded={filtersOpen}
            title="상세 필터"
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition-colors ${filtersOpen || hasActiveFilters ? 'border-brand-200 bg-brand-50 text-brand-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <SlidersHorizontal size={18} />
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              aria-label="필터 초기화"
              title="필터 초기화"
              className="hidden h-11 w-11 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 md:grid"
            >
              <RotateCcw size={17} />
            </button>
          )}
        </div>
        {filtersOpen && (
          <div className="mt-2 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <BriefcaseBusiness
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400"
              />
              <Select
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
                className="h-11 pl-9"
              >
                <option value="">업종 전체</option>
                {industryGroups.map((group) => (
                  <optgroup key={group.code} label={group.label}>
                    {group.industries.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </div>
            <div className="relative">
              <MapPin
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400"
              />
              <Select
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                className="h-11 pl-9"
              >
                <option value="">지역 전체</option>
                {regions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </div>
            <Select
              value={collaborationType}
              onChange={(event) => setCollaborationType(event.target.value)}
              className="h-11"
            >
              <option value="">협업 형태 전체</option>
              <option value="SUPPLIER">공급</option>
              <option value="BUYER">구매</option>
              <option value="OEM">OEM</option>
              <option value="ODM">ODM</option>
              <option value="PARTNER">파트너</option>
            </Select>
            <Input
              value={offering}
              onChange={(event) => setOffering(event.target.value)}
              className="h-11"
              placeholder="제공 서비스"
              aria-label="제공 서비스"
            />
            <Input
              value={need}
              onChange={(event) => setNeed(event.target.value)}
              className="h-11"
              placeholder="필요 서비스"
              aria-label="필요 서비스"
            />
            <button
              type="button"
              onClick={resetFilters}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 md:hidden"
            >
              <RotateCcw size={16} />
              초기화
            </button>
          </div>
        )}
      </section>
      <p className="mt-3 text-xs text-slate-400">
        {industries.length}개 세부 업종과 {regions.length}개 지역 기준으로 검색할 수 있습니다.
      </p>
      <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-amber-700">외부 공시 데이터 · OPEN DART</p>
              <h2 className="mt-1 text-lg font-bold">
                {hasSearchKeyword ? '공시기업 검색 결과' : '상장·등록 공시기업'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {hasSearchKeyword
                  ? '금융감독원 전자공시 기준 기업 목록입니다.'
                  : `${dartDirectoryTotal.toLocaleString()}개 기업의 기본정보를 제공합니다. 검색하면 전체 공시기업을 찾습니다.`}
              </p>
              <p className="mt-2 text-xs font-medium text-amber-800">
                PartnerBase에 등록한 기업 프로필이 아닙니다. 협업 요청과 상세 서비스 정보는 등록 기업에서만 이용할 수 있습니다.
              </p>
            </div>
            {hasSearchKeyword && dartLoading && <span className="text-xs text-slate-400">검색 중…</span>}
          </div>
          {displayedDartCompanies.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {displayedDartCompanies.map((dartCompany) => (
                <Link
                  key={dartCompany.corpCode}
                  to={`/companies/dart-${dartCompany.corpCode}`}
                  className="rounded-lg border border-amber-200 bg-white p-4 transition hover:border-amber-400 hover:bg-amber-50/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900">{dartCompany.corpName}</p>
                    {dartCompany.stockCode && <Badge>{dartCompany.stockCode}</Badge>}
                  </div>
                  <p className="mt-2 text-xs font-medium text-amber-800">외부 데이터 · OpenDART 공시기업</p>
                </Link>
              ))}
            </div>
          )}
          {hasSearchKeyword && !dartLoading && displayedDartCompanies.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">일치하는 공시기업이 없습니다.</p>
          )}
          {!hasSearchKeyword && dartDirectoryLoading && displayedDartCompanies.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">공시기업 목록을 불러오는 중…</p>
          )}
          {!hasSearchKeyword && dartDirectory.length > 0 && dartDirectory.length < dartDirectoryTotal && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={loadMoreDartCompanies} disabled={dartDirectoryLoading}>
                {dartDirectoryLoading ? '불러오는 중…' : '공시기업 더 보기'}
              </Button>
            </div>
          )}
        </section>
      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">기업 정보를 불러오는 중…</p>
      ) : error ? (
        <EmptyState title="기업 목록을 불러올 수 없습니다" description={error} />
      ) : filtered.length ? (
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-brand-600">PARTNERBASE</p>
              <h2 className="mt-1 text-lg font-bold">PartnerBase 등록 기업</h2>
              <p className="mt-1 text-sm text-slate-500">
                기업이 직접 등록하고 관리하는 협업 프로필입니다.
              </p>
            </div>
            <span className="text-sm text-slate-500">{filtered.length}개</span>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {filtered.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500">
          <p className="text-xs font-semibold text-brand-600">PARTNERBASE</p>
          <p className="mt-1 font-medium text-slate-700">PartnerBase 등록 기업이 아직 없습니다.</p>
          <p className="mt-1">위 OpenDART 공시기업은 외부 목록이며, 기업이 직접 등록한 협업 프로필은 여기에 표시됩니다.</p>
        </section>
      )}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-bold">
      {icon}
      {title}
    </h2>
  );
}
function TagBlock({ title, tags }: { title: string; tags: readonly string[] }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-sm font-semibold text-slate-700">{title}</p>
      <div className="flex flex-wrap gap-2">
        {tags.length ? (
          tags.map((tag) => <Badge key={tag}>{tag}</Badge>)
        ) : (
          <span className="text-sm text-slate-400">등록된 정보가 없습니다.</span>
        )}
      </div>
    </div>
  );
}

function toPartnerCompany(dartCompany: DartCompanyProfile): Company {
  const corporationClass =
    dartCompany.corporationClass === 'Y'
      ? '유가증권시장 상장법인'
      : dartCompany.corporationClass === 'K'
        ? '코스닥 상장법인'
        : dartCompany.corporationClass === 'N'
          ? '코넥스 상장법인'
          : dartCompany.corporationClass === 'E'
            ? '기타법인'
            : '공시기업';
  const establishedYear = Number(dartCompany.establishedAt?.slice(0, 4));
  const homepage = dartCompany.homepageUrl
    ? /^https?:\/\//.test(dartCompany.homepageUrl)
      ? dartCompany.homepageUrl
      : `https://${dartCompany.homepageUrl}`
    : '';
  const region = dartCompany.address?.split(' ').slice(0, 2).join(' ') || '대한민국';
  return {
    id: `dart-${dartCompany.corpCode}`,
    name: dartCompany.corpName,
    businessNumber: dartCompany.businessRegistrationNumber ?? '',
    industry: dartCompany.industryCode
      ? `${corporationClass} · 업종코드 ${dartCompany.industryCode}`
      : `${corporationClass} · ${dartCompany.stockCode}`,
    description: dartCompany.ceoName
      ? `${dartCompany.ceoName} 대표가 이끄는 ${corporationClass}입니다. 금융감독원 OpenDART 기업개황을 바탕으로 한 기본정보이며, 기업이 PartnerBase 프로필을 등록하면 제품·역량·협업 정보를 추가로 확인할 수 있습니다.`
      : '금융감독원 OpenDART 공시기업 목록에서 확인된 기업입니다. 기업이 PartnerBase 프로필을 등록하면 제품, 역량, 협업 정보를 추가로 확인할 수 있습니다.',
    website: homepage,
    address: dartCompany.address,
    region,
    foundedYear: Number.isFinite(establishedYear) ? establishedYear : undefined,
    companyType: corporationClass,
    offerings: [],
    needs: [],
    capabilities: [],
    certifications: [],
    serviceRegions: [],
    collaborationTypes: [],
    verified: false,
  };
}

export function CompanyDetailPage() {
  const { companyId } = useParams();
  const dartCorpCode = companyId?.startsWith('dart-') ? companyId.slice(5) : undefined;
  const {
    company: registeredCompany,
    loading: registeredLoading,
    error: registeredError,
  } = useCompany(dartCorpCode ? undefined : companyId);
  const [dartCompany, setDartCompany] = useState<DartCompanyProfile | null>(null);
  const [dartLoading, setDartLoading] = useState(Boolean(dartCorpCode));
  const [dartError, setDartError] = useState<string | null>(null);
  const { user } = useAuth();
  const { company: myCompany } = useMyCompany(user?.uid);
  const [requestStatus, setRequestStatus] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  useEffect(() => {
    if (!dartCorpCode) return;
    let active = true;
    void Promise.all([
      getDartCompany(dartCorpCode),
      getCachedDartCompanyProfile(dartCorpCode).catch(() => null),
    ])
      .then(([result, cachedProfile]) => {
        if (active) {
          setDartCompany(result ? { ...result, ...cachedProfile } : null);
          setDartError(result ? null : '요청한 OpenDART 기업을 찾을 수 없습니다.');
          setDartLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setDartError('OpenDART 기업 정보를 불러오지 못했습니다.');
          setDartLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [dartCorpCode]);
  const company = registeredCompany ?? (dartCompany ? toPartnerCompany(dartCompany) : null);
  const loading = dartCorpCode ? dartLoading : registeredLoading;
  const error = dartCorpCode ? dartError : registeredError;
  const sendRequest = async () => {
    if (!user) {
      setRequestStatus('로그인 후 협업 요청을 보낼 수 있습니다.');
      return;
    }
    if (!myCompany || !company || dartCorpCode) {
      setRequestStatus('내 회사 정보를 먼저 등록해주세요.');
      return;
    }
    try {
      await requestConnection(myCompany.id, company.id, user.uid);
      setRequestStatus('협업 요청을 보냈습니다.');
    } catch (cause) {
      setRequestStatus(cause instanceof Error ? cause.message : '협업 요청에 실패했습니다.');
    }
  };
  if (loading)
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500">
        기업 정보를 불러오는 중…
      </div>
    );
  if (!company)
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link to="/companies" className="text-sm text-brand-600">
          ← 기업 목록
        </Link>
        <div className="mt-5">
          <EmptyState
            title="기업을 찾을 수 없습니다"
            description={error ?? '요청한 기업 정보가 없습니다.'}
          />
        </div>
      </div>
    );
  const details = dartCorpCode && dartCompany
    ? [
        ['대표자', dartCompany.ceoName || '공시 정보 없음'],
        ['설립일', dartCompany.establishedAt || '공시 정보 없음'],
        ['기업 구분', company.companyType || '공시 정보 없음'],
        ['사업자등록번호', dartCompany.businessRegistrationNumber || '공시 정보 없음'],
        ['법인등록번호', dartCompany.legalRegistrationNumber || '공시 정보 없음'],
        ['대표 전화', dartCompany.phoneNumber || '공시 정보 없음'],
      ]
    : [
        ['설립', company.foundedYear ? `${company.foundedYear}년` : '정보 미등록'],
        ['임직원', company.employeeCount || '정보 미등록'],
        ['기업 형태', company.companyType || '정보 미등록'],
        [
          '서비스 지역',
          company.serviceRegions.length ? company.serviceRegions.join(', ') : '정보 미등록',
        ],
      ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:py-8">
      <Link to="/companies" className="text-sm font-medium text-slate-500 hover:text-brand-600">
        ← 기업 목록
      </Link>
      <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="h-24 border-b border-slate-200 bg-[#e8eef5] md:h-36" />
        <div className="relative px-5 pb-5 md:px-7">
          <div className="-mt-12 grid h-24 w-24 place-items-center rounded-xl border-4 border-white bg-brand-600 text-3xl font-bold text-white shadow-sm md:-mt-14 md:h-28 md:w-28 md:text-4xl">
            {company.name.slice(0, 1)}
          </div>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{company.name}</h1>
                {dartCorpCode && <Badge>OpenDART 공시기업</Badge>}
                {company.verified && (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                    <CheckCircle2 size={14} />
                    인증됨
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {company.industry} · {company.region} · {dartCorpCode ? '외부 공시 정보' : 'PartnerBase 기업 프로필'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!dartCorpCode && (
                <Button onClick={() => void sendRequest()} className="gap-2">
                  <Send size={16} /> 협업 요청
                </Button>
              )}
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => setIsSaved((saved) => !saved)}
              >
                <Bookmark size={16} className={isSaved ? 'fill-current' : ''} />
                {isSaved ? '저장됨' : '저장'}
              </Button>
              <Button variant="secondary" className="h-10 w-10 p-0" aria-label="더보기">
                <MoreHorizontal size={19} />
              </Button>
            </div>
          </div>
          {requestStatus && <p className="mt-3 text-sm text-brand-600">{requestStatus}</p>}
          {dartCorpCode && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">OpenDART 외부 공시기업 정보</p>
              <p className="mt-1 text-amber-800">
                이 기업은 PartnerBase에 직접 등록한 프로필이 아닙니다. 공시 목록 정보만 제공하며, 협업 요청·RFQ·직원 정보는 기업 등록 후에 표시됩니다.
              </p>
            </div>
          )}
        </div>
        <nav className="flex gap-6 overflow-x-auto border-t border-slate-200 px-5 text-sm font-semibold text-slate-500 md:px-7">
          <a
            href="#overview"
            className="shrink-0 border-b-2 border-brand-600 py-3.5 text-brand-600"
          >
            홈
          </a>
          <a href="#business" className="shrink-0 py-3.5 hover:text-slate-900">
            서비스
          </a>
          <a href="#trust" className="shrink-0 py-3.5 hover:text-slate-900">
            기업 정보
          </a>
          <a href="#culture" className="shrink-0 py-3.5 hover:text-slate-900">
            조직·문화
          </a>
        </nav>
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <Card id="overview" className="rounded-xl p-5 md:p-6">
            <SectionTitle icon={<Building2 size={19} />} title="소개" />
            <p className="mt-4 whitespace-pre-line leading-7 text-slate-700">
              {company.description}
            </p>
            <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
                </div>
              ))}
            </div>
          </Card>
          {dartCorpCode ? (
            <Card id="business" className="rounded-xl p-5 md:p-6">
              <SectionTitle icon={<BriefcaseBusiness size={19} />} title="OpenDART 제공 범위" />
              <p className="mt-4 leading-7 text-slate-600">
                OpenDART 기업개황은 대표자, 주소, 홈페이지, 설립일, 법인·사업자등록번호 등 공시 기본정보를 제공합니다.
                제품·서비스, 인증, 조직문화, 협업 가능 분야는 공시 표준 항목이 아니므로 기업이 PartnerBase 프로필을 등록한 뒤 표시됩니다.
              </p>
            </Card>
          ) : (
            <>
              <Card id="business" className="rounded-xl p-5 md:p-6">
                <SectionTitle icon={<BriefcaseBusiness size={19} />} title="제품 · 서비스 · 역량" />
                <TagBlock title="제공하는 제품·서비스" tags={company.offerings} />
                <TagBlock title="찾고 있는 협력 분야" tags={company.needs} />
                <TagBlock title="보유 기술·설비" tags={company.capabilities} />
                <TagBlock title="협업 형태" tags={company.collaborationTypes} />
              </Card>
              <Card id="trust" className="rounded-xl p-5 md:p-6">
                <SectionTitle icon={<CheckCircle2 size={19} />} title="기업 신뢰 정보" />
                <TagBlock title="인증·수상" tags={company.certifications} />
                <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                  사업자등록번호와 기업 정보는 회사 관리자 검토 절차를 통해 인증 상태를 부여할 수 있습니다.
                </div>
              </Card>
              <Card id="culture" className="rounded-xl p-5 md:p-6">
                <SectionTitle icon={<Users size={19} />} title="일하는 방식" />
                <TagBlock title="기업 문화" tags={company.cultureTags ?? []} />
                <TagBlock title="복리후생·지원" tags={company.benefits ?? []} />
              </Card>
            </>
          )}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="rounded-xl">
            <p className="text-sm font-bold">회사 정보</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="flex gap-2">
                <BriefcaseBusiness size={16} className="shrink-0 text-slate-400" />
                {company.industry}
              </p>
              <p className="flex gap-2">
                <MapPin size={16} className="shrink-0 text-slate-400" />
                {company.address || company.region}
              </p>
              <p className="flex gap-2">
                <Globe2 size={16} className="shrink-0 text-slate-400" />
                {company.website ? (
                  <a
                    className="text-brand-600"
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    웹사이트 방문
                  </a>
                ) : (
                  '웹사이트 미등록'
                )}
              </p>
            </div>
          </Card>
          <Card className="rounded-xl">
            <p className="text-sm font-bold">PartnerBase 현황</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">협업 형태</p>
                <p className="mt-1 text-lg font-bold">{company.collaborationTypes.length}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">보유 인증</p>
                <p className="mt-1 text-lg font-bold">{company.certifications.length}</p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}
function CompanyProfileForm({
  company,
  save,
}: {
  company: Company;
  save: (changes: Partial<Company>) => Promise<void>;
}) {
  const [form, setForm] = useState(company);
  const [status, setStatus] = useState('');
  const [verifying, setVerifying] = useState(false);
  const set = <K extends keyof Company>(key: K, value: Company[K]) =>
    setForm({ ...form, [key]: value });
  const verifyBusinessNumber = async () => {
    setVerifying(true);
    setStatus('사업자 상태를 확인하는 중…');
    try {
      const result = await verifyMyCompanyBusinessNumber(form.businessNumber);
      const verifiedForm = {
        ...form,
        businessNumber: result.businessNumber,
        businessStatus: result.status,
        businessStatusCode: result.statusCode,
        businessTaxType: result.taxType,
      };
      await save(verifiedForm);
      setForm(verifiedForm);
      setStatus(
        result.isActive
          ? `사업자 상태가 확인되었습니다: ${result.status}`
          : `사업자 상태 확인 결과: ${result.status}`,
      );
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : '사업자 상태 확인에 실패했습니다.');
    } finally {
      setVerifying(false);
    }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('저장 중…');
    try {
      await save(form);
      setStatus('변경사항을 저장했습니다.');
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : '저장에 실패했습니다.');
    }
  };
  return (
    <>
      <h1 className="text-3xl font-bold">기업 프로필</h1>
      <p className="mt-2 text-slate-600">
        거래처와 인재가 회사를 신뢰할 수 있도록 기업 정보를 최신으로 유지하세요.
      </p>
      <form onSubmit={submit} className="mt-7 space-y-5">
        <Card>
          <h2 className="mb-5 text-lg font-bold">기업 기본 정보</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="회사명">
              <Input
                value={form.name}
                onChange={(event) => set('name', event.target.value)}
                required
              />
            </Field>
            <Field label="사업자등록번호">
              <div className="flex gap-2">
                <Input
                  value={form.businessNumber}
                  onChange={(event) => set('businessNumber', event.target.value)}
                  inputMode="numeric"
                  placeholder="숫자 10자리"
                  required
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 whitespace-nowrap"
                  onClick={() => void verifyBusinessNumber()}
                  disabled={verifying}
                >
                  {verifying ? '확인 중…' : '상태 확인'}
                </Button>
              </div>
              {form.businessStatus && (
                <p className="mt-2 text-xs text-emerald-700">
                  {form.businessStatus}
                  {form.businessTaxType ? ` · ${form.businessTaxType}` : ''}
                </p>
              )}
            </Field>
            <Field label="업종">
              <Input
                value={form.industry}
                onChange={(event) => set('industry', event.target.value)}
                required
              />
            </Field>
            <Field label="지역">
              <Input
                value={form.region}
                onChange={(event) => set('region', event.target.value)}
                required
              />
            </Field>
            <Field label="설립 연도">
              <Input
                type="number"
                min="1800"
                max="2100"
                value={form.foundedYear ?? ''}
                onChange={(event) =>
                  set('foundedYear', event.target.value ? Number(event.target.value) : undefined)
                }
              />
            </Field>
            <Field label="임직원 수">
              <Input
                value={form.employeeCount ?? ''}
                onChange={(event) => set('employeeCount', event.target.value)}
                placeholder="예: 50명"
              />
            </Field>
            <Field label="기업 형태">
              <Input
                value={form.companyType ?? ''}
                onChange={(event) => set('companyType', event.target.value)}
                placeholder="예: 중소기업, 스타트업"
              />
            </Field>
            <Field label="웹사이트">
              <Input
                value={form.website}
                onChange={(event) => set('website', event.target.value)}
                placeholder="https://"
              />
            </Field>
            <Field label="회사 소개">
              <Textarea
                className="min-h-24"
                value={form.description}
                onChange={(event) => set('description', event.target.value)}
                required
              />
            </Field>
          </div>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-lg font-bold">사업·협업 정보</h2>
          <Field label="제공 가능한 제품/서비스">
            <TagInput
              value={form.offerings}
              onChange={(value) => set('offerings', value)}
              placeholder="입력 후 Enter"
            />
          </Field>
          <Field label="찾고 있는 제품/서비스">
            <TagInput
              value={form.needs}
              onChange={(value) => set('needs', value)}
              placeholder="입력 후 Enter"
            />
          </Field>
          <Field label="보유 기술/설비">
            <TagInput
              value={form.capabilities}
              onChange={(value) => set('capabilities', value)}
              placeholder="입력 후 Enter"
            />
          </Field>
          <Field label="인증">
            <TagInput
              value={form.certifications}
              onChange={(value) => set('certifications', value)}
              placeholder="입력 후 Enter"
            />
          </Field>
          <Field label="협업 형태">
            <TagInput
              value={form.collaborationTypes}
              onChange={(value) =>
                set('collaborationTypes', value as Company['collaborationTypes'])
              }
              placeholder="SUPPLIER, OEM 등"
            />
          </Field>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-lg font-bold">조직·문화 정보</h2>
          <Field label="기업 문화">
            <TagInput
              value={form.cultureTags ?? []}
              onChange={(value) => set('cultureTags', value)}
              placeholder="예: 수평적 소통, 기술 중심"
            />
          </Field>
          <Field label="복리후생·지원">
            <TagInput
              value={form.benefits ?? []}
              onChange={(value) => set('benefits', value)}
              placeholder="예: 교육 지원, 유연 근무"
            />
          </Field>
        </Card>
        {status && (
          <p
            className={`text-sm ${status.includes('저장했습니다') ? 'text-emerald-600' : 'text-slate-500'}`}
          >
            {status}
          </p>
        )}
        <Button type="submit">변경사항 저장</Button>
      </form>
    </>
  );
}

export function MyCompanyPage() {
  const { user } = useAuth();
  const { company, loading, error, save } = useMyCompany(user?.uid);
  if (loading)
    return (
      <>
        <h1 className="text-3xl font-bold">기업 프로필</h1>
        <p className="mt-7 text-sm text-slate-500">회사 정보를 불러오는 중…</p>
      </>
    );
  if (error || !company)
    return (
      <>
        <h1 className="text-3xl font-bold">기업 프로필</h1>
        <div className="mt-7">
          <EmptyState
            title="기업 프로필을 찾을 수 없습니다"
            description={error ?? '회사 정보를 불러오지 못했습니다.'}
          />
        </div>
      </>
    );
  return <CompanyProfileForm key={company.id} company={company} save={save} />;
}
