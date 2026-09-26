/* global fetch, AbortSignal, URL */
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { defineString } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const apiKey = defineString('DATA_GO_KR_SERVICE_KEY');
export const verifyBusinessStatus = onCall(
  {
    region: 'asia-northeast3',
    timeoutSeconds: 30,
    memory: '256MiB',
    maxInstances: 2,
    invoker: 'public',
    serviceAccount: 'velder-381f3@appspot.gserviceaccount.com',
  },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
    const number =
      typeof request.data?.businessNumber === 'string'
        ? request.data.businessNumber.replace(/\D/g, '')
        : '';
    if (!/^\d{10}$/.test(number))
      throw new HttpsError('invalid-argument', '사업자등록번호는 숫자 10자리여야 합니다.');
    if (!apiKey.value())
      throw new HttpsError('failed-precondition', '사업자 상태조회 서버 설정이 필요합니다.');
    const database = getFirestore();
    const limit = database.collection('businessVerificationLimits').doc(request.auth.uid);
    await database.runTransaction(async (tx) => {
      const prior = (await tx.get(limit)).data();
      const now = Date.now();
      const sameWindow = prior && now - prior.windowStart < 60000;
      if (sameWindow && prior.count >= 5)
        throw new HttpsError('resource-exhausted', '1분에 최대 5번 조회할 수 있습니다.');
      tx.set(limit, {
        windowStart: sameWindow ? prior.windowStart : now,
        count: sameWindow ? prior.count + 1 : 1,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    const url = new URL('https://api.odcloud.kr/api/nts-businessman/v1/status');
    url.searchParams.set('serviceKey', apiKey.value());
    url.searchParams.set('returnType', 'JSON');
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ b_no: [number] }),
        signal: AbortSignal.timeout(20000),
      });
      const payload = await response.json();
      const business = payload.data?.[0];
      if (!response.ok || payload.status_code !== 'OK' || !business)
        throw new Error('upstream failed');
      return {
        businessNumber: business.b_no,
        status: business.b_stt,
        statusCode: business.b_stt_cd,
        taxType: business.tax_type ?? null,
        isActive: business.b_stt_cd === '01',
      };
    } catch {
      throw new HttpsError(
        'unavailable',
        '사업자 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.',
      );
    }
  },
);
