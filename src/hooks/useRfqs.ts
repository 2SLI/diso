import { useEffect, useState } from 'react';
import { getRfqs } from '../services/rfqService';
import type { Rfq } from '../types/rfq';

export function useRfqs(companyId: string | undefined) {
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);
  const refresh = async () => {
    if (!companyId) return;
    const result = await getRfqs(companyId);
    setRfqs(result);
  };
  useEffect(() => {
    if (!companyId) return;
    let active = true;
    void getRfqs(companyId)
      .then((result) => {
        if (active) {
          setRfqs(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError('RFQ 목록을 불러오지 못했습니다.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [companyId]);
  return { rfqs, loading, error, refresh };
}
