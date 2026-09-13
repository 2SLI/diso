import { useState, type FormEvent, type ReactNode } from 'react';
import { Badge, Button, Card, EmptyState, Input, Modal, Textarea } from '../components/common/ui';
import { useAuth } from '../hooks/useAuth';
import { useConnections } from '../hooks/useConnections';
import { useMyCompany } from '../hooks/useMyCompany';
import { useQuotes } from '../hooks/useQuotes';
import { useRfqs } from '../hooks/useRfqs';
import { createQuote } from '../services/quoteService';
import { createRfq } from '../services/rfqService';
import type { Rfq } from '../types/rfq';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}
function CompanyRequired({ title, description }: { title: string; description: string }) {
  return (
    <>
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="mt-7">
        <EmptyState title="회사 정보가 필요합니다" description={description} />
      </div>
    </>
  );
}

export function RfqPage() {
  const { user } = useAuth();
  const { company } = useMyCompany(user?.uid);
  const { rfqs, loading, error, refresh } = useRfqs(company?.id);
  const [status, setStatus] = useState('');
  const [selectedRfq, setSelectedRfq] = useState<Rfq | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !company) return;
    const form = new FormData(event.currentTarget);
    setStatus('등록 중…');
    try {
      await createRfq({
        buyerCompanyId: company.id,
        title: String(form.get('title')),
        description: String(form.get('description')),
        category: String(form.get('category')),
        quantity: Number(form.get('quantity')) || undefined,
        desiredDeliveryDate: String(form.get('desiredDeliveryDate')) || undefined,
        region: String(form.get('region')) || undefined,
        attachments: [],
        status: 'OPEN',
        isAnonymous: form.get('isAnonymous') === 'on',
        createdBy: user.uid,
      });
      event.currentTarget.reset();
      await refresh();
      setStatus('RFQ를 등록했습니다.');
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'RFQ 등록에 실패했습니다.');
    }
  };
  const submitQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !company || !selectedRfq) return;
    const form = new FormData(event.currentTarget);
    const unitPrice = Number(form.get('unitPrice'));
    const quantity = Number(form.get('quantity'));
    try {
      await createQuote({
        rfqId: selectedRfq.id,
        buyerCompanyId: selectedRfq.buyerCompanyId,
        supplierCompanyId: company.id,
        unitPrice,
        quantity,
        totalPrice: unitPrice * quantity,
        deliveryDate: String(form.get('deliveryDate')) || undefined,
        paymentTerms: String(form.get('paymentTerms')) || undefined,
        message: String(form.get('message')) || undefined,
        attachments: [],
        status: 'SUBMITTED',
        createdBy: user.uid,
      });
      setSelectedRfq(null);
      setStatus('비공개 견적을 제출했습니다.');
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : '견적 제출에 실패했습니다.');
    }
  };
  if (!company)
    return (
      <CompanyRequired
        title="RFQ"
        description="RFQ를 등록하려면 기업 프로필을 먼저 등록해주세요."
      />
    );
  return (
    <>
      <h1 className="text-3xl font-bold">RFQ</h1>
      <p className="mt-2 text-slate-600">
        필요한 제품과 서비스를 등록하고 적합한 공급사를 찾아보세요.
      </p>
      <Card className="mt-7">
        <h2 className="text-lg font-bold">새 견적 요청</h2>
        <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="RFQ 제목">
            <Input name="title" placeholder="예: 산업용 전원 모듈 제작" required />
          </Field>
          <Field label="카테고리">
            <Input name="category" placeholder="예: 전자부품" required />
          </Field>
          <Field label="수량">
            <Input name="quantity" type="number" min="1" placeholder="선택" />
          </Field>
          <Field label="희망 납품일">
            <Input name="desiredDeliveryDate" type="date" />
          </Field>
          <Field label="납품 지역">
            <Input name="region" placeholder="예: 경기 화성" />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input name="isAnonymous" type="checkbox" /> 회사명 비공개로 요청
          </label>
          <div className="md:col-span-2">
            <Field label="요청 상세">
              <Textarea
                name="description"
                className="min-h-28"
                placeholder="규격, 품질 기준, 일정 등 필요한 내용을 작성하세요."
                required
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">RFQ 등록</Button>
            {status && <span className="ml-3 text-sm text-slate-500">{status}</span>}
          </div>
        </form>
      </Card>
      <section className="mt-8">
        <h2 className="text-xl font-bold">공개 RFQ</h2>
        {loading ? (
          <p className="mt-5 text-sm text-slate-500">RFQ를 불러오는 중…</p>
        ) : error ? (
          <div className="mt-5">
            <EmptyState title="RFQ를 불러올 수 없습니다" description={error} />
          </div>
        ) : rfqs.length ? (
          <div className="mt-5 space-y-3">
            {rfqs.map((rfq) => (
              <Card key={rfq.id}>
                <div className="flex flex-col justify-between gap-3 md:flex-row">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{rfq.title}</h3>
                      <Badge>{rfq.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{rfq.description}</p>
                    <p className="mt-3 text-xs text-slate-400">
                      {rfq.category} · {rfq.region || '지역 미정'} ·{' '}
                      {rfq.quantity ? `${rfq.quantity}개` : '수량 협의'}
                    </p>
                  </div>
                  {rfq.buyerCompanyId !== company.id && (
                    <Button variant="secondary" onClick={() => setSelectedRfq(rfq)}>
                      견적 제출
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState title="공개된 RFQ가 없습니다" description="첫 견적 요청을 등록해보세요." />
          </div>
        )}
      </section>
      <Modal
        open={Boolean(selectedRfq)}
        title="비공개 견적 제출"
        onClose={() => setSelectedRfq(null)}
      >
        <form onSubmit={submitQuote} className="space-y-4">
          <p className="text-sm text-slate-500">
            견적 단가는 구매사와 공급사만 열람할 수 있습니다.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="단가">
              <Input name="unitPrice" type="number" min="0" required />
            </Field>
            <Field label="수량">
              <Input
                name="quantity"
                type="number"
                min="1"
                defaultValue={selectedRfq?.quantity}
                required
              />
            </Field>
          </div>
          <Field label="납품 가능일">
            <Input name="deliveryDate" type="date" />
          </Field>
          <Field label="결제 조건">
            <Input name="paymentTerms" placeholder="예: 월말 마감 후 30일" />
          </Field>
          <Field label="제안 메시지">
            <Textarea name="message" placeholder="견적 조건과 추가 안내를 입력하세요." />
          </Field>
          <Button type="submit" className="w-full">
            견적 제출
          </Button>
        </form>
      </Modal>
    </>
  );
}

export function QuotesPage() {
  const { user } = useAuth();
  const { company } = useMyCompany(user?.uid);
  const { quotes, loading, error, changeStatus } = useQuotes(company?.id);
  const [message, setMessage] = useState('');
  if (!company)
    return (
      <CompanyRequired title="견적" description="견적을 보려면 기업 프로필을 먼저 등록해주세요." />
    );
  const received = quotes
    .filter((quote) => quote.buyerCompanyId === company.id)
    .sort((left, right) => left.totalPrice - right.totalPrice);
  const sent = quotes.filter((quote) => quote.supplierCompanyId === company.id);
  const update = async (quoteId: string, status: 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED') => {
    try {
      await changeStatus(quoteId, status);
      setMessage('견적 상태를 변경했습니다.');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : '상태 변경에 실패했습니다.');
    }
  };
  const QuoteItem = ({
    quote,
    receivedQuote,
  }: {
    quote: (typeof quotes)[number];
    receivedQuote: boolean;
  }) => (
    <Card>
      <div className="flex flex-col justify-between gap-3 md:flex-row">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold">{receivedQuote ? '받은 견적' : '보낸 견적'}</h2>
            <Badge>{quote.status}</Badge>
            {receivedQuote && received[0]?.id === quote.id && <Badge>최저가</Badge>}
          </div>
          <p className="mt-2 text-sm text-slate-600">{quote.message || '메시지 없음'}</p>
          <p className="mt-3 text-xs text-slate-400">
            납품일: {quote.deliveryDate || '협의'} · 결제 조건: {quote.paymentTerms || '협의'}
          </p>
          {receivedQuote &&
            ['SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'REVISED'].includes(
              quote.status,
            ) && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => void update(quote.id, 'UNDER_REVIEW')}>
                  검토 중
                </Button>
                <Button onClick={() => void update(quote.id, 'ACCEPTED')}>수락</Button>
                <Button variant="secondary" onClick={() => void update(quote.id, 'REJECTED')}>
                  거절
                </Button>
              </div>
            )}
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">총 견적</p>
          <p className="mt-1 text-xl font-bold">{quote.totalPrice.toLocaleString()}원</p>
          <p className="mt-1 text-xs text-slate-400">
            단가 {quote.unitPrice.toLocaleString()}원 × {quote.quantity}
          </p>
        </div>
      </div>
    </Card>
  );
  return (
    <>
      <h1 className="text-3xl font-bold">견적</h1>
      <p className="mt-2 text-slate-600">우리 회사가 받은 견적과 제출한 비공개 견적입니다.</p>
      {message && <p className="mt-3 text-sm text-brand-600">{message}</p>}
      {loading ? (
        <p className="mt-7 text-sm text-slate-500">견적을 불러오는 중…</p>
      ) : error ? (
        <div className="mt-7">
          <EmptyState title="견적을 불러올 수 없습니다" description={error} />
        </div>
      ) : quotes.length ? (
        <div className="mt-7 space-y-8">
          {received.length > 0 && (
            <section>
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-xl font-bold">받은 견적 비교</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    총 견적 금액이 낮은 순으로 정렬됩니다.
                  </p>
                </div>
                <Badge>{received.length}건</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {received.map((quote) => (
                  <QuoteItem key={quote.id} quote={quote} receivedQuote />
                ))}
              </div>
            </section>
          )}
          {sent.length > 0 && (
            <section>
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-xl font-bold">보낸 견적</h2>
                  <p className="mt-1 text-sm text-slate-500">구매사의 검토 상태를 확인하세요.</p>
                </div>
                <Badge>{sent.length}건</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {sent.map((quote) => (
                  <QuoteItem key={quote.id} quote={quote} receivedQuote={false} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="mt-7">
          <EmptyState
            title="견적이 없습니다"
            description="공개 RFQ에서 견적을 제출하거나 협력사 견적을 기다려보세요."
          />
        </div>
      )}
    </>
  );
}

export function ConnectionsPage() {
  const { user } = useAuth();
  const { company } = useMyCompany(user?.uid);
  const { connections, loading, error, changeStatus } = useConnections(company?.id);
  if (loading)
    return (
      <>
        <h1 className="text-3xl font-bold">거래처</h1>
        <p className="mt-7 text-sm text-slate-500">거래처 정보를 불러오는 중…</p>
      </>
    );
  if (!company)
    return <CompanyRequired title="거래처" description="기업 프로필을 먼저 등록해주세요." />;
  return (
    <>
      <h1 className="text-3xl font-bold">거래처</h1>
      <p className="mt-2 text-slate-600">받은 협업 요청과 연결된 거래처를 관리하세요.</p>
      {error ? (
        <div className="mt-7">
          <EmptyState title="거래처를 불러올 수 없습니다" description={error} />
        </div>
      ) : connections.length ? (
        <div className="mt-7 space-y-3">
          {connections.map((connection) => {
            const incoming = connection.companyBId === company.id;
            return (
              <Card
                key={connection.id}
                className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-bold">{incoming ? '받은 협업 요청' : '보낸 협업 요청'}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    상대 회사 ID: {incoming ? connection.companyAId : connection.companyBId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{connection.status}</Badge>
                  {incoming && connection.status === 'PENDING' && (
                    <>
                      <Button onClick={() => void changeStatus(connection.id, 'CONNECTED')}>
                        수락
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => void changeStatus(connection.id, 'BLOCKED')}
                      >
                        차단
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="mt-7">
          <EmptyState
            title="아직 거래처가 없습니다"
            description="기업 상세 페이지에서 협업 요청을 보내보세요."
          />
        </div>
      )}
    </>
  );
}
