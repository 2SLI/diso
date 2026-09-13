import { useEffect, useState } from 'react';
import { getCompany, updateCompany } from '../services/companyService';
import { getUserProfile } from '../services/userService';
import type { Company } from '../types/company';
import type { AppUser } from '../types/user';

export function useMyCompany(uid: string | undefined) {
  const [company, setCompany] = useState<Company | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!uid) return;
    let active = true;
    void (async () => {
      try {
        const user = await getUserProfile(uid);
        const result = user?.companyId ? await getCompany(user.companyId) : null;
        if (active) {
          setUserProfile(user);
          setCompany(result);
          setError(result ? null : '연결된 회사 프로필이 없습니다.');
          setLoading(false);
        }
      } catch {
        if (active) {
          setError('회사 정보를 불러오지 못했습니다.');
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [uid]);
  const save = async (changes: Partial<Company>) => {
    if (!company) throw new Error('저장할 회사 정보가 없습니다.');
    await updateCompany(company.id, changes);
    setCompany({ ...company, ...changes });
  };
  return { company, userProfile, loading, error, save };
}
