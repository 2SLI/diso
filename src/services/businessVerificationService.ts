import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export type BusinessVerificationResult = {
  businessNumber: string;
  status: string;
  statusCode: string;
  taxType: string | null;
  isActive: boolean;
};

export async function verifyMyCompanyBusinessNumber(
  businessNumber: string,
): Promise<BusinessVerificationResult> {
  if (!functions) throw new Error('Firebase 서버 연결 설정이 필요합니다.');
  const normalizedBusinessNumber = businessNumber.replace(/\D/g, '');
  if (!/^\d{10}$/.test(normalizedBusinessNumber)) {
    throw new Error('사업자등록번호는 숫자 10자리여야 합니다.');
  }
  const verify = httpsCallable<{ businessNumber: string }, BusinessVerificationResult>(
    functions,
    'verifyBusinessStatus',
  );
  return (await verify({ businessNumber: normalizedBusinessNumber })).data;
}
