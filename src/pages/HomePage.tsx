import { ArrowRight, Search, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CompanyCard } from '../components/company/CompanyCard';
import { Badge, Button, Input } from '../components/common/ui';
import { useCompanies } from '../hooks/useCompanies';

export function HomePage() {
  const { companies } = useCompanies();
  const featured = companies.slice(0, 3);

  return (
    <>
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:py-16 md:py-28">
          <Badge>B2B 협업 네트워크</Badge>
          <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:mt-5 md:text-6xl">
            우리 회사의 다음
            <br className="sm:hidden" /> 거래처를 찾아보세요
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base md:mt-6 md:text-lg md:leading-8">
            제품, 기술, 서비스와 필요한 협업 조건을 등록하면
            <br className="hidden sm:block" />
            우리 회사와 거래 가능성이 높은 기업을 찾을 수 있습니다.
          </p>
          <div className="mx-auto mt-7 grid max-w-sm grid-cols-2 gap-2 md:mt-8">
            <Link to="/companies">
              <Button className="w-full px-2">
                기업 찾아보기 <ArrowRight className="ml-1" size={15} />
              </Button>
            </Link>
            <Link to="/register">
              <Button className="w-full px-2" variant="secondary">
                기업 등록하기
              </Button>
            </Link>
          </div>
          <div className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm md:mt-10">
            <Search className="ml-2 shrink-0 text-slate-400" size={20} />
            <Input
              className="h-11 min-w-0 border-0 p-2 text-xs shadow-none focus:ring-0 sm:text-sm"
              placeholder="제품, 기술, 서비스 또는 기업명"
              aria-label="기업 검색"
            />
            <Link to="/companies">
              <Button
                className="h-11 w-11 shrink-0 rounded-xl p-0"
                aria-label="기업 검색 실행"
                title="검색"
              >
                <Search size={20} strokeWidth={2.5} />
              </Button>
            </Link>
            <Link
              to="/companies"
              className="hidden h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 sm:grid"
              aria-label="상세 검색"
              title="상세 검색"
            >
              <SlidersHorizontal size={19} />
            </Link>
          </div>
          <p className="mt-3 text-[11px] text-slate-400 sm:text-xs">
            예: CNC 가공 · SMPS · 물류 · OEM · 웹 개발
          </p>
        </div>
      </section>
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 md:py-16">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold text-brand-600 md:text-sm">PARTNERBASE</p>
              <h2 className="mt-1 text-xl font-bold md:text-2xl">등록 기업</h2>
            </div>
            <Link to="/companies" className="text-xs font-semibold text-brand-600 md:text-sm">
              전체 보기
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:mt-7 md:grid-cols-3 md:gap-5">
            {featured.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
