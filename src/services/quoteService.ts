import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { Quote } from '../types/quote';
import { db } from './firebase';
/** Private quote data: query only for buyerCompanyId or supplierCompanyId in future rules. */
export const createQuote = async (data: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) => {
  if (!db) throw new Error('Firebase가 설정되지 않았습니다.');
  return (
    await addDoc(collection(db, 'quotes'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  ).id;
};
export const getQuotes = async (companyId: string): Promise<Quote[]> => {
  if (!db) throw new Error('Firebase가 설정되지 않았습니다.');
  const [received, sent] = await Promise.all([
    getDocs(query(collection(db, 'quotes'), where('buyerCompanyId', '==', companyId))),
    getDocs(query(collection(db, 'quotes'), where('supplierCompanyId', '==', companyId))),
  ]);
  const map = new Map<string, Quote>();
  [...received.docs, ...sent.docs].forEach((snapshot) =>
    map.set(snapshot.id, { id: snapshot.id, ...snapshot.data() } as Quote),
  );
  return [...map.values()];
};
export const updateQuoteStatus = (quoteId: string, status: Quote['status']) => {
  if (!db) throw new Error('Firebase가 설정되지 않았습니다.');
  return updateDoc(doc(db, 'quotes', quoteId), { status, updatedAt: serverTimestamp() });
};
