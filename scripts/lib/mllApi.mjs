/* global fetch, URL, AbortSignal, process */
import { createHash } from 'node:crypto';

export const mllEndpoint = 'https://apis.data.go.kr/1130000/MllBs_2Service/getMllBsInfo_2';
export async function fetchMllPage(pageNo, numOfRows = 100) {
  const key = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!key) throw new Error('DATA_GO_KR_SERVICE_KEY 서버 환경변수가 필요합니다.');
  const url = new URL(mllEndpoint);
  for (const [name, value] of Object.entries({
    serviceKey: key,
    pageNo,
    numOfRows,
    resultType: 'json',
    operSttusCdNm: '정상영업',
  }))
    url.searchParams.set(name, String(value));
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  } catch {
    throw new Error('통신판매 API 연결 실패 또는 시간 초과. 다음 실행에서 재시도하세요.');
  }
  if (!response.ok) throw new Error(`통신판매 API HTTP ${response.status}`);
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('통신판매 API가 JSON 대신 오류 응답을 반환했습니다. 승인 상태를 확인하세요.');
  }
  return validateMllPage(data, pageNo);
}

export function validateMllPage(data, pageNo) {
  if (String(data.resultCode) !== '00')
    throw new Error('통신판매 API 처리 실패. 승인 및 호출 한도를 확인하세요.');
  if (Number(data.pageNo) !== pageNo || !Number.isSafeInteger(Number(data.totalCount)))
    throw new Error('통신판매 API 페이지 정보 불일치');
  const items = Array.isArray(data.items) ? data.items : (data.items?.item ?? []);
  if (!Array.isArray(items)) throw new Error('통신판매 API 목록 형식 불일치');
  return {
    items,
    totalCount: Number(data.totalCount),
    pageNo,
    fetchedAt: new Date().toISOString(),
  };
}

const clean = (value) => (typeof value === 'string' && value !== 'N/A' ? value.trim() : '');
export function normalizeMllBusiness(row, fetchedAt) {
  const name = clean(row.bzmnNm);
  const number = clean(row.brno).replace(/[^0-9]/g, '');
  const businessNumber = /^\d{10}$/.test(number) ? number : '';
  const license = clean(row.prmmiMnno);
  if (!name || (!businessNumber && !license) || row.operSttusCdNm !== '정상영업') return null;
  const identity = businessNumber ? `business:${businessNumber}` : `ftc-commerce:${license}`;
  return {
    id: createHash('sha256').update(identity).digest('hex'),
    data: {
      name,
      businessNumber,
      address: clean(row.rnAddr) || clean(row.lctnAddr),
      region: clean(row.dclrInstNm) || clean(row.ctpvNm),
      industry: '통신판매업',
      phone: '',
      sourceType: 'PUBLIC_DATA',
    },
    record: {
      sourceId: 'ftc-commerce',
      provider: '공정거래위원회',
      referenceDate: fetchedAt.slice(0, 10),
      fields: {
        registrationNumber: license,
        registrationDate: clean(row.dclrDate),
        operatingStatus: clean(row.operSttusCdNm),
      },
    },
  };
}

export function mergeMllBusiness(existing, entries) {
  const data = { ...entries[0].data };
  for (const field of ['name', 'businessNumber', 'address', 'region', 'industry', 'phone'])
    if (existing?.[field]) data[field] = existing[field];
  const records = new Map(
    (existing?.sourceRecords ?? []).map((r) => [
      r.sourceId === 'ftc-commerce' ? `ftc:${r.fields.registrationNumber}` : JSON.stringify(r),
      r,
    ]),
  );
  for (const { record } of entries) records.set(`ftc:${record.fields.registrationNumber}`, record);
  return {
    ...data,
    sourceIds: [...new Set([...(existing?.sourceIds ?? []), 'ftc-commerce'])],
    sourceRecords: [...records.values()],
  };
}
