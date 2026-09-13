import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import type { DartCompanyProfile } from './dartService';

type DartProfileResponse = {
  source: 'cache' | 'opendart';
  profile: Omit<DartCompanyProfile, 'corpName' | 'stockCode' | 'modifiedAt'>;
};

export async function getCachedDartCompanyProfile(
  corpCode: string,
): Promise<DartProfileResponse['profile'] | null> {
  if (!functions) return null;
  const getProfile = httpsCallable<{ corpCode: string }, DartProfileResponse>(
    functions,
    'dartCompanyProfileV2',
  );
  const result = await getProfile({ corpCode });
  return result.data.profile;
}
