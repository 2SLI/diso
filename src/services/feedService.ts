import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Company } from '../types/company';
import type { CompanyPost, InquiryType, PostInquiry, PostType } from '../types/feed';

function store() {
  if (!db) throw new Error('Firebase 연결 설정이 필요합니다.');
  return db;
}
const toPost = (id: string, data: Record<string, unknown>) => ({ id, ...data }) as CompanyPost;
const toInquiry = (id: string, data: Record<string, unknown>) => ({ id, ...data }) as PostInquiry;
export async function getRecentPosts(): Promise<CompanyPost[]> {
  const result = await getDocs(
    query(collection(store(), 'companyPosts'), orderBy('createdAt', 'desc'), limit(30)),
  );
  return result.docs.map((snapshot) => toPost(snapshot.id, snapshot.data()));
}
export async function getCompanyPosts(companyId: string): Promise<CompanyPost[]> {
  const result = await getDocs(
    query(collection(store(), 'companyPosts'), where('companyId', '==', companyId), limit(30)),
  );
  return result.docs
    .map((snapshot) => toPost(snapshot.id, snapshot.data()))
    .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
}
export async function createPost(
  company: Company,
  authorId: string,
  input: { type: PostType; title: string; body: string },
) {
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 3 || title.length > 100 || body.length < 10 || body.length > 2000)
    throw new Error('제목은 3~100자, 내용은 10~2,000자로 작성하세요.');
  return (
    await addDoc(collection(store(), 'companyPosts'), {
      companyId: company.id,
      companyName: company.name,
      companyIndustry: company.industry,
      companyRegion: company.region,
      authorId,
      type: input.type,
      title,
      body,
      createdAt: serverTimestamp(),
    })
  ).id;
}
export async function createPostInquiry(
  post: CompanyPost,
  senderCompany: Company,
  userId: string,
  type: InquiryType,
  message: string,
  quantity?: number,
) {
  if (post.companyId === senderCompany.id)
    throw new Error('자기 회사 글에는 문의를 보낼 수 없습니다.');
  const text = message.trim();
  if (text.length < 10 || text.length > 1000)
    throw new Error('문의 내용을 10~1,000자로 작성하세요.');
  if (quantity !== undefined && (!Number.isSafeInteger(quantity) || quantity < 1))
    throw new Error('수량을 다시 확인하세요.');
  const isDemand = post.type === 'DEMAND';
  const buyerCompanyId = isDemand ? post.companyId : senderCompany.id;
  const supplierCompanyId = isDemand ? senderCompany.id : post.companyId;
  return (
    await addDoc(collection(store(), 'postInquiries'), {
      postId: post.id,
      postTitle: post.title,
      buyerCompanyId,
      buyerCompanyName: isDemand ? post.companyName : senderCompany.name,
      supplierCompanyId,
      supplierCompanyName: isDemand ? senderCompany.name : post.companyName,
      senderCompanyId: senderCompany.id,
      type,
      ...(quantity === undefined ? {} : { quantity }),
      message: text,
      status: 'PENDING',
      createdBy: userId,
      createdAt: serverTimestamp(),
    })
  ).id;
}
export async function getCompanyInquiries(companyId: string): Promise<PostInquiry[]> {
  const [buyer, supplier] = await Promise.all([
    getDocs(
      query(
        collection(store(), 'postInquiries'),
        where('buyerCompanyId', '==', companyId),
        limit(50),
      ),
    ),
    getDocs(
      query(
        collection(store(), 'postInquiries'),
        where('supplierCompanyId', '==', companyId),
        limit(50),
      ),
    ),
  ]);
  const unique = new Map(
    [...buyer.docs, ...supplier.docs].map((snapshot) => [
      snapshot.id,
      toInquiry(snapshot.id, snapshot.data()),
    ]),
  );
  return [...unique.values()].sort(
    (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0),
  );
}
export async function isFollowingCompany(uid: string, companyId: string) {
  return (await getDoc(doc(store(), 'companyFollows', `${uid}_${companyId}`))).exists();
}
export async function setFollowingCompany(uid: string, companyId: string, follow: boolean) {
  const ref = doc(store(), 'companyFollows', `${uid}_${companyId}`);
  if (follow) await setDoc(ref, { userId: uid, companyId, createdAt: serverTimestamp() });
  else await deleteDoc(ref);
}
export async function getFollowedCompanyIds(uid: string): Promise<string[]> {
  const result = await getDocs(
    query(collection(store(), 'companyFollows'), where('userId', '==', uid), limit(100)),
  );
  return result.docs.map((snapshot) => String(snapshot.data().companyId));
}

export async function getSavedCompanyIds(uid: string): Promise<string[]> {
  const result = await getDocs(
    query(collection(store(), 'companyBookmarks'), where('userId', '==', uid), limit(100)),
  );
  return result.docs.map((snapshot) => String(snapshot.data().companyId));
}
export async function setSavedCompany(uid: string, companyId: string, save: boolean) {
  const ref = doc(store(), 'companyBookmarks', `${uid}_${companyId}`);
  if (save) await setDoc(ref, { userId: uid, companyId, createdAt: serverTimestamp() });
  else await deleteDoc(ref);
}
