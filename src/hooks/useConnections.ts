import { useEffect, useState } from 'react';
import { getConnections, updateConnectionStatus } from '../services/connectionService';
import type { Connection, ConnectionStatus } from '../types/connection';

export function useConnections(companyId: string | undefined) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!companyId) return;
    let active = true;
    void getConnections(companyId)
      .then((result) => {
        if (active) {
          setConnections(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError('거래처 정보를 불러오지 못했습니다.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [companyId]);
  const changeStatus = async (connectionId: string, status: ConnectionStatus) => {
    await updateConnectionStatus(connectionId, status);
    setConnections((current) =>
      current.map((item) => (item.id === connectionId ? { ...item, status } : item)),
    );
  };
  return { connections, loading, error, changeStatus };
}
