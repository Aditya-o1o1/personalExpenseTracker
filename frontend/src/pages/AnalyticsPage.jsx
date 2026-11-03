import { useMemo, useRef, useState } from 'react';
import { Download, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { apiRequest, queryString } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { useTheme } from '../context/ThemeContext';
import { toast } from '../lib/alerts';
import { currency, dateLabel, getId } from '../lib/format';
import DatePicker from '../components/DatePicker';
import { EmptyState, ErrorState, LoadingState } from '../components/ui';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#38bdf8', '#f43f5e', '#a78bfa', '#14b8a6'];
const shortPeriod = (value, period) => {
  const date = new Date(value);
  if (period === 'daily') return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(date);
  if (period === 'weekly') return `Week ${new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(date)}`;
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' }).format(date);
};

function AnalyticsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-xl border border-line bg-[var(--surface)] p-3 shadow-xl"><p className="mb-2 text-xs text-muted">{label}</p>{payload.map((item) => <p key={item.dataKey} className="text-xs font-medium" style={{ color: item.color }}>{item.name}: {currency(item.value)}</p>)}</div>;
}

export default function AnalyticsPage() {
  const reportRef = useRef(null);
  const [period, setPeriod] = useState('monthly');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { theme } = useTheme();
  const params = { period, dateFrom, dateTo };
  const { data: report, loading, error, reload } = useAsync(
    () => apiRequest(`/reports/summary${queryString(params)}`).then((result) => result.report),
    [period, dateFrom, dateTo],
  );
  const { data: transactionsResult, loading: txLoading, error: txError } = useAsync(
    () => apiRequest(`/transaction/listing${queryString({
      limit: 100,
      type: 'expense',
      dateFrom: dateFrom || report?.period?.dateFrom,
      dateTo: dateTo || report?.period?.dateTo,
    })}`),
    [dateFrom, dateTo, report?.period?.dateFrom, report?.period?.dateTo],
  );
  const { data: categoriesResult } = useAsync(() => apiRequest('/category/listing?limit=100'), []);
  const categoryMap = useMemo(() => new Map(
    (categoriesResult?.categories || []).map((category) => [getId(category), category.name]),
  ), [categoriesResult]);

  const summary = report?.summary || {};
  const rows = report?.summaries || [];
  const dailyAverage = useMemo(() => {
    if (!report?.period?.dateFrom || !report?.period?.dateTo) return 0;
    const days = Math.max(1, Math.ceil((new Date(report.period.dateTo) - new Date(report.period.dateFrom)) / 86400000) + 1);
    return (summary.expenses || 0) / days;
  }, [report, summary.expenses]);
  const savingsRate = summary.income ? Math.round((summary.balance / summary.income) * 100) : 0;
  const categoryRows = useMemo(() => {
    const categories = new Map();
    (transactionsResult?.Transactions || []).forEach((transaction) => {
      const name = transaction.categoryId?.name || categoryMap.get(getId(transaction.categoryId)) || 'Other';
      categories.set(name, (categories.get(name) || 0) + Number(transaction.amount));
    });
    return [...categories].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 7);
  }, [transactionsResult, categoryMap]);
  const highest = categoryRows[0];

  const downloadPdf = async () => {
    if (!reportRef.current) return;
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `spendwise-report-${period}-${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: theme === 'dark' ? '#0b1120' : '#f4f6fb' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }).from(reportRef.current).save();
      toast('success', 'Your report is ready');
    } catch (downloadError) {
      toast('error', `Could not create PDF: ${downloadError.message}`);
    }
  };

  return <div className="animate-in space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.17em] text-violet">See the bigger picture</p><h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">Financial analytics</h1><p className="mt-2 text-sm text-muted">Patterns, not pressure. Your activity, clearly summarized.</p></div>
      <button onClick={downloadPdf} className="button-secondary self-start sm:self-auto"><Download size={16} /> Download PDF</button>
    </div>
    <section className="no-print card grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
      <div><label className="label" htmlFor="period">View by</label><select className="field" id="period" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="daily">Daily · 30 days</option><option value="weekly">Weekly · 12 weeks</option><option value="monthly">Monthly · 12 months</option></select></div>
      <div><label className="label" htmlFor="date-from">From date <span className="font-normal">(optional)</span></label><DatePicker id="date-from" value={dateFrom} max={dateTo || undefined} ariaLabel="From date" onChange={setDateFrom} /></div>
      <div><label className="label" htmlFor="date-to">To date <span className="font-normal">(optional)</span></label><DatePicker id="date-to" value={dateTo} min={dateFrom || undefined} ariaLabel="To date" onChange={setDateTo} /></div>
    </section>

    {loading ? <LoadingState label="Preparing your report…" /> : error ? <ErrorState message={error} onRetry={reload} /> : <div ref={reportRef} className="space-y-6">
      <div className="mb-2 hidden rounded-xl border border-line p-4 text-center text-lg font-semibold print:block">SpendWise · Financial report</div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Income" amount={summary.income} tone="text-mint" icon={TrendingUp} />
        <Metric label="Expenses" amount={summary.expenses} tone="text-rose" icon={TrendingDown} />
        <Metric label="Net savings" amount={summary.balance} tone={summary.balance < 0 ? 'text-rose' : 'text-violet'} icon={summary.balance < 0 ? TrendingDown : TrendingUp} />
        <article className="card p-5"><p className="text-sm text-muted">Savings rate</p><p className="mt-3 text-2xl font-semibold">{savingsRate}%</p><p className="mt-2 text-xs text-muted">Of recorded income in this range</p></article>
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <article className="card p-5 sm:p-6">
          <div className="mb-5"><h2 className="font-semibold">Income & expense trend</h2><p className="mt-1 text-xs text-muted">From {report?.period?.dateFrom ? dateLabel(report.period.dateFrom) : '—'} to {report?.period?.dateTo ? dateLabel(report.period.dateTo) : '—'}</p></div>
          {rows.length ? <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={rows} margin={{ top: 8, right: 2, left: -18, bottom: 0 }}><CartesianGrid stroke="var(--line)" strokeDasharray="4 5" vertical={false} /><XAxis dataKey="date" tickFormatter={(value) => shortPeriod(value, period)} tickLine={false} axisLine={false} minTickGap={28} tick={{ fill: '#94a3b8', fontSize: 10 }} /><YAxis tickFormatter={(value) => `₹${value >= 1000 ? `${Math.round(value / 1000)}k` : value}`} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} /><Tooltip content={<AnalyticsTooltip />} /><Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} /><Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} /></ComposedChart></ResponsiveContainer></div> : <EmptyState title="No activity in this range" description="Change the date range or add a transaction." />}
        </article>
        <article className="card p-5 sm:p-6">
          <div className="mb-4"><h2 className="font-semibold">Category breakdown</h2><p className="mt-1 text-xs text-muted">Latest 100 expenses in selected dates</p></div>
          {txError ? <p className="text-sm text-rose">{txError}</p> : txLoading ? <LoadingState label="Loading categories…" /> : categoryRows.length ? <>
            <div className="h-[200px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryRows} dataKey="amount" nameKey="name" innerRadius={55} outerRadius={83} paddingAngle={3} stroke="none">{categoryRows.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => currency(value)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12 }} itemStyle={{ color: theme === 'dark' ? '#ffffff' : '#142033' }} labelStyle={{ color: theme === 'dark' ? '#ffffff' : '#142033' }} /></PieChart></ResponsiveContainer></div>
            <div className="space-y-2">{categoryRows.slice(0, 5).map((item, index) => <div key={item.name} className="flex items-center gap-2 text-xs"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} /><span className="flex-1 truncate text-muted">{item.name}</span><span className="font-medium">{currency(item.amount)}</span></div>)}</div>
          </> : <EmptyState title="No expenses to break down" description="Your category view will grow with your transactions." />}
        </article>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <article className="card p-5"><p className="text-sm text-muted">Average daily expenses</p><p className="mt-3 text-2xl font-semibold">{currency(dailyAverage)}</p><p className="mt-2 text-xs text-muted">Across the selected date range</p></article>
        <article className="card p-5"><p className="text-sm text-muted">Highest spending category</p><p className="mt-3 truncate text-xl font-semibold">{highest?.name || '—'}</p><p className="mt-2 text-xs text-muted">{highest ? `${currency(highest.amount)} in the latest 100 expense records` : 'No expenses recorded'}</p></article>
        <article className="card p-5"><p className="text-sm text-muted">Transactions recorded</p><p className="mt-3 text-2xl font-semibold">{summary.transactionCount || 0}</p><p className="mt-2 text-xs text-muted capitalize">{period} reporting periods</p></article>
      </section>
    </div>}
  </div>;
}

function Metric({ label, amount, tone, icon: Icon }) {
  return <article className="card p-5"><div className="flex items-start justify-between"><p className="text-sm text-muted">{label}</p><Icon size={18} className={tone} /></div><p className={`mt-4 text-2xl font-semibold ${tone}`}>{currency(amount)}</p></article>;
}
