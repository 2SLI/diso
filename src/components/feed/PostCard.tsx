import {
  ArrowUpRight,
  Bookmark,
  Building2,
  CalendarDays,
  FileText,
  Handshake,
  MapPin,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CompanyPost } from '../../types/feed';
import { Button } from '../common/ui';
import { postAction, postLabels } from './postPresentation';
export function PostCard({
  post,
  onAction,
  onFollow,
  following,
  ownCompany,
  onConnection,
  onSave,
  saved,
}: {
  post: CompanyPost;
  onAction?: (post: CompanyPost) => void;
  onFollow?: (post: CompanyPost) => void;
  following?: boolean;
  ownCompany?: boolean;
  onConnection?: (post: CompanyPost) => void;
  onSave?: (post: CompanyPost) => void;
  saved?: boolean;
}) {
  const action = postAction(post);
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Building2 size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <Link to={`/companies/${post.companyId}`} className="font-bold hover:text-brand-600">
            {post.companyName}
          </Link>
          <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-slate-500">
            {post.companyIndustry}
            <span>·</span>
            <MapPin size={12} />
            {post.companyRegion}
          </p>
        </div>
        {onFollow && !ownCompany && (
          <button
            type="button"
            className="shrink-0 text-sm font-semibold text-brand-600"
            onClick={() => onFollow(post)}
          >
            {following ? '팔로잉' : '+ 팔로우'}
          </button>
        )}
      </div>
      <div className="px-5 py-5">
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
          {postLabels[post.type]}
        </span>
        <h3 className="mt-3 text-lg font-bold leading-snug">{post.title}</h3>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
          {post.body}
        </p>
        <p className="mt-4 flex items-center gap-1 text-xs text-slate-400">
          <CalendarDays size={13} />
          {post.createdAt?.toDate().toLocaleDateString('ko-KR') ?? '방금 전'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-3">
        <Link to={`/companies/${post.companyId}`}>
          <Button variant="secondary" className="gap-1">
            <ArrowUpRight size={15} /> 기업 보기
          </Button>
        </Link>
        {onAction && !ownCompany && (
          <Button onClick={() => onAction(post)} className="gap-1">
            <FileText size={15} />
            {action.label}
          </Button>
        )}
        {onAction && !ownCompany && post.type !== 'NEWS' && (
          <Button variant="ghost" onClick={() => onAction(post)} className="gap-1">
            <Handshake size={15} />
            미팅·협업
          </Button>
        )}
        {onConnection && !ownCompany && (
          <Button variant="ghost" className="gap-1" onClick={() => onConnection(post)}>
            <Handshake size={15} />
            명함 보내기
          </Button>
        )}
        {onSave && !ownCompany && (
          <Button variant="ghost" className="gap-1" onClick={() => onSave(post)}>
            <Bookmark size={15} className={saved ? 'fill-current' : ''} />
            {saved ? '저장됨' : '저장'}
          </Button>
        )}
      </div>
    </article>
  );
}
