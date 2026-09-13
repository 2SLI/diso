import {
  collection,
  deleteField,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { MembershipRequest } from '../types/membershipRequest';
import type { AppUser, CompanyRole } from '../types/user';

const store = () => {
  if (!db) throw new Error('Firebase가 설정되지 않았습니다.');
  return db;
};

export interface JoinCompanyInput {
  companyId: string;
  department: string;
  jobTitle: string;
  requestedRole: CompanyRole;
}

export async function createJoinRequest(
  user: Pick<AppUser, 'uid' | 'email' | 'displayName'>,
  input: JoinCompanyInput,
): Promise<string> {
  const database = store();
  const requestRef = doc(collection(database, 'membershipRequests'));
  const batch = writeBatch(database);
  batch.set(doc(database, 'users', user.uid), {
    ...user,
    pendingCompanyId: input.companyId,
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
  batch.set(requestRef, { ...input, ...user, status: 'PENDING', createdAt: serverTimestamp() });
  await batch.commit();
  return requestRef.id;
}

export async function getMembershipRequests(companyId: string): Promise<MembershipRequest[]> {
  const snapshots = await getDocs(
    query(
      collection(store(), 'membershipRequests'),
      where('companyId', '==', companyId),
      where('status', '==', 'PENDING'),
    ),
  );
  return snapshots.docs.map(
    (snapshot) => ({ id: snapshot.id, ...snapshot.data() }) as MembershipRequest,
  );
}

export async function reviewMembershipRequest(
  request: MembershipRequest,
  reviewerId: string,
  status: 'APPROVED' | 'REJECTED',
): Promise<void> {
  const database = store();
  const batch = writeBatch(database);
  const requestRef = doc(database, 'membershipRequests', request.id);
  batch.update(requestRef, { status, reviewedAt: serverTimestamp(), reviewedBy: reviewerId });
  if (status === 'APPROVED') {
    batch.update(doc(database, 'users', request.userId), {
      companyId: request.companyId,
      role: request.requestedRole,
      pendingCompanyId: deleteField(),
    });
    batch.set(doc(database, 'companyMembers', `${request.companyId}_${request.userId}`), {
      companyId: request.companyId,
      userId: request.userId,
      role: request.requestedRole,
      department: request.department,
      jobTitle: request.jobTitle,
      createdAt: serverTimestamp(),
    });
  }
  await batch.commit();
}
