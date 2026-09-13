import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Input, Select, Textarea } from '../components/common/ui';
import { industryGroups, regions } from '../constants/industries';
import { useAuth } from '../hooks/useAuth';
import { useCompanies } from '../hooks/useCompanies';
import type { CollaborationType } from '../types/company';

function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center px-4">
      <Card className="w-full">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">PartnerBase에서 기업 협업을 시작하세요.</p>
        <div className="mt-6">{children}</div>
      </Card>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await login(String(form.get('email')), String(form.get('password')));
      navigate('/dashboard');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '로그인에 실패했습니다.');
    }
  };
  return (
    <AuthShell title="로그인">
      <form onSubmit={submit} className="space-y-4">
        <Input name="email" type="email" placeholder="이메일" required />
        <Input name="password" type="password" placeholder="비밀번호" required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full">로그인</Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        계정이 없으신가요?{' '}
        <Link className="font-semibold text-brand-600" to="/register">
          회원가입
        </Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));
    if (password !== String(form.get('passwordConfirm'))) {
      setError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await register(String(form.get('email')), password, String(form.get('name')), {
        name: String(form.get('companyName')),
        businessNumber: String(form.get('businessNumber')),
        industry: String(form.get('industry')),
        region: String(form.get('region')),
        description: String(form.get('description')),
        website: String(form.get('website')),
        collaborationTypes: [String(form.get('collaborationType')) as CollaborationType],
      });
      navigate('/my-company');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '회원가입에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <AuthShell title="새 회사 등록">
      <p className="mb-5 text-sm text-slate-500">
        대표자가 아니라도 회사 워크스페이스를 개설할 수 있습니다.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm font-bold">담당자 계정</p>
        <Input name="name" placeholder="담당자 이름" required />
        <Input name="email" type="email" autoComplete="email" placeholder="이메일" required />
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          placeholder="비밀번호 (6자 이상)"
          required
        />
        <Input
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          minLength={6}
          placeholder="비밀번호 확인"
          required
        />
        <p className="pt-2 text-sm font-bold">회사 정보</p>
        <Input name="companyName" placeholder="회사명" required />
        <Input name="businessNumber" placeholder="사업자등록번호 (숫자 10자리)" required />
        <Select name="industry" defaultValue="" required>
          <option value="" disabled>
            업종 선택
          </option>
          {industryGroups.map((group) => (
            <optgroup key={group.code} label={group.label}>
              {group.industries.map((industry) => (
                <option key={industry}>{industry}</option>
              ))}
            </optgroup>
          ))}
        </Select>
        <Select name="region" defaultValue="" required>
          <option value="" disabled>
            지역 선택
          </option>
          {regions.map((region) => (
            <option key={region}>{region}</option>
          ))}
        </Select>
        <Textarea name="description" placeholder="회사 소개" required />
        <Input name="website" placeholder="웹사이트 (선택)" />
        <Select name="collaborationType" defaultValue="SUPPLIER">
          <option value="SUPPLIER">공급사</option>
          <option value="BUYER">구매사</option>
          <option value="OEM">OEM</option>
          <option value="ODM">ODM</option>
          <option value="PARTNER">파트너</option>
        </Select>
        <p className="text-xs leading-5 text-slate-500">
          가입 후 인증 메일이 발송됩니다. 사업자등록번호는 중복 등록할 수 없습니다.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={submitting}>
          {submitting ? '회사 계정을 만드는 중…' : '회사 계정 만들기'}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        이미 등록된 회사의 담당자인가요?{' '}
        <Link className="font-semibold text-brand-600" to="/join-company">
          회사에 합류하기
        </Link>
      </p>
    </AuthShell>
  );
}

export function JoinCompanyPage() {
  const { joinCompany } = useAuth();
  const { companies, loading } = useCompanies();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));
    if (password !== String(form.get('passwordConfirm'))) {
      setError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await joinCompany(String(form.get('email')), password, String(form.get('name')), {
        companyId: String(form.get('companyId')),
        department: String(form.get('department')),
        jobTitle: String(form.get('jobTitle')),
        requestedRole: String(form.get('requestedRole')) as 'PURCHASER' | 'SALES' | 'VIEWER',
      });
      navigate('/dashboard');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '합류 요청에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <AuthShell title="기존 회사에 합류">
      <p className="mb-5 text-sm leading-6 text-slate-500">
        회사 관리자 승인 후 회사 워크스페이스와 협업 기능을 이용할 수 있습니다.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm font-bold">개인 계정</p>
        <Input name="name" placeholder="이름" required />
        <Input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="업무용 이메일"
          required
        />
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          placeholder="비밀번호 (6자 이상)"
          required
        />
        <Input
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          minLength={6}
          placeholder="비밀번호 확인"
          required
        />
        <p className="pt-2 text-sm font-bold">소속 요청 정보</p>
        <Select name="companyId" defaultValue="" required disabled={loading || !companies.length}>
          <option value="" disabled>
            {loading
              ? '회사 목록을 불러오는 중…'
              : companies.length
                ? '회사를 선택하세요'
                : '등록된 회사가 없습니다'}
          </option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name} · {company.region}
            </option>
          ))}
        </Select>
        <Input name="department" placeholder="부서 (예: 구매팀)" required />
        <Input name="jobTitle" placeholder="직책·직무 (예: 구매 담당)" required />
        <Select name="requestedRole" defaultValue="VIEWER">
          <option value="VIEWER">조회 전용</option>
          <option value="PURCHASER">구매 담당</option>
          <option value="SALES">영업 담당</option>
        </Select>
        <p className="text-xs leading-5 text-slate-500">
          회사 관리자가 요청을 승인하기 전에는 회사 데이터에 접근할 수 없습니다.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={submitting || !companies.length}>
          {submitting ? '합류 요청을 보내는 중…' : '회사 합류 요청 보내기'}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        등록되지 않은 회사인가요?{' '}
        <Link className="font-semibold text-brand-600" to="/register">
          새 회사 등록
        </Link>
      </p>
    </AuthShell>
  );
}
