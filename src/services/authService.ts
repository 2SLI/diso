import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';
import {
  createCompanyOwnerWorkspace,
  isBusinessNumberTaken,
  normalizeBusinessNumber,
} from './companyService';
import { createJoinRequest, type JoinCompanyInput } from './membershipService';
import type { CollaborationType, Company } from '../types/company';
const configuredAuth = () => {
  if (!auth) throw new Error('Firebase 환경변수가 설정되지 않았습니다. .env를 확인해주세요.');
  return auth;
};
export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(configuredAuth(), email, password);
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string,
): Promise<User> => {
  const credential = await createUserWithEmailAndPassword(configuredAuth(), email, password);
  await updateProfile(credential.user, { displayName });
  return credential.user;
};
export const logoutUser = () => signOut(configuredAuth());
export interface RegistrationCompanyInput {
  name: string;
  businessNumber: string;
  industry: string;
  region: string;
  description: string;
  website: string;
  collaborationTypes: CollaborationType[];
}
export const registerCompanyAccount = async (
  email: string,
  password: string,
  displayName: string,
  company: RegistrationCompanyInput,
): Promise<User> => {
  const businessNumber = normalizeBusinessNumber(company.businessNumber);
  if (!/^\d{10}$/.test(businessNumber)) throw new Error('사업자등록번호 10자리를 입력해주세요.');
  if (await isBusinessNumberTaken(businessNumber))
    throw new Error('이미 등록된 사업자등록번호입니다.');
  const user = await registerWithEmail(email, password, displayName);
  try {
    await createCompanyOwnerWorkspace(
      {
        ...company,
        businessNumber,
        address: '',
        logoUrl: '',
        foundedYear: undefined,
        employeeCount: '',
        companyType: '',
        cultureTags: [],
        benefits: [],
        offerings: [],
        needs: [],
        capabilities: [],
        certifications: [],
        serviceRegions: [company.region],
        verified: false,
      } satisfies Omit<Company, 'id' | 'createdAt' | 'updatedAt'>,
      { uid: user.uid, email: user.email ?? email, displayName },
    );
  } catch (error) {
    await deleteUser(user).catch(() => undefined);
    throw error;
  }
  await sendEmailVerification(user).catch(() => undefined);
  return user;
};
export const registerJoinCompanyAccount = async (
  email: string,
  password: string,
  displayName: string,
  join: JoinCompanyInput,
): Promise<User> => {
  const user = await registerWithEmail(email, password, displayName);
  try {
    await createJoinRequest({ uid: user.uid, email: user.email ?? email, displayName }, join);
  } catch (error) {
    await deleteUser(user).catch(() => undefined);
    throw error;
  }
  await sendEmailVerification(user).catch(() => undefined);
  return user;
};
