import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowUpRightFromCircle,
  CreditCard,
  Plus,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiRequest } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { useTheme } from '../context/ThemeContext';
import { currency, dateLabel, getCategoryName, getId } from '../lib/format';
import { EmptyState, ErrorState, LoadingState } from '../components/ui';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#38bdf8', '#f43f5e', '#a78bfa', '#14b8a6'];
const monthFmt = (value) =>
  new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date(value));

function MetricCard({ title, amount, icon: Icon, tone, note }) {
  return (
    <article className="card relative overflow-hidden p-5 sm:p-6">
      <div className={`absolute -right-7 -top-8 h-28 w-28 rounded-full blur-3xl ${tone}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{title}</p>
          <p className="mt-4 text-2xl font-semibold tracking-tight sm:text-[28px]">
            {currency(amount)}
          </p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[.04] text-violet">
          <Icon size={20} />
        </div>
      </div>
      <p className="relative mt-3 text-xs text-muted">{note}</p>
    </article>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-[var(--surface)] p-3 shadow-xl">
      <p className="mb-2 text-xs text-muted">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="text-xs font-medium" style={{ color: item.color }}>
          {item.name}: {currency(item.value)}
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { data, loading, error, reload } = useAsync(
    () =>
      Promise.all([
        apiRequest('/dashboard').then((result) => result.dashboard),
        apiRequest('/reports/summary?period=monthly').then((result) => result.report),
        apiRequest('/transaction/listing?limit=100').then((result) => result.Transactions),
        apiRequest('/category/listing?limit=100').then((result) => result.categories),
      ]),
    [],
  );
  const dashboard = data?.[0];
  const report = data?.[1];
  const transactions = data?.[2] || [];
  const categories = data?.[3] || [];
  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [getId(item), item.name])),
    [categories],
  );
  const categorySpend = useMemo(() => {
    const totals = new Map();
    transactions
      .filter((item) => item.type === 'expense')
      .forEach((item) => {
        const id = getId(item.categoryId);
        const name = getCategoryName(item.categoryId) || categoryMap.get(id) || 'Other';
        totals.set(name, (totals.get(name) || 0) + Number(item.amount));
      });
    return [...totals]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions, categoryMap]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const summary = dashboard?.summary || {};
  const monthlyRows = report?.summaries || [];
  const recent = dashboard?.recentTransactions || [];

  return (
    <div className="animate-in space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.17em] text-violet">
            Your overview
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">
            A clear view of your money
          </h1>
          <p className="mt-2 text-sm text-muted">Your month, thoughtfully laid out.</p>
        </div>
        <button
          onClick={() => navigate('/transactions?new=1')}
          className="button-primary self-start sm:self-auto"
        >
          <Plus size={17} /> New transaction
        </button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Net balance this month"
          amount={summary.balance}
          icon={Wallet}
          tone="bg-violet/20"
          note={`${summary.transactionCount || 0} transactions this month`}
        />
        <MetricCard
          title="Total income"
          amount={summary.income}
          icon={ArrowUpRight}
          tone="bg-mint/15"
          note="Received during this period"
        />
        <MetricCard
          title="Total expenses"
          amount={summary.expenses}
          icon={ArrowDownRight}
          tone="bg-rose/15"
          note="Spent during this period"
        />
        <MetricCard
          title="Savings this month"
          amount={summary.balance}
          icon={TrendingUp}
          tone="bg-sky-400/15"
          note="Income minus expenses"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <article className="card p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="font-semibold">Income & expenses</h2>
              <p className="mt-1 text-xs text-muted">Monthly movement over the past year</p>
            </div>
            <span className="rounded-lg bg-violet/10 px-2.5 py-1 text-[11px] text-violet">
              12 months
            </span>
          </div>
          {monthlyRows.length ? (
            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRows} margin={{ top: 8, right: 3, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.17} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--line)" strokeDasharray="4 5" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={monthFmt}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      `₹${value >= 1000 ? `${Math.round(value / 1000)}k` : value}`
                    }
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#10b981"
                    strokeWidth={2.2}
                    fill="url(#incomeFill)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#f43f5e"
                    strokeWidth={2.2}
                    fill="url(#expenseFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="Your chart is taking shape"
              description="Add a few transactions to see your monthly trends."
            />
          )}
          <div className="mt-3 flex gap-5 text-xs text-muted">
            <span className="flex items-center gap-2">
              <i className="h-2 w-2 rounded-full bg-mint" />
              Income
            </span>
            <span className="flex items-center gap-2">
              <i className="h-2 w-2 rounded-full bg-rose" />
              Expenses
            </span>
          </div>
        </article>

        <article className="card p-5 sm:p-6">
          <div className="mb-2">
            <h2 className="font-semibold">Where it goes</h2>
            <p className="mt-1 text-xs text-muted">Expense categories · latest 100 transactions</p>
          </div>
          {categorySpend.length ? (
            <>
              <div className="relative h-[225px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySpend}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={66}
                      outerRadius={94}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {categorySpend.map((item, index) => (
                        <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => currency(value)}
                      contentStyle={{
                        background: 'var(--surface)',
                        border: '1px solid var(--line)',
                        borderRadius: 12,
                      }}
                      itemStyle={{ color: theme === 'dark' ? '#ffffff' : '#142033' }}
                      labelStyle={{ color: theme === 'dark' ? '#ffffff' : '#142033' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="text-[11px] text-muted">Tracked</p>
                    <p className="mt-1 text-lg font-semibold">
                      {currency(categorySpend.reduce((sum, item) => sum + item.value, 0))}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-2">
                {categorySpend.slice(0, 4).map((item, index) => (
                  <div key={item.name} className="flex min-w-0 items-center gap-2 text-xs">
                    <i
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="truncate text-muted">{item.name}</span>
                    <span className="ml-auto font-medium">{currency(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              title="No expenses yet"
              description="Add an expense to see your category breakdown."
            />
          )}
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <article className="card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Monthly spending</h2>
              <p className="mt-1 text-xs text-muted">Compare income and expenses, month by month</p>
            </div>
            <button
              onClick={() => navigate('/analytics')}
              className="text-xs font-semibold text-violet hover:underline"
            >
              View analytics
            </button>
          </div>
          {monthlyRows.length ? (
            <div className="h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyRows}
                  barGap={5}
                  margin={{ top: 8, right: 0, left: -18, bottom: 0 }}
                >
                  <CartesianGrid stroke="var(--line)" strokeDasharray="4 5" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={monthFmt}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      `₹${value >= 1000 ? `${Math.round(value / 1000)}k` : value}`
                    }
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#8b5cf6" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No monthly data"
              description="Your chart appears as transactions are recorded."
            />
          )}
        </article>

        <article className="card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Recent activity</h2>
              <p className="mt-1 text-xs text-muted">Your latest transactions</p>
            </div>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs font-semibold text-violet hover:underline"
            >
              See all
            </button>
          </div>
          {recent.length ? (
            <div className="space-y-1">
              {recent.map((item) => {
                const income = item.type === 'income';
                const category = getCategoryName(item.categoryId) || 'Transaction';
                return (
                  <div
                    key={getId(item)}
                    className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-white/[.03]"
                  >
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${income ? 'bg-mint/10 text-mint' : 'bg-violet/10 text-violet'}`}
                    >
                      <CreditCard size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.description || category}</p>
                      <p className="mt-1 text-[11px] text-muted">
                        {category} · {dateLabel(item.date, { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-semibold ${income ? 'text-mint' : 'text-main'}`}
                    >
                      {income ? '+' : '−'}
                      {currency(item.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="A fresh start"
              description="Your transactions will show up here."
              action={
                <button
                  onClick={() => navigate('/transactions?new=1')}
                  className="button-secondary mt-4"
                >
                  <Plus size={15} /> Add one
                </button>
              }
            />
          )}
        </article>
      </section>

      {dashboard?.budgetStatus?.length > 0 && (
        <section className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Budget pulse</h2>
              <p className="mt-1 text-xs text-muted">Spending against your active plans</p>
            </div>
            <button
              onClick={() => navigate('/budgets')}
              className="text-xs font-semibold text-violet hover:underline"
            >
              Manage budgets
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dashboard.budgetStatus.slice(0, 3).map((item) => {
              const ratio = Math.min(100, item.percentUsed || 0);
              const alert = item.status !== 'on_track';
              return (
                <div key={getId(item.budgetId)} className="rounded-xl border border-line p-4">
                  <div className="flex justify-between gap-3">
                    <p className="truncate text-sm font-medium">
                      {getCategoryName(item.category) || 'Overall budget'}
                    </p>
                    <p className={`text-xs font-semibold ${alert ? 'text-amber' : 'text-mint'}`}>
                      {item.percentUsed}%
                    </p>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${item.status === 'over_budget' ? 'bg-rose' : alert ? 'bg-amber' : 'bg-violet'}`}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {currency(item.spent)} of {currency(item.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
