import { createContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  loginWithEmail,
  logoutUser,
  registerCompanyAccount,
  registerJoinCompanyAccount,
  type RegistrationCompanyInput,
} from '../services/authService';
import type { JoinCompanyInput } from '../services/membershipService';
interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    company: RegistrationCompanyInput,
  ) => Promise<void>;
  joinCompany: (
    email: string,
    password: string,
    name: string,
    join: JoinCompanyInput,
  ) => Promise<void>;
}
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthValue | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(auth));
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (current) => {
      setUser(current);
      setLoading(false);
    });
  }, []);
  const value: AuthValue = {
    user,
    loading: loading,
    login: async (e, p) => {
      await loginWithEmail(e, p);
    },
    logout: logoutUser,
    register: async (e, p, n, company) => {
      await registerCompanyAccount(e, p, n, company);
    },
    joinCompany: async (e, p, n, join) => {
      await registerJoinCompanyAccount(e, p, n, join);
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
