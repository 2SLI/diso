import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import type { Rfq } from '../types/rfq';
import { db } from './firebase';
export const createRfq = async (data: Omit<Rfq, 'id' | 'createdAt' | 'updatedAt'>) => {
  if (!db) throw new Error('Firebase가 설정되지 않았습니다.');
  return (
    await addDoc(collection(db, 'rfqs'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  ).id;
};
export const getRfqs = async (companyId: string): Promise<Rfq[]> => {
  if (!db) throw new Error('Firebase가 설정되지 않았습니다.');
  const [owned, open] = await Promise.all([
    getDocs(query(collection(db, 'rfqs'), where('buyerCompanyId', '==', companyId))),
    getDocs(query(collection(db, 'rfqs'), where('status', '==', 'OPEN'))),
  ]);
  const map = new Map<string, Rfq>();
  [...owned.docs, ...open.docs].forEach((snapshot) =>
    map.set(snapshot.id, { id: snapshot.id, ...snapshot.data() } as Rfq),
  );
  return [...map.values()];
};
