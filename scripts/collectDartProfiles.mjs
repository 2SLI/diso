/* global fetch, AbortSignal, console, process, setTimeout */
import { readFile, writeFile, rename } from 'node:fs/promises';

const path = 'public/data/dart-company-profiles.json';
const index = JSON.parse(await readFile('public/data/dart-companies.json', 'utf8'));
const saved = JSON.parse(await readFile(path, 'utf8'));
const pending = index.companies.filter((c) => c.stockCode && !saved.profiles[c.corpCode]);
const endpoint = 'https://asia-northeast3-velder-381f3.cloudfunctions.net/dartCompanyProfileV2';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let position = 0;
let added = 0;
let failed = 0;
let consecutiveFailures = 0;
let stopped = false;
let checkpoint = Promise.resolve();

function save() {
  const snapshot = JSON.stringify({ ...saved, updatedAt: new Date().toISOString() });
  checkpoint = checkpoint.then(async () => {
    await writeFile(`${path}.tmp`, snapshot);
    await rename(`${path}.tmp`, path);
  });
  return checkpoint;
}

async function worker() {
  while (!stopped && position < pending.length) {
    const company = pending[position++];
    let success = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { corpCode: company.corpCode } }),
          signal: AbortSignal.timeout(40000),
        });
        const body = await response.json();
        if (body.error?.status === 'NOT_FOUND') break;
        if (!response.ok || !body.result?.profile) throw new Error('API response unavailable');
        const { cachedAt: _cachedAt, ...profile } = body.result.profile;
        void _cachedAt;
        saved.profiles[company.corpCode] = { ...profile, sourceModifiedAt: company.modifiedAt };
        added++;
        consecutiveFailures = 0;
        success = true;
        break;
      } catch {
        if (attempt < 2) await delay(1500 * (attempt + 1));
      }
    }
    if (!success) {
      failed++;
      if (++consecutiveFailures >= 6) stopped = true;
    }
    if ((added + failed) % 50 === 0) {
      await save();
      console.log(JSON.stringify({ added, failed, remaining: pending.length - position }));
    }
    await delay(200);
  }
}

console.log(JSON.stringify({ existing: Object.keys(saved.profiles).length, pending: pending.length }));
await Promise.all([worker(), worker()]);
await save();
console.log(JSON.stringify({ added, failed, total: Object.keys(saved.profiles).length, stopped }));
if (stopped) process.exitCode = 1;
