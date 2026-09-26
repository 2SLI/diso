import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { normalizeMllBusiness, mergeMllBusiness, validateMllPage } from './mllApi.mjs';

const row = {
  bzmnNm: '테스트업체',
  brno: '123-45-67890',
  prmmiMnno: '2026-테스트-1',
  operSttusCdNm: '정상영업',
  rnAddr: '서울특별시',
  chrgDeptTelno: '관청 전화',
  rprsvEmladr: 'private@example.com',
};
test('existing business-number identity matches and sensitive/authority contact fields are omitted', () => {
  const result = normalizeMllBusiness(row, '2026-09-14T00:00:00Z');
  assert.equal(result.id, createHash('sha256').update('business:1234567890').digest('hex'));
  assert.equal(result.data.phone, '');
  assert.ok(!JSON.stringify(result).includes('private@example.com'));
});
test('rejects inactive or unidentified businesses', () => {
  assert.equal(normalizeMllBusiness({ ...row, operSttusCdNm: '폐업' }, '2026-09-14'), null);
  assert.equal(normalizeMllBusiness({ ...row, brno: '', prmmiMnno: '' }, '2026-09-14'), null);
});
test('preserves existing data and sources; repeat import does not duplicate records', () => {
  const item = normalizeMllBusiness(row, '2026-09-14');
  const existing = {
    industry: '정밀제조',
    phone: '02-1234',
    sourceIds: ['other'],
    sourceRecords: [{ sourceId: 'other', fields: {} }],
  };
  const merged = mergeMllBusiness(existing, [item]);
  assert.equal(merged.industry, '정밀제조');
  assert.equal(merged.phone, '02-1234');
  assert.equal(mergeMllBusiness(merged, [item]).sourceRecords.length, 2);
});
test('API failures are not interpreted as empty successful pages', () => {
  assert.throws(() => validateMllPage({ resultCode: '30' }, 1));
  assert.throws(() => validateMllPage({ resultCode: '00', pageNo: 2, totalCount: 100 }, 1));
});
