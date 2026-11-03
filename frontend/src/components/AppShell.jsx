import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3, Bell, ChevronLeft, ChevronRight, CircleHelp, LayoutDashboard, LogOut, Menu,
  Moon, Plus, Repeat2, Search, Settings, Tags, Sun, WalletCards, X, ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiRequest } from '../lib/api';
import { toast } from '../lib/alerts';
import { currency, dateLabel, getCategoryName, getId } from '../lib/format';

const links = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/recurring', label: 'Recurring', icon: Repeat2 },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/budgets', label: 'Budget planner', icon: WalletCards },
  { to: '/categories', label: 'Categories', icon: Tags },
];

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [notices, setNotices] = useState([]);
  const [noticeCategories, setNoticeCategories] = useState({});
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const submitSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    navigate({ pathname: '/transactions', search: params.toString() ? `?${params}` : '' });
  };

  const signOut = async () => {
    try {
      await logout();
    } catch (error) {
      toast('error', error.message || 'Could not sign out');
    } finally {
      navigate('/login');
    }
  };

  const toggleNotices = async () => {
    if (noticeOpen) {
      setNoticeOpen(false);
      return;
    }
    setNoticeOpen(true);
    setNoticeLoading(true);
    try {
      const [result, categoryResult] = await Promise.all([
        apiRequest('/budget/listing?limit=100'),
        apiRequest('/category/listing?limit=100'),
      ]);
      setNoticeCategories(Object.fromEntries((categoryResult.categories || []).map((category) => [getId(category), category.name])));
      setNotices((result.Budget || []).filter((budget) => (budget.status || budget.alertStatus) !== 'on_track'));
    } catch (error) {
      toast('error', error.message || 'Could not load budget alerts');
    } finally {
      setNoticeLoading(false);
    }
  };

  const sidebar = (
    <aside className={`app-sidebar flex h-full flex-col border-r border-line transition-all ${collapsed ? 'w-[84px]' : 'w-[250px]'}`}>
      <div className={`flex h-[76px] items-center border-b border-line px-5 ${collapsed ? 'justify-center px-3' : 'gap-3'}`}>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-violet text-white shadow-lg shadow-violet/20">
          <WalletCards size={21} />
        </div>
        {!collapsed && <div><p className="text-[17px] font-bold tracking-tight">spend<span className="text-violet">wise</span></p><p className="text-[10px] tracking-[.18em] text-muted">YOUR MONEY, IN FOCUS</p></div>}
        <button className="ml-auto rounded-lg p-1.5 text-muted hover:bg-white/5 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6">
        {!collapsed && <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-muted/70">Workspace</p>}
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            title={collapsed ? label : undefined}
            className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${isActive ? 'bg-violet/15 text-violet' : 'text-muted hover:bg-white/[.04] hover:text-main'} ${collapsed ? 'justify-center' : ''}`}
          >
            <Icon size={18} strokeWidth={1.8} />{!collapsed && label}
            {!collapsed && to === '/' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-mint" />}
          </NavLink>
        ))}
        <div className="!mt-7 border-t border-line pt-5">
          <NavLink to="/settings" onClick={() => setMobileOpen(false)} title={collapsed ? 'Settings' : undefined} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${isActive ? 'bg-violet/15 text-violet' : 'text-muted hover:bg-white/[.04] hover:text-main'} ${collapsed ? 'justify-center' : ''}`}>
            <Settings size={18} strokeWidth={1.8} />{!collapsed && 'Settings'}
          </NavLink>
        </div>
      </nav>

      {!collapsed && (
        <div className="mx-3 mb-4 rounded-2xl border border-violet/15 bg-gradient-to-br from-violet/[.12] to-transparent p-4">
          <div className="mb-2 flex items-center gap-2 text-violet"><CircleHelp size={15} /><span className="text-xs font-semibold">A calmer money day</span></div>
          <p className="text-xs leading-relaxed text-muted">Small steps add up. Keep your spending in view and your goals within reach.</p>
        </div>
      )}
      <button onClick={() => setCollapsed((value) => !value)} className="hidden h-12 items-center justify-center border-t border-line text-muted hover:text-main md:flex" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
      </button>
    </aside>
  );

  return (
    <div className="app-bg min-h-screen">
      <div className="fixed inset-y-0 left-0 z-30 hidden md:block">{sidebar}</div>
      {mobileOpen && <button className="fixed inset-0 z-40 bg-black/55 md:hidden" aria-label="Close menu overlay" onClick={() => setMobileOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-50 transition-transform md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>{sidebar}</div>

      <div className={`min-h-screen transition-[padding] ${collapsed ? 'md:pl-[84px]' : 'md:pl-[250px]'}`}>
        <header className="no-print sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-line bg-[var(--background)]/90 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button className="rounded-xl border border-line p-2 text-muted md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={19} /></button>
            <div className="hidden sm:block"><p className="text-sm font-semibold">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.firstName || 'there'} <span aria-hidden="true">✦</span></p><p className="mt-0.5 text-xs text-muted">{dateLabel(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <form onSubmit={submitSearch} className="relative hidden w-52 lg:block xl:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="field !rounded-xl !py-2 !pl-9 !pr-3 !text-xs" placeholder="Search transactions..." aria-label="Search transactions" />
            </form>
            <button className="grid h-10 w-10 place-items-center rounded-xl border border-line text-muted transition hover:text-violet" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} aria-label="Toggle color theme">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div className="relative">
              <button onClick={toggleNotices} className="relative grid h-10 w-10 place-items-center rounded-xl border border-line text-muted transition hover:text-violet" aria-label="View budget notifications">
                <Bell size={17} />{notices.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber ring-2 ring-[var(--background)]" />}
              </button>
              {noticeOpen && <div className="absolute right-0 top-12 z-30 w-[min(330px,calc(100vw-2rem))] rounded-2xl border border-line bg-[var(--surface)] p-3 shadow-2xl">
                <div className="flex items-center justify-between border-b border-line px-2 pb-3"><p className="text-sm font-semibold">Budget alerts</p><button className="text-xs font-medium text-violet" onClick={() => { setNoticeOpen(false); navigate('/budgets'); }}>View budgets</button></div>
                {noticeLoading ? <p className="p-4 text-center text-xs text-muted">Checking your budgets…</p> : notices.length ? <div className="max-h-64 overflow-y-auto pt-1">{notices.map((budget) => <button key={getId(budget)} onClick={() => { setNoticeOpen(false); navigate('/budgets'); }} className="block w-full rounded-xl px-2 py-3 text-left hover:bg-white/[.04]"><div className="flex justify-between gap-3"><p className="truncate text-sm font-medium">{getCategoryName(budget.categoryId) || noticeCategories[getId(budget.categoryId)] || 'Overall budget'}</p><p className={`shrink-0 text-xs font-semibold ${(budget.status || budget.alertStatus) === 'over_budget' ? 'text-rose' : 'text-amber'}`}>{budget.percentUsed}%</p></div><p className="mt-1 text-xs text-muted">{currency(budget.spent)} of {currency(budget.amount)} spent</p></button>)}</div> : <p className="p-4 text-center text-xs text-muted">All clear. No budgets near their limits.</p>}
              </div>}
            </div>
            <button className="button-primary !hidden !rounded-xl !px-3 !py-2.5 sm:!inline-flex" onClick={() => navigate('/transactions?new=1')}><Plus size={16} /> Add transaction</button>
            <button className="grid h-10 w-10 place-items-center rounded-xl bg-violet/10 font-semibold text-violet sm:hidden" onClick={() => navigate('/transactions?new=1')} title="Add transaction"><Plus size={19} /></button>
            <div className="relative">
              <button onClick={() => setMenuOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-violet/10 text-xs font-bold text-violet" aria-label="Open profile menu">
                {(user?.firstName?.[0] || user?.email?.[0] || 'S').toUpperCase()}
              </button>
              {menuOpen && <div className="absolute right-0 top-12 z-30 w-56 rounded-2xl border border-line bg-[var(--surface)] p-2 shadow-2xl">
                <div className="border-b border-line px-3 py-2"><p className="text-sm font-semibold">{user?.firstName} {user?.lastName}</p><p className="mt-0.5 truncate text-xs text-muted">{user?.email}</p></div>
                <button onClick={() => { setMenuOpen(false); navigate('/settings'); }} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-muted hover:bg-white/5 hover:text-main"><Settings size={16} /> Settings</button>
                <button onClick={signOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-rose hover:bg-rose/5"><LogOut size={16} /> Sign out</button>
              </div>}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
