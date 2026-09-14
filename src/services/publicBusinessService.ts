import type { PublicBusinessIndex } from '../types/publicBusiness';

const regionPrefixes = [
  ['서울', '서울'],
  ['경기', '경기'],
  ['인천', '인천'],
  ['부산', '부산'],
  ['대구', '대구'],
  ['대전', '대전'],
  ['광주', '광주'],
  ['울산', '울산'],
  ['세종', '세종'],
  ['강원', '강원'],
  ['충청북|충북', '충북'],
  ['충청남|충남', '충남'],
  ['전라북|전북', '전북'],
  ['전라남|전남', '전남'],
  ['경상북|경북', '경북'],
  ['경상남|경남', '경남'],
  ['제주', '제주'],
] as const;
export function publicBusinessRegion(address: string, region: string) {
  const text = (address || region).replace(/^\(\d+\)\s*/, '').trim();
  return (
    regionPrefixes.find(([pattern]) => new RegExp(`^(?:${pattern})`).test(text))?.[1] ??
    '기타·지역 미상'
  );
}

let indexPromise: Promise<PublicBusinessIndex> | undefined;
export function loadPublicBusinesses(): Promise<PublicBusinessIndex> {
  indexPromise ??= fetch('/data/public-businesses.json')
    .then(async (response) => {
      if (!response.ok) throw new Error('공공데이터 업체 목록을 불러오지 못했습니다.');
      const result = (await response.json()) as PublicBusinessIndex;
      if (!Array.isArray(result.businesses)) throw new Error('업체 목록 형식이 올바르지 않습니다.');
      return result;
    })
    .catch((error: unknown) => {
      indexPromise = undefined;
      throw error;
    });
  return indexPromise;
}

export const publicBusinessSources = [
  ['msit-research', '연구개발'],
  ['ts-tuning', '자동차 정비·튜닝'],
  ['namyangju-commerce', '통신판매'],
  ['broadcast-license', '방송'],
  ['moel-labor', '근로자공급'],
] as const;

export const normalizeBusinessSearch = (value: string) =>
  value.normalize('NFC').replace(/\s+/g, '').toLocaleLowerCase('ko-KR');
