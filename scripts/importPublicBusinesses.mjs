/* global process, console, fetch, AbortSignal, setTimeout, TextDecoder */
import { readFile, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const project = 'velder-381f3';
const collection = 'publicBusinessProfiles';
const definitions = [
  { prefix: '경기도 남양주시_관내 통신판매업', source: 'namyangju-commerce', provider: '경기도 남양주시', date: '2025-12-31', name: '업체명', number: '사업자번호', representative: '대표자명', industry: '취급품목', region: '경기도 남양주시' },
  { prefix: '한국교통안전공단_튜닝작업완료입력', source: 'ts-tuning', provider: '한국교통안전공단', date: '2026-07-03', name: '상호명', industry: '정비구분', address: '주소', phone: '연락처' },
  { prefix: '과학기술정보통신부_전문연구사업자', source: 'msit-research', provider: '과학기술정보통신부', date: '2025-12-31', name: '업체명', number: '사업자등록번호', representative: '대표자명', industry: '신고업종1', address: '소재지2', regionField: '소재지1' },
  { prefix: '방송미디어통신위원회_방송사업자', source: 'broadcast-license', provider: '방송미디어통신위원회', date: '2026-07-10', name: '방송사명', industry: '유형', address: '주소', phone: '전화' },
  { prefix: '고용노동부_근로자공급', source: 'moel-labor', provider: '고용노동부', date: '2025-10-31', name: '사업장명', representative: '대표자', regionField: '공급지역' },
];

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (c === ',' && !quoted) { row.push(field.trim()); field = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; field = '';
    } else field += c;
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  const headers = rows.shift();
  return rows.map((cells, i) => {
    if (cells.length !== headers.length) throw new Error(`CSV column mismatch: row ${i + 2}`);
    return Object.fromEntries(headers.map((h, j) => [h, cells[j]]));
  });
}

const documents = new Map();
const stats = [];
const files = await readdir('src/data');
for (const def of definitions) {
  const file = files.find((f) => f.normalize('NFC').startsWith(def.prefix) && f.endsWith('.csv') && !f.endsWith(' 2.csv'));
  if (!file) throw new Error(`Missing source: ${def.source}`);
  const bytes = await readFile(join('src/data', file));
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { text = execFileSync('iconv', ['-f', 'CP949', '-t', 'UTF-8', join('src/data', file)], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }); }
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  let skipped = 0;
  for (const row of rows) {
    const name = row[def.name];
    if (!name) { skipped++; continue; }
    const number = (row[def.number] || '').replace(/\D/g, '');
    const businessNumber = /^\d{10}$/.test(number) ? number : '';
    const address = row[def.address] || '';
    const region = def.region || row[def.regionField] || '';
    const identity = businessNumber ? `business:${businessNumber}` : `${def.source}:${name.normalize('NFC')}:${address}:${region}`;
    const id = createHash('sha256').update(identity).digest('hex');
    const sourceRecord = { sourceId: def.source, provider: def.provider, referenceDate: def.date, fileName: file.normalize('NFC'), fields: row };
    const current = documents.get(id);
    if (current) {
      if (!current.sourceRecords.some((s) => JSON.stringify(s) === JSON.stringify(sourceRecord))) current.sourceRecords.push(sourceRecord);
      if (!current.sourceIds.includes(def.source)) current.sourceIds.push(def.source);
      continue;
    }
    documents.set(id, {
      name, businessNumber, address, region,
      representativeName: row[def.representative] || '',
      industry: row[def.industry] || '근로자공급',
      phone: row[def.phone] || '',
      sourceType: 'PUBLIC_DATA', sourceIds: [def.source], sourceRecords: [sourceRecord],
    });
  }
  stats.push({ source: def.source, rows: rows.length, skipped });
}
console.log(JSON.stringify({ project, collection, sources: stats, uniqueDocuments: documents.size }, null, 2));
if (!process.argv.includes('--write')) process.exit(0);

// Use the Firebase CLI's existing signed-in account without copying or printing credentials.
const authPath = join(homedir(), '.config/configstore/firebase-tools.json');
const endpoint = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents:commit`;
function encode(value) {
  if (typeof value === 'string') return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)])) } };
}
const entries = [...documents];
let written = 0;
for (let offset = 0; offset < entries.length; offset += 400) {
  const batch = entries.slice(offset, offset + 400);
  const writes = batch.map(([id, data]) => ({
    update: { name: `projects/${project}/databases/(default)/documents/${collection}/${id}`, fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, encode(v)])) },
    updateMask: { fieldPaths: Object.keys(data) },
    updateTransforms: [{ fieldPath: 'importedAt', setToServerValue: 'REQUEST_TIME' }],
  }));
  for (let attempt = 0; ; attempt++) {
    const auth = JSON.parse(await readFile(authPath, 'utf8'));
    const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${auth.tokens.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ writes }), signal: AbortSignal.timeout(60000) });
    if (response.ok) break;
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt >= 3) throw new Error(`Firestore import failed: HTTP ${response.status}, saved ${written}`);
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
  }
  written += batch.length;
  if (written % 4000 === 0 || written === entries.length) console.log(JSON.stringify({ written, total: entries.length }));
}
