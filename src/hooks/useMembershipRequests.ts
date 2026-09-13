import { useEffect, useState } from 'react';
import { getMembershipRequests, reviewMembershipRequest } from '../services/membershipService';
import type { MembershipRequest } from '../types/membershipRequest';

export function useMembershipRequests(companyId: string | undefined) {
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!companyId) return;
    let active = true;
    void getMembershipRequests(companyId)
      .then((result) => {
        if (active) {
          setRequests(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError('가입 요청을 불러오지 못했습니다.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [companyId]);
  const review = async (
    request: MembershipRequest,
    reviewerId: string,
    status: 'APPROVED' | 'REJECTED',
  ) => {
    await reviewMembershipRequest(request, reviewerId, status);
    setRequests((current) => current.filter((item) => item.id !== request.id));
  };
  return { requests, loading, error, review };
}
