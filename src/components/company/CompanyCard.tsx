import { Link } from 'react-router-dom';
import { ArrowUpRight, Handshake, MapPin, PackageSearch, Target } from 'lucide-react';
import type { Company } from '../../types/company';
import { Badge, Button, Card } from '../common/ui';
export function CompanyCard({ company }: { company: Company }) {
  return (
    <Card className="flex h-full flex-col p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold md:text-lg">{company.name}</h3>
          <p className="mt-1 text-xs text-slate-500 md:text-sm">{company.industry}</p>
        </div>
        {company.verified && <Badge>인증 기업</Badge>}
      </div>
      <p className="mt-3 flex items-center gap-1 text-xs text-slate-500 md:text-sm">
        <MapPin size={14} />
        {company.region}
      </p>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{company.description}</p>
      <div className="mt-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <PackageSearch size={14} /> 제공 서비스
        </p>
        <div className="flex flex-wrap gap-1.5">
          {company.offerings.slice(0, 3).map((x) => (
            <Badge key={x}>{x}</Badge>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Target size={14} /> 찾는 협력 분야
        </p>
        <div className="flex flex-wrap gap-1.5">
          {company.needs.slice(0, 3).map((x) => (
            <Badge key={x}>{x}</Badge>
          ))}
        </div>
      </div>
      <div className="mt-auto flex items-center justify-end gap-1 border-t border-slate-100 pt-4">
        <Link to={`/companies/${company.id}`}>
          <Button
            className="h-11 w-11 rounded-xl p-0 text-slate-700"
            variant="secondary"
            aria-label={`${company.name} 기업 보기`}
            title="기업 보기"
          >
            <ArrowUpRight size={20} strokeWidth={2.5} />
          </Button>
        </Link>
        <Button
          className="h-11 w-11 rounded-xl p-0 shadow-sm"
          aria-label={`${company.name} 협업 요청`}
          title="협업 요청"
        >
          <Handshake size={20} strokeWidth={2.5} />
        </Button>
      </div>
    </Card>
  );
}
