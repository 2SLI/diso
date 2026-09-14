import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import {
  loadPublicBusinesses,
  normalizeBusinessSearch,
  publicBusinessSources,
  publicBusinessRegion,
} from '../../services/publicBusinessService';
import type { PublicBusinessIndex } from '../../types/publicBusiness';
import { Button, Select } from '../common/ui';

const pageSize = 24;
export function PublicBusinessDirectory({ keyword }: { keyword: string }) {
  const [index, setIndex] = useState<PublicBusinessIndex>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [paging, setPaging] = useState({ query: '', limit: pageSize });
  useEffect(() => {
    let active = true;
    void loadPublicBusinesses()
      .then((data) => {
        if (active) {
          setIndex(data);
          setError('');
        }
      })
      .catch(() => {
        if (active) setError('업체 목록을 불러오지 못했습니다. 다시 시도해 주세요.');
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const prepared = useMemo(
    () =>
      (index?.businesses ?? []).map((business) => ({
        business,
        search: normalizeBusinessSearch(
          `${business.name} ${business.industry} ${business.region} ${business.address}`,
        ),
      })),
    [index],
  );
  const results = useMemo(() => {
    const search = normalizeBusinessSearch(keyword);
    return prepared
      .filter(
        ({ business, search: text }) =>
          (!search || text.includes(search)) &&
          (!category || business.sources.some((s) => s.id === category)) &&
          (!region || publicBusinessRegion(business.address, business.region) === region),
      )
      .map(({ business }) => business);
  }, [prepared, keyword, category, region]);
  const regions = useMemo(
    () =>
      [
        ...new Set(
          (index?.businesses ?? [])
            .map((b) => publicBusinessRegion(b.address, b.region))
            .filter(Boolean),
        ),
      ].sort(),
    [index],
  );
  const query = JSON.stringify([keyword, category, region]);
  const limit = paging.query === query ? paging.limit : pageSize;
  return (
    <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <p className="text-xs font-semibold text-teal-700">공공데이터 업체</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">일반 사업자·전문업체 찾기</h2>
        {index && (
          <span className="text-sm text-slate-500">
            전체 {index.businesses.length.toLocaleString()}건
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        공공기관이 제공한 업체 정보입니다. PartnerBase 가입·인증 또는 현재 영업 상태를 의미하지
        않습니다.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Select
          aria-label="공공데이터 업종"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">업종 전체</option>
          {publicBusinessSources.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="공공데이터 지역"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option value="">지역 전체</option>
          {regions.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </Select>
      </div>
      {error ? (
        <div role="alert" className="mt-5 text-sm text-slate-600">
          {error}
          <Button variant="secondary" onClick={() => setAttempt((v) => v + 1)}>
            다시 시도
          </Button>
        </div>
      ) : !index ? (
        <p role="status" className="py-8 text-center text-sm text-slate-500">
          업체 정보를 불러오는 중…
        </p>
      ) : (
        <>
          <p aria-live="polite" className="mt-4 text-sm text-slate-500">
            검색 결과 {results.length.toLocaleString()}건
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.slice(0, limit).map((business) => (
              <Link
                key={business.id}
                to={`/companies/public/${business.id}`}
                className="min-w-0 rounded-xl border border-slate-200 p-4 transition hover:border-teal-500 hover:bg-teal-50/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="break-words font-bold">{business.name}</h3>
                  <ArrowUpRight size={18} className="shrink-0 text-slate-400" />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {business.industry || '업종 정보 없음'}
                </p>
                <p className="mt-3 flex items-start gap-1 text-xs leading-5 text-slate-500">
                  <MapPin size={14} className="mt-0.5 shrink-0" />
                  {business.address || business.region || '소재지 정보 없음'}
                </p>
                <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-teal-700">
                  {business.sources[0]?.provider} 제공
                </p>
              </Link>
            ))}
          </div>
          {!results.length && (
            <p className="py-8 text-center text-sm text-slate-500">
              조건에 맞는 업체가 없습니다. 검색어나 필터를 변경해 주세요.
            </p>
          )}
          {results.length > limit && (
            <div className="mt-5 text-center">
              <Button
                variant="secondary"
                onClick={() => setPaging({ query, limit: limit + pageSize })}
              >
                업체 더 보기 ({Math.min(limit, results.length).toLocaleString()} /{' '}
                {results.length.toLocaleString()})
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
