import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/common/ui';
import { useAuth } from '../hooks/useAuth';
import { useMyCompany } from '../hooks/useMyCompany';
import { getCompanyInquiries } from '../services/feedService';
import type { PostInquiry } from '../types/feed';

const typeNames = {
  QUOTE_REQUEST: '견적 요청',
  SUPPLY_PROPOSAL: '공급 제안',
  COLLABORATION: '협업 제안',
  MEETING: '미팅 요청',
};
export default function InquiriesPage() {
  const { user } = useAuth();
  const { company, loading: companyLoading } = useMyCompany(user?.uid);
  const [inquiries, setInquiries] = useState<PostInquiry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!company) return;
    let active = true;
    void getCompanyInquiries(company.id)
      .then((items) => {
        if (active) setInquiries(items);
      })
      .catch(() => {
        if (active) setError('문의를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [company]);
  if (companyLoading)
    return <p className="py-10 text-sm text-slate-500">회사 정보를 불러오는 중…</p>;
  return (
    <div>
      <h1 className="text-3xl font-bold">기업 문의함</h1>
      <p className="mt-2 text-sm text-slate-600">
        피드에서 보낸 견적·공급·협업·미팅 요청을 회사별로 확인합니다.
      </p>
      {!company ? (
        <div className="mt-7">
          <EmptyState
            title="회사 정보가 필요합니다"
            description="회사 소속 승인이 완료되면 문의를 볼 수 있습니다."
          />
        </div>
      ) : loading ? (
        <p className="mt-7 text-sm">문의를 불러오는 중…</p>
      ) : error ? (
        <div className="mt-7">
          <EmptyState title="문의를 불러올 수 없습니다" description={error} />
        </div>
      ) : inquiries.length ? (
        <div className="mt-7 space-y-3">
          {inquiries.map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                  {typeNames[item.type]}
                </span>
                <span className="text-xs text-slate-500">
                  {item.senderCompanyId === company.id ? '보낸 문의' : '받은 문의'} ·{' '}
                  {item.buyerCompanyId === company.id
                    ? item.supplierCompanyName
                    : item.buyerCompanyName}
                </span>
              </div>
              <h2 className="mt-3 font-bold">{item.postTitle}</h2>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                {item.message}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                {item.quantity ? `수량 ${item.quantity.toLocaleString()} · ` : ''}
                {item.createdAt?.toDate().toLocaleDateString('ko-KR') ?? '방금 전'} · 구매사/공급사
                전용
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-7">
          <EmptyState
            title="아직 주고받은 문의가 없습니다"
            description="기업 피드에서 견적이나 협업 요청을 시작해 보세요."
          />
          <Link to="/feed" className="mt-4 inline-block text-sm font-bold text-brand-600">
            기업 피드 보기 →
          </Link>
        </div>
      )}
    </div>
  );
}
