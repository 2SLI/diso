/* global process, fetch, console, setTimeout, URL */
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const apiKey = process.env.OPENDART_API_KEY;
if (!apiKey) throw new Error('OPENDART_API_KEY가 .env에 설정되어 있지 않습니다.');

const companyIndex = JSON.parse(await readFile('public/data/dart-companies.json', 'utf8'));
const targets = companyIndex.companies.filter((company) => company.stockCode);
const outputPath = 'public/data/dart-company-profiles.json';
const batchLimit = Number(process.env.DART_PROFILE_BATCH_LIMIT ?? 500);
const existingProfiles = await readFile(outputPath, 'utf8')
  .then((file) => JSON.parse(file).profiles ?? {})
  .catch(() => ({}));

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const getText = (value) => (typeof value === 'string' ? value.trim() : '');

async function fetchProfile(company, attempt = 0) {
  const url = new URL('https://opendart.fss.or.kr/api/company.json');
  url.searchParams.set('crtfc_key', apiKey);
  url.searchParams.set('corp_code', company.corpCode);
  const response = await fetch(url);
  if (!response.ok) {
    if (attempt < 5) {
      await delay(750 * (attempt + 1));
      return fetchProfile(company, attempt + 1);
    }
    throw new Error(`HTTP ${response.status}`);
  }
  const result = await response.json();
  if (result.status !== '000') return null;
  return {
    corpCode: company.corpCode,
    sourceModifiedAt: company.modifiedAt,
    ceoName: getText(result.ceo_nm),
    corporationClass: getText(result.corp_cls),
    legalRegistrationNumber: getText(result.jurir_no),
    businessRegistrationNumber: getText(result.bizr_no),
    address: getText(result.adres),
    homepageUrl: getText(result.hm_url),
    phoneNumber: getText(result.phn_no),
    faxNumber: getText(result.fax_no),
    industryCode: getText(result.induty_code),
    establishedAt: getText(result.est_dt),
    fiscalMonth: getText(result.acc_mt),
  };
}

const pending = targets
  .filter((company) => existingProfiles[company.corpCode]?.sourceModifiedAt !== company.modifiedAt)
  .slice(0, batchLimit);
let cursor = 0;
let completed = 0;
const concurrency = 2;

async function worker() {
  while (cursor < pending.length) {
    const company = pending[cursor++];
    try {
      const profile = await fetchProfile(company);
      if (profile) existingProfiles[company.corpCode] = profile;
    } catch {
      // 다음 동기화에서 재시도할 수 있도록 실패한 기업은 저장하지 않습니다.
    }
    completed += 1;
    if (completed % 100 === 0 || completed === pending.length) {
      console.log(`기업개황 ${completed}/${pending.length}개 처리 완료`);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
await mkdir('public/data', { recursive: true });
await writeFile(
  outputPath,
  JSON.stringify({ updatedAt: new Date().toISOString(), profiles: existingProfiles }),
  'utf8',
);
console.log(`OpenDART 기업개황 ${Object.keys(existingProfiles).length.toLocaleString()}개를 ${outputPath}에 저장했습니다.`);
