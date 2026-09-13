import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Connection, ConnectionStatus } from '../types/connection';

const store = () => {
  if (!db) throw new Error('Firebase가 설정되지 않았습니다.');
  return db;
};
const toConnection = (id: string, data: Record<string, unknown>) => ({ id, ...data }) as Connection;

export async function requestConnection(
  companyAId: string,
  companyBId: string,
  createdBy: string,
): Promise<string> {
  if (companyAId === companyBId) throw new Error('자기 회사에는 협업 요청을 보낼 수 없습니다.');
  const [sent, received] = await Promise.all([
    getDocs(
      query(
        collection(store(), 'connections'),
        where('companyAId', '==', companyAId),
        where('companyBId', '==', companyBId),
      ),
    ),
    getDocs(
      query(
        collection(store(), 'connections'),
        where('companyAId', '==', companyBId),
        where('companyBId', '==', companyAId),
      ),
    ),
  ]);
  if (!sent.empty || !received.empty)
    throw new Error('이미 협업 요청 또는 거래처 연결이 존재합니다.');
  return (
    await addDoc(collection(store(), 'connections'), {
      companyAId,
      companyBId,
      status: 'PENDING',
      createdBy,
      createdAt: serverTimestamp(),
    })
  ).id;
}

export async function getConnections(companyId: string): Promise<Connection[]> {
  const [asRequester, asRecipient] = await Promise.all([
    getDocs(query(collection(store(), 'connections'), where('companyAId', '==', companyId))),
    getDocs(query(collection(store(), 'connections'), where('companyBId', '==', companyId))),
  ]);
  return [...asRequester.docs, ...asRecipient.docs].map((snapshot) =>
    toConnection(snapshot.id, snapshot.data()),
  );
}

export function updateConnectionStatus(
  connectionId: string,
  status: ConnectionStatus,
): Promise<void> {
  return updateDoc(doc(store(), 'connections', connectionId), { status });
}
