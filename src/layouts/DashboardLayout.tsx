import {
  Building2,
  FileText,
  Handshake,
  LayoutDashboard,
  ReceiptText,
  Send,
  Settings,
  Search,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
const items = [
  ['대시보드', '/dashboard', LayoutDashboard],
  ['기업 프로필', '/my-company', Building2],
  ['직원 및 권한', '/team', Settings],
  ['내 커리어 프로필', '/profile', Settings],
  ['기업 찾기', '/companies', Search],
  ['RFQ', '/rfqs', FileText],
  ['받은 견적', '/quotes', ReceiptText],
  ['보낸 견적', '/quotes?tab=sent', Send],
  ['거래처', '/connections', Handshake],
  ['설정', '/settings', Settings],
];
export function DashboardLayout() {
  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8">
      <aside className="hidden w-52 shrink-0 md:block">
        <p className="mb-3 px-3 text-xs font-bold tracking-wide text-slate-400">WORKSPACE</p>
        {items.map(([label, path, Icon]) => {
          const I = Icon as typeof LayoutDashboard;
          return (
            <NavLink
              key={label as string}
              to={path as string}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`
              }
            >
              <I size={18} />
              {label as string}
            </NavLink>
          );
        })}
      </aside>
      <section className="min-w-0 flex-1">
        <Outlet />
      </section>
    </div>
  );
}
