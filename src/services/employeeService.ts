import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { EmployeeCareerSettings, EmployeeProfile } from '../types/employee';
import { db } from './firebase';

const store = () => {
  if (!db) throw new Error('Firebase가 설정되지 않았습니다.');
  return db;
};

export async function getEmployeeProfile(uid: string): Promise<EmployeeProfile | null> {
  const snapshot = await getDoc(doc(store(), 'employeeProfiles', uid));
  return snapshot.exists() ? (snapshot.data() as EmployeeProfile) : null;
}

export function saveEmployeeProfile(profile: EmployeeProfile): Promise<void> {
  return setDoc(
    doc(store(), 'employeeProfiles', profile.uid),
    { ...profile, createdAt: profile.createdAt ?? serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function getCareerSettings(uid: string): Promise<EmployeeCareerSettings | null> {
  const snapshot = await getDoc(doc(store(), 'employeeCareerSettings', uid));
  return snapshot.exists() ? (snapshot.data() as EmployeeCareerSettings) : null;
}

export function saveCareerSettings(
  uid: string,
  jobSearchStatus: EmployeeCareerSettings['jobSearchStatus'],
): Promise<void> {
  return setDoc(
    doc(store(), 'employeeCareerSettings', uid),
    { uid, jobSearchStatus, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true },
  );
}
