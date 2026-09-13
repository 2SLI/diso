import { useEffect, useState } from 'react';
import { getQuotes, updateQuoteStatus } from '../services/quoteService';
import type { Quote } from '../types/quote';

export function useQuotes(companyId: string | undefined) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);
  const refresh = async () => {
    if (companyId) setQuotes(await getQuotes(companyId));
  };
  useEffect(() => {
    if (!companyId) return;
    let active = true;
    void getQuotes(companyId)
      .then((result) => {
        if (active) {
          setQuotes(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError('견적을 불러오지 못했습니다.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [companyId]);
  const changeStatus = async (quoteId: string, status: Quote['status']) => {
    await updateQuoteStatus(quoteId, status);
    setQuotes((current) =>
      current.map((item) => (item.id === quoteId ? { ...item, status } : item)),
    );
  };
  return { quotes, loading, error, refresh, changeStatus };
}
