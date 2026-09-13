export type BusinessVerificationResult = {
  businessNumber: string;
  status: string;
  statusCode: string;
  taxType: string | null;
  isActive: boolean;
};

export async function verifyMyCompanyBusinessNumber(
  businessNumber: string,
): Promise<BusinessVerificationResult> {
  const serviceKey = import.meta.env.VITE_ODCLOUD_BUSINESS_API_KEY;
  if (!serviceKey) throw new Error('공공데이터포털 인증키가 설정되지 않았습니다.');
  const normalizedBusinessNumber = businessNumber.replace(/\D/g, '');
  if (!/^\d{10}$/.test(normalizedBusinessNumber)) {
    throw new Error('사업자등록번호는 숫자 10자리여야 합니다.');
  }
  const response = await fetch(
    `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${encodeURIComponent(serviceKey)}&returnType=JSON`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ b_no: [normalizedBusinessNumber] }),
    },
  );
  const payload = (await response.json()) as {
    status_code?: string;
    data?: Array<{ b_no: string; b_stt: string; b_stt_cd: string; tax_type?: string }>;
  };
  const business = payload.data?.[0];
  if (!response.ok || payload.status_code !== 'OK' || !business) {
    throw new Error('사업자 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
  return {
    businessNumber: business.b_no,
    status: business.b_stt,
    statusCode: business.b_stt_cd,
    taxType: business.tax_type ?? null,
    isActive: business.b_stt_cd === '01',
  };
}
