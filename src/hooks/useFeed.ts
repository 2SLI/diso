import { useCallback, useEffect, useState } from 'react';
import { getCompanyPosts, getRecentPosts } from '../services/feedService';
import type { CompanyPost } from '../types/feed';

export function useFeed(companyId?: string) {
  const [posts, setPosts] = useState<CompanyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setPosts(companyId ? await getCompanyPosts(companyId) : await getRecentPosts());
      setError('');
    } catch {
      setError('기업 소식을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);
  useEffect(() => {
    let active = true;
    const load = companyId ? getCompanyPosts(companyId) : getRecentPosts();
    void load
      .then((result) => {
        if (active) {
          setPosts(result);
          setError('');
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError('기업 소식을 불러오지 못했습니다.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [companyId]);
  return { posts, loading, error, refresh };
}
