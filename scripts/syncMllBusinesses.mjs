/* global process, console, fetch, AbortSignal */
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { homedir } from 'node:os';
import { fetchMllPage, normalizeMllBusiness, mergeMllBusiness } from './lib/mllApi.mjs';

const project = 'velder-381f3';
const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
const cacheDir = '.local-data/mll-normal-v1';
const write = process.argv.includes('--write');
const pageArg = process.argv.find((a) => a.startsWith('--max-pages='));
const maxPages = pageArg ? Number(pageArg.split('=')[1]) : write ? 10 : 1;
if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 100)
  throw new Error('--max-pages는 1~100 사이여야 합니다.');
await mkdir(cacheDir, { recursive: true });
async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}
async function saveJson(path, value) {
  await writeFile(`${path}.tmp`, JSON.stringify(value));
  await rename(`${path}.tmp`, path);
}
function encode(v) {
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encode) } };
  return {
    mapValue: {
      fields: Object.fromEntries(Object.entries(v).map(([k, value]) => [k, encode(value)])),
    },
  };
}
function decode(v) {
  if ('stringValue' in v) return v.stringValue;
  if (v.arrayValue) return (v.arrayValue.values ?? []).map(decode);
  if (v.mapValue)
    return Object.fromEntries(
      Object.entries(v.mapValue.fields ?? {}).map(([k, value]) => [k, decode(value)]),
    );
  return null;
}
async function firestore(operation, body) {
  const auth = JSON.parse(
    await readFile(`${homedir()}/.config/configstore/firebase-tools.json`, 'utf8'),
  );
  let response;
  try {
    response = await fetch(`${base}:${operation}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
  } catch {
    throw new Error('Firestore 연결 실패. 저장 체크포인트에서 재개할 수 있습니다.');
  }
  if (!response.ok)
    throw new Error(`Firestore HTTP ${response.status}. Firebase CLI 로그인 상태를 확인하세요.`);
  return response.json();
}
const checkpointPath = `${cacheDir}/checkpoint.json`;
const checkpoint = (await readJson(checkpointPath)) ?? { nextPage: 1, processed: 0 };
if (checkpoint.complete) {
  console.log('이 스냅샷 수집은 완료되었습니다.');
  process.exit(0);
}
for (let count = 0; count < maxPages; count++) {
  const pageNo = checkpoint.nextPage;
  const path = `${cacheDir}/page-${pageNo}.json`;
  let page = await readJson(path);
  if (!page) {
    const result = await fetchMllPage(pageNo);
    // Persist only normalized business fields; never retain keys, representative names or emails.
    page = {
      ...result,
      items: result.items.map((row) => normalizeMllBusiness(row, result.fetchedAt)).filter(Boolean),
      returned: result.items.length,
    };
    await saveJson(path, page);
  }
  console.log(
    JSON.stringify({
      mode: write ? 'write' : 'dry-run',
      page: pageNo,
      totalCount: page.totalCount,
      returned: page.returned,
      eligible: page.items.length,
    }),
  );
  if (!write) break;
  if (!page.returned && (pageNo - 1) * 100 < page.totalCount)
    throw new Error('중간 페이지가 비어 있어 수집을 중단합니다.');
  const groups = new Map();
  for (const item of page.items) groups.set(item.id, [...(groups.get(item.id) ?? []), item]);
  if (groups.size) {
    const names = [...groups.keys()].map(
      (id) => `projects/${project}/databases/(default)/documents/publicBusinessProfiles/${id}`,
    );
    const prior = await firestore('batchGet', { documents: names });
    const existing = new Map(prior.filter((r) => r.found).map(({ found }) => [found.name, found]));
    const writes = [...groups].map(([id, entries]) => {
      const name = `projects/${project}/databases/(default)/documents/publicBusinessProfiles/${id}`;
      const found = existing.get(name);
      const old = found
        ? Object.fromEntries(Object.entries(found.fields).map(([k, value]) => [k, decode(value)]))
        : undefined;
      const data = mergeMllBusiness(old, entries);
      return {
        update: {
          name,
          fields: Object.fromEntries(Object.entries(data).map(([k, value]) => [k, encode(value)])),
        },
        updateMask: { fieldPaths: Object.keys(data) },
        currentDocument: found ? { updateTime: found.updateTime } : { exists: false },
        updateTransforms: [
          { fieldPath: 'ftcFetchedAt', setToServerValue: 'REQUEST_TIME' },
          ...(!found ? [{ fieldPath: 'importedAt', setToServerValue: 'REQUEST_TIME' }] : []),
        ],
      };
    });
    await firestore('commit', { writes });
    console.log(
      JSON.stringify({ savedUniqueThisPage: groups.size, mergedExisting: existing.size }),
    );
  }
  checkpoint.nextPage++;
  checkpoint.processed += page.returned;
  checkpoint.complete = pageNo * 100 >= page.totalCount;
  await saveJson(checkpointPath, checkpoint);
  if (checkpoint.complete) break;
}
