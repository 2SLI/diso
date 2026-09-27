import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, FileText, Search } from 'lucide-react';
import { PostCard } from '../components/feed/PostCard';
import { PostComposer } from '../components/feed/PostComposer';
import { InquiryDialog } from '../components/feed/InquiryDialog';
import { Button, EmptyState } from '../components/common/ui';
import { useFeed } from '../hooks/useFeed';
import { useAuth } from '../hooks/useAuth';
import { useMyCompany } from '../hooks/useMyCompany';
import {
  getFollowedCompanyIds,
  getSavedCompanyIds,
  setFollowingCompany,
  setSavedCompany,
} from '../services/feedService';
import { requestConnection } from '../services/connectionService';
import type { CompanyPost } from '../types/feed';

export default function FeedPage() {
  const { user } = useAuth();
  const { company } = useMyCompany(user?.uid);
  const { posts, loading, error, refresh } = useFeed();
  const [selected, setSelected] = useState<CompanyPost | null>(null);
  const [followed, setFollowed] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [onlyFollowing, setOnlyFollowing] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!user) return;
    let active = true;
    void Promise.all([getFollowedCompanyIds(user.uid), getSavedCompanyIds(user.uid)])
      .then(([follows, bookmarks]) => {
        if (active) {
          setFollowed(follows);
          setSaved(bookmarks);
        }
      })
      .catch(() => {
        if (active) setNotice('팔로우 목록을 불러오지 못했습니다.');
      });
    return () => {
      active = false;
    };
  }, [user]);
  async function toggleFollow(post: CompanyPost) {
    if (!user) {
      setNotice('팔로우하려면 로그인해 주세요.');
      return;
    }
    const follow = !followed.includes(post.companyId);
    try {
      await setFollowingCompany(user.uid, post.companyId, follow);
      setFollowed((ids) =>
        follow ? [...ids, post.companyId] : ids.filter((id) => id !== post.companyId),
      );
      setNotice('');
    } catch {
      setNotice('팔로우 상태를 변경하지 못했습니다.');
    }
  }
  async function toggleSave(post: CompanyPost) {
    if (!user) {
      setNotice('업체를 저장하려면 로그인해 주세요.');
      return;
    }
    const save = !saved.includes(post.companyId);
    try {
      await setSavedCompany(user.uid, post.companyId, save);
      setSaved((ids) =>
        save ? [...ids, post.companyId] : ids.filter((id) => id !== post.companyId),
      );
      setNotice(save ? '업체를 저장했습니다.' : '저장을 해제했습니다.');
    } catch {
      setNotice('업체 저장 상태를 변경하지 못했습니다.');
    }
  }
  async function sendCard(post: CompanyPost) {
    if (!user) {
      setNotice('명함을 보내려면 로그인해 주세요.');
      return;
    }
    if (!company) {
      setNotice('회사 소속 승인이 필요합니다.');
      return;
    }
    try {
      await requestConnection(company.id, post.companyId, user.uid);
      setNotice(`${post.companyName}에 협업 요청을 보냈습니다.`);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : '협업 요청에 실패했습니다.');
    }
  }
  const visible = onlyFollowing ? posts.filter((post) => followed.includes(post.companyId)) : posts;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wide text-brand-600">PARTNERBASE FEED</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">기업 활동</h1>
          <p className="mt-2 text-sm text-slate-600">
            실제 등록 기업의 공급 소식과 협업 기회를 살펴보세요.
          </p>
        </div>
        <Link to="/companies">
          <Button variant="secondary" className="gap-2">
            <Search size={16} />
            기업 찾기
          </Button>
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-4">
          {user && company ? (
            <PostComposer company={company} userId={user.uid} onCreated={refresh} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
              {user
                ? '회사 소속 승인이 완료되면 기업 이름으로 글을 쓸 수 있습니다.'
                : '로그인하고 회사 프로필을 연결하면 글을 작성하고 문의할 수 있습니다.'}{' '}
              <Link
                className="ml-1 font-semibold text-brand-600"
                to={user ? '/join-company' : '/login'}
              >
                시작하기 →
              </Link>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant={onlyFollowing ? 'secondary' : 'primary'}
              onClick={() => setOnlyFollowing(false)}
            >
              전체 소식
            </Button>
            {user && (
              <Button
                variant={onlyFollowing ? 'primary' : 'secondary'}
                onClick={() => setOnlyFollowing(true)}
              >
                팔로잉
              </Button>
            )}
          </div>
          {notice && (
            <p role="status" className="text-sm text-rose-600">
              {notice}
            </p>
          )}
          {loading ? (
            <p role="status" className="py-12 text-center text-sm text-slate-500">
              기업 활동을 불러오는 중…
            </p>
          ) : error ? (
            <EmptyState title="피드를 불러올 수 없습니다" description={error} />
          ) : visible.length ? (
            visible.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                ownCompany={company?.id === post.companyId}
                following={followed.includes(post.companyId)}
                onFollow={(item) => void toggleFollow(item)}
                onAction={setSelected}
                onConnection={(item) => void sendCard(item)}
                onSave={(item) => void toggleSave(item)}
                saved={saved.includes(post.companyId)}
              />
            ))
          ) : (
            <>
              <EmptyState
                title={
                  onlyFollowing
                    ? '팔로우한 기업의 게시물이 없습니다'
                    : '아직 등록된 기업 소식이 없습니다'
                }
                description={
                  onlyFollowing
                    ? '관심 있는 기업을 팔로우해 보세요.'
                    : '기업 프로필을 등록하고 첫 공급·협업 소식을 전해보세요.'
                }
              />
              {!onlyFollowing && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-bold text-brand-600">게시글 작성 예시</p>
                  <p className="mt-1 text-sm text-slate-500">
                    아래는 실제 기업 게시물이 아닌 작성 안내입니다.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      ['공급합니다', '재고·규격·납품 가능일을 알려주세요'],
                      ['찾습니다', '필요한 제품·수량·인증 조건을 적어주세요'],
                      ['생산 여력', '사용 가능한 설비와 생산 일정을 소개하세요'],
                      ['기업 소식', '새로운 기술·인증·사업 소식을 전하세요'],
                    ].map(([title, description]) => (
                      <div key={title} className="rounded-xl bg-slate-50 p-4">
                        <p className="font-semibold">{title}</p>
                        <p className="mt-1 text-sm text-slate-500">{description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-bold">어떤 소식을 올릴 수 있나요?</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="flex gap-2">
                <BriefcaseBusiness size={17} className="shrink-0 text-brand-600" />
                공급 가능한 제품·재고·생산 여력
              </p>
              <p className="flex gap-2">
                <FileText size={17} className="shrink-0 text-brand-600" />
                찾는 부품·외주업체·협력 분야
              </p>
            </div>
            <Link
              to="/rfqs"
              className="mt-5 flex items-center gap-1 text-sm font-semibold text-brand-600"
            >
              공개 RFQ 보기 <ArrowRight size={15} />
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
            게시물은 등록된 기업의 활동입니다. 외부 공공데이터 기업은 게시물을 작성하지 않습니다.
          </div>
        </aside>
      </div>
      <InquiryDialog
        key={selected?.id ?? 'empty'}
        post={selected}
        company={company}
        userId={user?.uid}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
