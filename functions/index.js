/* global URL, fetch */
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { defineString } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();
const database = getFirestore();
const openDartApiKey = defineString('OPENDART_API_KEY');

const trim = (value) => (typeof value === 'string' ? value.trim() : '');

export const dartCompanyProfileV2 = onCall(
  {
    region: 'asia-northeast3',
    timeoutSeconds: 30,
    memory: '256MiB',
    invoker: 'public',
    serviceAccount: 'velder-381f3@appspot.gserviceaccount.com',
  },
  async (request) => {
    const corpCode = trim(request.data?.corpCode);
    if (!/^\d{8}$/.test(corpCode)) {
      throw new HttpsError('invalid-argument', '올바른 OpenDART 기업 고유번호가 필요합니다.');
    }

    const document = database.collection('dartCompanyProfiles').doc(corpCode);
    const cached = await document.get();
    if (cached.exists) {
      return { source: 'cache', profile: cached.data() };
    }

    const apiKey = openDartApiKey.value();
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'OpenDART 서버 설정이 필요합니다.');
    }

    const url = new URL('https://opendart.fss.or.kr/api/company.json');
    url.searchParams.set('crtfc_key', apiKey);
    url.searchParams.set('corp_code', corpCode);
    const response = await fetch(url);
    if (!response.ok) {
      throw new HttpsError('unavailable', 'OpenDART에 연결하지 못했습니다.');
    }
    const result = await response.json();
    if (result.status !== '000') {
      throw new HttpsError(
        result.status === '013' ? 'not-found' : 'unavailable',
        result.message || 'OpenDART 기업개황을 찾지 못했습니다.',
      );
    }

    const profile = {
      corpCode,
      ceoName: trim(result.ceo_nm),
      corporationClass: trim(result.corp_cls),
      legalRegistrationNumber: trim(result.jurir_no),
      businessRegistrationNumber: trim(result.bizr_no),
      address: trim(result.adres),
      homepageUrl: trim(result.hm_url),
      phoneNumber: trim(result.phn_no),
      faxNumber: trim(result.fax_no),
      industryCode: trim(result.induty_code),
      establishedAt: trim(result.est_dt),
      fiscalMonth: trim(result.acc_mt),
      source: 'OPENDART',
      cachedAt: FieldValue.serverTimestamp(),
    };
    await document.set(profile);
    return { source: 'opendart', profile };
  },
);
