import { useState, type FormEvent } from 'react';
import { Building2, Plus } from 'lucide-react';
import type { Company } from '../../types/company';
import type { PostType } from '../../types/feed';
import { createPost } from '../../services/feedService';
import { Button, Input, Select, Textarea } from '../common/ui';
import { postLabels } from './postPresentation';

export function PostComposer({
  company,
  userId,
  onCreated,
}: {
  company: Company;
  userId: string;
  onCreated: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage('');
    try {
      await createPost(company, userId, {
        type: String(data.get('type')) as PostType,
        title: String(data.get('title')),
        body: String(data.get('body')),
      });
      form.reset();
      setOpen(false);
      await onCreated();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '게시글을 등록하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Building2 size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{company.name}</p>
          <p className="text-xs text-slate-500">회사 이름으로 새로운 소식을 전하세요</p>
        </div>
        <Button onClick={() => setOpen((value) => !value)} className="gap-1">
          <Plus size={16} />
          글쓰기
        </Button>
      </div>
      {open && (
        <form
          onSubmit={(event) => void submit(event)}
          className="mt-5 space-y-3 border-t border-slate-100 pt-5"
        >
          <label className="block text-sm font-semibold">
            게시글 유형
            <Select name="type" className="mt-2" required>
              {(Object.entries(postLabels) as [PostType, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label className="block text-sm font-semibold">
            제목
            <Input
              name="title"
              className="mt-2"
              minLength={3}
              maxLength={100}
              required
              placeholder="예: 이번 달 생산 가능 물량이 있습니다"
            />
          </label>
          <label className="block text-sm font-semibold">
            내용
            <Textarea
              name="body"
              className="mt-2 min-h-36"
              minLength={10}
              maxLength={2000}
              required
              placeholder="제품 규격, 수량, 납기, 협업 조건 등을 구체적으로 적어주세요."
            />
          </label>
          <p className="text-xs text-slate-500">
            게시물은 공개됩니다. 견적 단가나 비공개 연락처는 문의에서 주고받으세요.
          </p>
          <Button type="submit" disabled={busy}>
            {busy ? '등록 중…' : '게시글 등록'}
          </Button>
        </form>
      )}
      {message && (
        <p role="alert" className="mt-3 text-sm text-rose-600">
          {message}
        </p>
      )}
    </section>
  );
}
