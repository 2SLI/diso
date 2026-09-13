import {
  Building2,
  FileText,
  Handshake,
  Home,
  LayoutDashboard,
  LogOut,
  Search,
  UserCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/ui';
export function MainLayout() {
  const { user, logout } = useAuth();
  const links: { label: string; path: string; icon: LucideIcon }[] = user
    ? [
        { label: '기업 찾기', path: '/companies', icon: Search },
        { label: 'RFQ', path: '/rfqs', icon: FileText },
        { label: '받은 견적', path: '/quotes', icon: FileText },
        { label: '거래처', path: '/connections', icon: Handshake },
        { label: '대시보드', path: '/dashboard', icon: LayoutDashboard },
      ]
    : [
        { label: '기업 찾기', path: '/companies', icon: Search },
        { label: '협업/RFQ', path: '/rfqs', icon: FileText },
        { label: '거래처', path: '/connections', icon: Handshake },
      ];
  const mobileItems = [
    ['홈', '/', Home],
    ['기업 찾기', '/companies', Search],
    ['RFQ', '/rfqs', FileText],
    ['거래처', '/connections', Handshake],
    ['대시보드', '/dashboard', LayoutDashboard],
  ];
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-16">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold md:text-base">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-600 text-white md:h-8 md:w-8">
              <Building2 size={16} />
            </span>
            PartnerBase
          </Link>
          <nav className="hidden gap-6 md:flex">
            {links.map(({ label, path, icon: Icon }) => {
              return (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 text-sm font-medium ${isActive ? 'text-brand-600' : 'text-slate-600'}`
                  }
                >
                  <Icon size={15} />
                  {label}
                </NavLink>
              );
            })}
          </nav>
          <div className="flex items-center gap-1 md:gap-2">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                  title="내 커리어 프로필"
                >
                  <UserCircle size={19} />
                </Link>
                <Link to="/dashboard" className="hidden text-sm md:block">
                  {user.displayName || user.email}
                </Link>
                <Button variant="ghost" className="px-2 md:px-4" onClick={() => void logout()}>
                  <LogOut size={17} />
                  <span className="ml-1 hidden md:inline">로그아웃</span>
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button className="px-3 py-2 text-xs md:px-4 md:py-2.5 md:text-sm">로그인</Button>
              </Link>
            )}
          </div>
        </div>
        {!user && (
          <nav className="flex h-10 gap-5 overflow-x-auto border-t border-slate-100 px-4 md:hidden">
            {links.map(({ label, path, icon: Icon }) => {
              return (
                <NavLink
                  key={path}
                  to={path}
                  title={label}
                  aria-label={label}
                  className={({ isActive }) =>
                    `grid w-12 shrink-0 place-items-center border-b-2 ${isActive ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'}`
                  }
                >
                  <Icon size={17} />
                </NavLink>
              );
            })}
          </nav>
        )}
      </header>
      <main className={user ? 'pb-20 md:pb-0' : ''}>
        <Outlet />
      </main>
      {user && (
        <nav className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 border-t border-slate-200 bg-white md:hidden">
          {mobileItems.map(([label, path, Icon]) => {
            const I = Icon as typeof Home;
            return (
              <NavLink
                key={path as string}
                to={path as string}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 text-[10px] font-medium ${isActive ? 'text-brand-600' : 'text-slate-500'}`
                }
              >
                <I size={18} />
                {label as string}
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}
