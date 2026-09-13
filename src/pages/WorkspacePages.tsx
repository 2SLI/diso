import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, EmptyState, Input, Select, Textarea } from '../components/common/ui';
import { TagInput } from '../components/common/TagInput';
import { useAuth } from '../hooks/useAuth';
import { useCompanies } from '../hooks/useCompanies';
import { useConnections } from '../hooks/useConnections';
import { useEmployeeProfile } from '../hooks/useEmployeeProfile';
import { useMembershipRequests } from '../hooks/useMembershipRequests';
import { useMyCompany } from '../hooks/useMyCompany';
import { useQuotes } from '../hooks/useQuotes';
import { useRfqs } from '../hooks/useRfqs';
import { saveCareerSettings, saveEmployeeProfile } from '../services/employeeService';
import type { MembershipRequest } from '../types/membershipRequest';
import type { EmployeeProfile } from '../types/employee';
import { recommendCompanies } from '../utils/companyMatching';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}
export function PlaceholderPage({
  title,
  description = '기능을 준비하고 있습니다.',
}: {
  title: string;
  description?: string;
}) {
  return (
    <>
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="mt-7">
        <EmptyState title={`${title} 기능 준비 중`} description={description} />
      </div>
    </>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { company, userProfile, loading } = useMyCompany(user?.uid);
  const { companies } = useCompanies();
  const { rfqs } = useRfqs(company?.id);
  const { quotes } = useQuotes(company?.id);
  const { connections } = useConnections(company?.id);
  if (loading)
    return (
      <>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="mt-7 text-sm text-slate-500">협업 현황을 불러오는 중…</p>
      </>
    );
  if (!company)
    return (
      <>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <div className="mt-7">
          <EmptyState
            title="회사 합류 승인 대기 중"
            description={
              userProfile?.pendingCompanyId
                ? '회사 관리자가 요청을 승인하면 RFQ, 견적, 거래처 기능을 이용할 수 있습니다.'
                : '소속 회사를 등록하거나 기존 회사에 합류 요청을 보내주세요.'
            }
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Link to="/join-company">
            <Button>회사에 합류하기</Button>
          </Link>
          <Link to="/register">
            <Button variant="secondary">새 회사 등록</Button>
          </Link>
        </div>
      </>
    );
  const recommendations = recommendCompanies(company, companies).slice(0, 4);
  const checks = [
    ['회사 소개', Boolean(company.description)],
    ['제공 서비스', company.offerings.length > 0],
    ['찾는 서비스', company.needs.length > 0],
    ['보유 역량', company.capabilities.length > 0],
    ['인증 정보', company.certifications.length > 0],
  ] as const;
  const completed = checks.filter(([, done]) => done).length;
  const stats = [
    ['추천 기업', recommendations.length, '역량과 수요가 일치하는 기업'],
    [
      '진행 중 RFQ',
      rfqs.filter((rfq) => rfq.buyerCompanyId === company.id && rfq.status === 'OPEN').length,
      '공개 중인 견적 요청',
    ],
    [
      '받은 견적',
      quotes.filter(
        (quote) =>
          quote.buyerCompanyId === company.id && ['SUBMITTED', 'REVISED'].includes(quote.status),
      ).length,
      '검토가 필요한 견적',
    ],
    [
      '연결된 거래처',
      connections.filter((connection) => connection.status === 'CONNECTED').length,
      '활성 거래처',
    ],
  ] as const;
  return (
    <>
      <h1 className="text-3xl font-bold">대시보드</h1>
      <p className="mt-2 text-slate-600">{company.name}의 협업 현황을 한눈에 확인하세요.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([title, value, text]) => (
          <Card key={title}>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-3 text-3xl font-bold">{value}</p>
            <p className="mt-2 text-xs text-slate-400">{text}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-bold">기업 프로필 완성도</h2>
            <p className="mt-1 text-sm text-slate-500">
              정보가 풍부할수록 더 정확한 거래처 추천을 받을 수 있습니다.
            </p>
          </div>
          <Badge>
            {completed}/{checks.length}
          </Badge>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-600"
            style={{ width: `${(completed / checks.length) * 100}%` }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {checks.map(([label, done]) => (
            <span
              key={label}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
            >
              {done ? '완료' : '필요'} · {label}
            </span>
          ))}
        </div>
        <Link to="/my-company" className="mt-4 inline-block text-sm font-semibold text-brand-600">
          프로필 보완하기 →
        </Link>
      </Card>
      <Card className="mt-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-bold">추천 기업</h2>
            <p className="mt-1 text-sm text-slate-500">
              제공 서비스와 필요한 협력 분야의 일치도를 기준으로 추천합니다.
            </p>
          </div>
          <Link to="/companies" className="text-sm font-semibold text-brand-600">
            기업 찾기
          </Link>
        </div>
        {recommendations.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recommendations.map(({ company: item, score, reasons }) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.industry} · {item.region}
                    </p>
                  </div>
                  <Badge>매칭 {score}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {reasons.map((reason) => (
                    <Badge key={reason}>{reason}</Badge>
                  ))}
                </div>
                <Link
                  to={`/companies/${item.id}`}
                  className="mt-4 inline-block text-sm font-semibold text-brand-600"
                >
                  기업 보기 →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="추천을 만들 정보가 부족합니다"
              description="기업 프로필에 제공 서비스와 찾고 있는 서비스를 입력하면 협업 후보를 추천합니다."
            />
          </div>
        )}
      </Card>
    </>
  );
}

export function TeamPage() {
  const { user } = useAuth();
  const { company, userProfile, loading } = useMyCompany(user?.uid);
  const { requests, loading: requestsLoading, error, review } = useMembershipRequests(company?.id);
  const [status, setStatus] = useState('');
  const decide = async (request: MembershipRequest, decision: 'APPROVED' | 'REJECTED') => {
    if (!user) return;
    try {
      await review(request, user.uid, decision);
      setStatus(
        decision === 'APPROVED' ? '직원 합류 요청을 승인했습니다.' : '요청을 거절했습니다.',
      );
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : '요청 처리에 실패했습니다.');
    }
  };
  if (loading)
    return (
      <>
        <h1 className="text-3xl font-bold">직원 및 권한</h1>
        <p className="mt-7 text-sm text-slate-500">정보를 불러오는 중…</p>
      </>
    );
  if (!company || !userProfile || !['OWNER', 'ADMIN'].includes(userProfile.role ?? ''))
    return (
      <>
        <h1 className="text-3xl font-bold">직원 및 권한</h1>
        <div className="mt-7">
          <EmptyState
            title="관리자 권한이 필요합니다"
            description="회사 OWNER 또는 ADMIN만 직원 합류 요청을 관리할 수 있습니다."
          />
        </div>
      </>
    );
  return (
    <>
      <h1 className="text-3xl font-bold">직원 및 권한</h1>
      <p className="mt-2 text-slate-600">회사 합류 요청을 검토하고 실무 권한을 부여하세요.</p>
      {status && <p className="mt-4 text-sm text-brand-600">{status}</p>}
      {requestsLoading ? (
        <p className="mt-7 text-sm text-slate-500">요청을 불러오는 중…</p>
      ) : error ? (
        <div className="mt-7">
          <EmptyState title="요청을 불러올 수 없습니다" description={error} />
        </div>
      ) : requests.length ? (
        <div className="mt-7 space-y-3">
          {requests.map((request) => (
            <Card key={request.id}>
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold">{request.displayName}</h2>
                    <Badge>{request.requestedRole}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{request.email}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {request.department} · {request.jobTitle}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => void decide(request, 'APPROVED')}>승인</Button>
                  <Button variant="secondary" onClick={() => void decide(request, 'REJECTED')}>
                    거절
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-7">
          <EmptyState
            title="대기 중인 합류 요청이 없습니다"
            description="직원이 기존 회사에 합류 요청을 보내면 여기에 표시됩니다."
          />
        </div>
      )}
    </>
  );
}

export function PersonalProfilePage() {
  const { user } = useAuth();
  const { profile, settings, loading, error } = useEmployeeProfile(user?.uid);
  const [status, setStatus] = useState('');
  const initial =
    profile ??
    (user
      ? {
          uid: user.uid,
          displayName: user.displayName || '',
          headline: '',
          bio: '',
          skills: [],
          certifications: [],
          careerSummary: '',
          portfolioUrl: '',
          visibility: 'PRIVATE' as const,
        }
      : null);
  const [draft, setDraft] = useState<EmployeeProfile | null>(null);
  const [jobSearchStatus, setJobSearchStatus] = useState(
    settings?.jobSearchStatus ?? 'NOT_LOOKING',
  );
  if (!user || loading)
    return (
      <>
        <h1 className="text-3xl font-bold">내 커리어 프로필</h1>
        <p className="mt-7 text-sm text-slate-500">프로필을 불러오는 중…</p>
      </>
    );
  if (error || !initial)
    return (
      <>
        <h1 className="text-3xl font-bold">내 커리어 프로필</h1>
        <div className="mt-7">
          <EmptyState
            title="프로필을 불러올 수 없습니다"
            description={error ?? '로그인이 필요합니다.'}
          />
        </div>
      </>
    );
  const form = draft ?? initial;
  const set = <K extends keyof EmployeeProfile>(key: K, value: EmployeeProfile[K]) =>
    setDraft({ ...form, [key]: value });
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('저장 중…');
    try {
      await Promise.all([saveEmployeeProfile(form), saveCareerSettings(form.uid, jobSearchStatus)]);
      setStatus('개인 커리어 프로필을 저장했습니다.');
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : '저장에 실패했습니다.');
    }
  };
  return (
    <>
      <h1 className="text-3xl font-bold">내 커리어 프로필</h1>
      <p className="mt-2 text-slate-600">
        이 프로필은 본인이 소유합니다. 회사 소속과 권한 정보는 별도로 관리됩니다.
      </p>
      <form onSubmit={submit} className="mt-7 space-y-5">
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="이름">
              <Input
                value={form.displayName}
                onChange={(event) => set('displayName', event.target.value)}
                required
              />
            </Field>
            <Field label="전문 분야 한 줄 소개">
              <Input
                value={form.headline}
                onChange={(event) => set('headline', event.target.value)}
                placeholder="예: 제조 자동화·스마트팩토리 PM"
              />
            </Field>
            <Field label="포트폴리오 URL">
              <Input
                type="url"
                value={form.portfolioUrl}
                onChange={(event) => set('portfolioUrl', event.target.value)}
                placeholder="https://"
              />
            </Field>
            <Field label="프로필 공개 범위">
              <Select
                value={form.visibility}
                onChange={(event) =>
                  set('visibility', event.target.value as EmployeeProfile['visibility'])
                }
              >
                <option value="PRIVATE">비공개 — 나만 볼 수 있음</option>
                <option value="PUBLIC">공개 — 나중에 전문가 탐색에 활용</option>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="소개">
                <Textarea
                  className="min-h-24"
                  value={form.bio}
                  onChange={(event) => set('bio', event.target.value)}
                  placeholder="나의 전문성, 관심 협업 분야를 소개하세요."
                />
              </Field>
            </div>
          </div>
        </Card>
        <Card className="space-y-4">
          <Field label="전문 기술·역량">
            <TagInput
              value={form.skills}
              onChange={(value) => set('skills', value)}
              placeholder="입력 후 Enter"
            />
          </Field>
          <Field label="자격·인증">
            <TagInput
              value={form.certifications}
              onChange={(value) => set('certifications', value)}
              placeholder="입력 후 Enter"
            />
          </Field>
          <Field label="경력 요약">
            <Textarea
              className="min-h-28"
              value={form.careerSummary}
              onChange={(event) => set('careerSummary', event.target.value)}
              placeholder="회사명, 역할, 주요 성과를 간단히 작성하세요."
            />
          </Field>
          <Field label="구직 관련 설정">
            <Select
              value={jobSearchStatus}
              onChange={(event) => setJobSearchStatus(event.target.value as typeof jobSearchStatus)}
            >
              <option value="NOT_LOOKING">구직 활동 안 함</option>
              <option value="OPEN_TO_OFFERS">좋은 제안이 있으면 검토</option>
              <option value="ACTIVELY_LOOKING">적극적으로 기회 탐색 중</option>
            </Select>
            <p className="mt-2 text-xs text-slate-500">
              구직 상태는 본인만 볼 수 있는 별도 설정입니다.
            </p>
          </Field>
        </Card>
        {status && <p className="text-sm text-brand-600">{status}</p>}
        <Button type="submit">개인 프로필 저장</Button>
      </form>
    </>
  );
}
