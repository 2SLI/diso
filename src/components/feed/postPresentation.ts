import type { CompanyPost, InquiryType, PostType } from '../../types/feed';

export const postLabels: Record<PostType, string> = {
  SUPPLY: '공급합니다',
  DEMAND: '찾습니다',
  CAPACITY: '생산 여력',
  NEWS: '기업 소식',
};
export function postAction(post: CompanyPost): { label: string; type: InquiryType } {
  if (post.type === 'SUPPLY') return { label: '견적 요청', type: 'QUOTE_REQUEST' };
  if (post.type === 'DEMAND') return { label: '공급 제안', type: 'SUPPLY_PROPOSAL' };
  if (post.type === 'CAPACITY') return { label: '협업 제안', type: 'COLLABORATION' };
  return { label: '미팅 요청', type: 'MEETING' };
}
