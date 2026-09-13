import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { Company } from '../types/company';
import type { CompanyRole } from '../types/user';
import type { AppUser } from '../types/user';
import { db } from './firebase';
const store = () => {
  if (!db) throw new Error('Firebase가 설정되지 않았습니다.');
  return db;
};
export const getCompanies = async () =>
  (await getDocs(query(collection(store(), 'companies'), limit(24)))).docs.map(
    (d) => ({ id: d.id, ...d.data() }) as Company,
  );
export const getCompany = async (id: string) => {
  const snapshot = await getDoc(doc(store(), 'companies', id));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Company) : null;
};
export const createCompany = async (data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) =>
  (
    await addDoc(collection(store(), 'companies'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  ).id;
export const updateCompany = (id: string, data: Partial<Company>) =>
  updateDoc(doc(store(), 'companies', id), { ...data, updatedAt: serverTimestamp() });
export const createCompanyMember = (
  memberId: string,
  data: { companyId: string; userId: string; role: CompanyRole },
) => setDoc(doc(store(), 'companyMembers', memberId), { ...data, createdAt: serverTimestamp() });
export const normalizeBusinessNumber = (value: string) => value.replace(/\D/g, '');
export async function isBusinessNumberTaken(businessNumber: string): Promise<boolean> {
  const normalized = normalizeBusinessNumber(businessNumber);
  const snapshot = await getDocs(
    query(collection(store(), 'companies'), where('businessNumber', '==', normalized), limit(1)),
  );
  return !snapshot.empty;
}
export async function createCompanyOwnerWorkspace(
  company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>,
  user: Pick<AppUser, 'uid' | 'email' | 'displayName'>,
): Promise<string> {
  const database = store();
  const companyRef = doc(collection(database, 'companies'));
  const batch = writeBatch(database);
  const normalizedBusinessNumber = normalizeBusinessNumber(company.businessNumber);
  batch.set(companyRef, {
    ...company,
    businessNumber: normalizedBusinessNumber,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(database, 'users', user.uid), {
    ...user,
    companyId: companyRef.id,
    role: 'OWNER',
    createdAt: serverTimestamp(),
  });
  batch.set(doc(database, 'companyMembers', `${companyRef.id}_${user.uid}`), {
    companyId: companyRef.id,
    userId: user.uid,
    role: 'OWNER',
    createdAt: serverTimestamp(),
  });
  batch.set(doc(database, 'employeeProfiles', user.uid), {
    uid: user.uid,
    displayName: user.displayName,
    headline: '',
    bio: '',
    skills: [],
    certifications: [],
    careerSummary: '',
    portfolioUrl: '',
    visibility: 'PRIVATE',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(database, 'employeeCareerSettings', user.uid), {
    uid: user.uid,
    jobSearchStatus: 'NOT_LOOKING',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  return companyRef.id;
}
