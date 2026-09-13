import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { AppUser, CompanyRole } from '../types/user';
import { db } from './firebase';

export async function createUserProfile(
  user: Pick<AppUser, 'uid' | 'email' | 'displayName'>,
  companyId: string,
  role: CompanyRole,
): Promise<void> {
  if (!db) throw new Error('Firebase가 설정되지 않았습니다.');
  await setDoc(doc(db, 'users', user.uid), {
    ...user,
    companyId,
    role,
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  if (!db) throw new Error('Firebase가 설정되지 않았습니다.');
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? (snapshot.data() as AppUser) : null;
}
