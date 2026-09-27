import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Company } from '../../types/company';
import type { CompanyPost, InquiryType } from '../../types/feed';
import { createPostInquiry } from '../../services/feedService';
import { Button, Input, Modal, Select, Textarea } from '../common/ui';
import { postAction } from './postPresentation';

export function InquiryDialog({
  post,
  company,
  userId,
  onClose,
}: {
  post: CompanyPost | null;
  company: Company | null;
  userId?: string;
  onClose: () => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!post) return null;
  const action = postAction(post);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!post || !company || !userId || busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      await createPostInquiry(
        post,
        company,
        userId,
        String(data.get('type')) as InquiryType,
        String(data.get('message')),
        data.get('quantity') ? Number(data.get('quantity')) : undefined,
      );
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '문의 전송에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open title={`${post.companyName}에 문의`} onClose={onClose}>
      {!userId ? (
        <p className="text-sm">
          문의하려면{' '}
          <Link className="font-bold text-brand-600" to="/login">
            로그인
          </Link>
          이 필요합니다.
        </p>
      ) : !company ? (
        <p className="text-sm">
          문의하려면{' '}
          <Link className="font-bold text-brand-600" to="/join-company">
            회사 등록 또는 소속 승인
          </Link>
          이 필요합니다.
        </p>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{post.title}</p>
          <label className="block text-sm font-semibold">
            문의 유형
            <Select name="type" defaultValue={action.type} className="mt-2">
              <option value={action.type}>{action.label}</option>
              <option value="MEETING">미팅 요청</option>
              <option value="COLLABORATION">협업 제안</option>
            </Select>
          </label>
          {post.type !== 'NEWS' && (
            <label className="block text-sm font-semibold">
              수량 (선택)
              <Input type="number" name="quantity" min={1} className="mt-2" placeholder="예: 100" />
            </label>
          )}
          <label className="block text-sm font-semibold">
            요청 내용
            <Textarea
              name="message"
              className="mt-2 min-h-32"
              required
              minLength={10}
              maxLength={1000}
              placeholder="수량, 일정, 필요한 조건을 알려주세요."
            />
          </label>
          <p className="text-xs text-slate-500">
            문의 내용은 두 회사의 소속 사용자만 열람할 수 있습니다. 금액은 공개 피드에 표시되지
            않습니다.
          </p>
          {error && (
            <p role="alert" className="text-sm text-rose-600">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? '보내는 중…' : '비공개 문의 보내기'}
          </Button>
        </form>
      )}
    </Modal>
  );
}
