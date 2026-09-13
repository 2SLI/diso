/* global process, fetch, TextDecoder, console */
import { mkdir, writeFile } from 'node:fs/promises';
import { unzipSync } from 'fflate';

const apiKey = process.env.OPENDART_API_KEY;
if (!apiKey) throw new Error('OPENDART_API_KEY가 .env에 설정되어 있지 않습니다.');

const response = await fetch(
  `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${encodeURIComponent(apiKey)}`,
);
if (!response.ok) throw new Error(`OpenDART 기업 목록 요청 실패: ${response.status}`);

const archive = unzipSync(new Uint8Array(await response.arrayBuffer()));
const xmlFile = Object.entries(archive).find(([name]) => name.toLowerCase().endsWith('.xml'))?.[1];
if (!xmlFile) throw new Error('OpenDART 응답에서 기업 목록 XML을 찾을 수 없습니다.');

const decodeXml = (value) =>
  value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
const tagValue = (entry, tag) => {
  const match = entry.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? decodeXml(match[1]).trim() : '';
};

const xml = new TextDecoder('utf-8').decode(xmlFile);
const companies = [...xml.matchAll(/<list>([\s\S]*?)<\/list>/g)]
  .map(([, entry]) => ({
    corpCode: tagValue(entry, 'corp_code'),
    corpName: tagValue(entry, 'corp_name'),
    stockCode: tagValue(entry, 'stock_code'),
    modifiedAt: tagValue(entry, 'modify_date'),
  }))
  .filter((company) => company.corpCode && company.corpName);

await mkdir('public/data', { recursive: true });
await writeFile(
  'public/data/dart-companies.json',
  JSON.stringify({ updatedAt: new Date().toISOString(), companies }),
  'utf8',
);
console.log(
  `OpenDART 기업 ${companies.length.toLocaleString()}개를 public/data/dart-companies.json에 저장했습니다.`,
);
