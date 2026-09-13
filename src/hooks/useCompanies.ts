import { useEffect, useState } from 'react';
import { getCompanies, getCompany } from '../services/companyService';
import type { Company } from '../types/company';

interface CollectionState {
  companies: Company[];
  loading: boolean;
  error: string | null;
}

export function useCompanies(): CollectionState {
  const [state, setState] = useState<CollectionState>({
    companies: [],
    loading: true,
    error: null,
  });
  useEffect(() => {
    let active = true;
    void getCompanies()
      .then((companies) => {
        if (active) setState({ companies, loading: false, error: null });
      })
      .catch(() => {
        if (active)
          setState({
            companies: [],
            loading: false,
            error: '기업 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
          });
      });
    return () => {
      active = false;
    };
  }, []);
  return state;
}

export function useCompany(companyId: string | undefined): {
  company: Company | null;
  loading: boolean;
  error: string | null;
} {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(companyId ? null : '기업을 찾을 수 없습니다.');
  useEffect(() => {
    if (!companyId) return;
    let active = true;
    void getCompany(companyId)
      .then((result) => {
        if (active) {
          setCompany(result);
          setError(result ? null : '기업을 찾을 수 없습니다.');
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError('기업 정보를 불러오지 못했습니다.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [companyId]);
  return { company, loading, error };
}
