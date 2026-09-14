import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { loadPublicBusinesses } from '../services/publicBusinessService';
import type { PublicBusiness } from '../types/publicBusiness';
import { Card } from '../components/common/ui';

export default function PublicBusinessDetailPage() {
  const { businessId } = useParams();
  const [state, setState] = useState<{ id?: string; business?: PublicBusiness; error?: string }>(
    {},
  );
  useEffect(() => {
    let active = true;
    void loadPublicBusinesses()
      .then(({ businesses }) => {
        const business = businesses.find((item) => item.id === businessId);
        if (active)
          setState({
            id: businessId,
            business,
            error: business ? undefined : '업체 정보를 찾을 수 없습니다.',
          });
      })
      .catch(() => {
        if (active) setState({ id: businessId, error: '업체 정보를 불러오지 못했습니다.' });
      });
    return () => {
      active = false;
    };
  }, [businessId]);
  const business = state.id === businessId ? state.business : undefined;
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/companies" className="text-sm text-slate-600">
        ← 기업 목록
      </Link>
      {!business ? (
        <p role="status" className="py-10">
          {state.id === businessId ? state.error : '업체 정보를 불러오는 중…'}
        </p>
      ) : (
        <>
          <Card className="mt-5 p-5 sm:p-8">
            <Building2 size={32} className="text-teal-700" />
            <p className="mt-4 text-xs font-semibold text-teal-700">공공데이터 업체 정보</p>
            <h1 className="mt-2 break-words text-2xl font-bold sm:text-3xl">{business.name}</h1>
            <p className="mt-3 leading-6 text-slate-500">
              공공기관 자료를 바탕으로 제공하는 정보입니다. 기업이 직접 관리하는 PartnerBase
              프로필이 아니며, 가입·인증·현재 영업 여부를 보증하지 않습니다.
            </p>
            <dl className="mt-6 grid gap-5 border-t pt-6 sm:grid-cols-2">
              {[
                ['업종·취급품목', business.industry],
                ['주소·지역', business.address || business.region],
                ['연락처', business.phone],
                ['웹사이트', '웹사이트 준비 중'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-1 break-words text-sm leading-6">
                    {value || '제공된 정보 없음'}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="mt-5 p-5 sm:p-8">
            <h2 className="font-bold">정보 출처</h2>
            <ul className="mt-3 space-y-2">
              {business.sources.map((s) => (
                <li key={`${s.id}:${s.referenceDate}`} className="text-sm text-slate-600">
                  {s.provider} · 자료 기준일 {s.referenceDate}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-slate-500">
              연락처의 가림 처리는 원본 자료를 따릅니다. 협업 요청은 PartnerBase에 등록된 기업
              프로필에서 이용할 수 있습니다.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
