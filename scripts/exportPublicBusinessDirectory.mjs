/* global fetch, console, URL, AbortSignal */
import { readFile, writeFile, rename } from 'node:fs/promises';
import { homedir } from 'node:os';

const project = 'velder-381f3';
const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/publicBusinessProfiles`;
function decode(v) {
  if ('stringValue' in v) return v.stringValue;
  if (v.arrayValue) return (v.arrayValue.values ?? []).map(decode);
  if (v.mapValue)
    return Object.fromEntries(
      Object.entries(v.mapValue.fields ?? {}).map(([k, value]) => [k, decode(value)]),
    );
  return null;
}
const businesses = [];
let pageToken;
do {
  const auth = JSON.parse(
    await readFile(`${homedir()}/.config/configstore/firebase-tools.json`, 'utf8'),
  );
  const url = new URL(base);
  url.searchParams.set('pageSize', '1000');
  if (pageToken) url.searchParams.set('pageToken', pageToken);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${auth.tokens.access_token}` },
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`Directory export failed: HTTP ${response.status}`);
  const page = await response.json();
  for (const document of page.documents ?? []) {
    const data = Object.fromEntries(
      Object.entries(document.fields).map(([k, value]) => [k, decode(value)]),
    );
    const sources = [
      ...new Map(
        data.sourceRecords.map((s) => [
          `${s.sourceId}:${s.referenceDate}`,
          { id: s.sourceId, provider: s.provider, referenceDate: s.referenceDate },
        ]),
      ).values(),
    ];
    businesses.push({
      id: document.name.split('/').pop(),
      name: data.name,
      industry: data.industry,
      address: data.address,
      region: data.region || data.address.split(/\s+/).slice(0, 2).join(' '),
      phone: data.phone,
      sources,
    });
  }
  pageToken = page.nextPageToken;
} while (pageToken);
if (!businesses.length) throw new Error('Refusing to export an empty directory');
businesses.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
const output = 'public/data/public-businesses.json';
await writeFile(
  `${output}.tmp`,
  JSON.stringify({ updatedAt: new Date().toISOString(), businesses }),
);
await rename(`${output}.tmp`, output);
console.log(JSON.stringify({ exported: businesses.length, output }));
