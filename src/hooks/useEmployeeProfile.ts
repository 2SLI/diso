import { useEffect, useState } from 'react';
import { getCareerSettings, getEmployeeProfile } from '../services/employeeService';
import type { EmployeeCareerSettings, EmployeeProfile } from '../types/employee';

export function useEmployeeProfile(uid: string | undefined) {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [settings, setSettings] = useState<EmployeeCareerSettings | null>(null);
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!uid) return;
    let active = true;
    void Promise.all([getEmployeeProfile(uid), getCareerSettings(uid)])
      .then(([employeeProfile, careerSettings]) => {
        if (active) {
          setProfile(employeeProfile);
          setSettings(careerSettings);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError('직원 프로필을 불러오지 못했습니다.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [uid]);
  return { profile, settings, loading, error, setProfile, setSettings };
}
