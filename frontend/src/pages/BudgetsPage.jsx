import { useMemo, useState } from 'react';
import { CalendarDays, Edit3, Plus, ShieldAlert, Trash2, WalletCards } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { confirmAction, toast } from '../lib/alerts';
import { currency, dateLabel, getCategoryName, getId, toDateInput } from '../lib/format';
import DatePicker from '../components/DatePicker';
import { EmptyState, ErrorState, LoadingState } from '../components/ui';

const initialBudget = () => ({ amount: '', period: 'monthly', categoryId: '', startDate: toDateInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), endDate: '' });

function BudgetDialog({ initial, categories, onClose, onSaved }) {
  const [values, setValues] = useState(initial || initialBudget());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const endDateMinimum = values.startDate
    ? toDateInput(new Date(`${values.startDate}T00:00:00.000Z`).getTime() + 86400000)
    : undefined;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!values.startDate) {
      setError('Choose a budget start date.');
      return;
    }
    if (values.endDate && values.endDate <= values.startDate) {
      setError('End date must be after the start date.');
      return;
    }
    setBusy(true);
    try {
      const body = {
        amount: Number(values.amount),
        period: values.period,
        categoryId: values.categoryId || null,
        startDate: new Date(`${values.startDate}T00:00:00.000Z`).toISOString(),
        endDate: values.endDate ? new Date(`${values.endDate}T00:00:00.000Z`).toISOString() : null,
      };
      if (initial) await apiRequest(`/budget/update/${getId(initial)}`, { method: 'PUT', body });
      else await apiRequest('/budget/create', { method: 'POST', body });
      toast('success', initial ? 'Budget updated' : 'Budget created');
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/65 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-labelledby="budget-title" className="my-auto w-full max-w-lg rounded-3xl border border-line bg-[var(--surface)] p-5 shadow-2xl sm:p-7">
      <div className="mb-6 flex justify-between"><div><h2 id="budget-title" className="text-xl font-semibold">{initial ? 'Edit budget' : 'Create a budget'}</h2><p className="mt-1 text-sm text-muted">Make space for what matters.</p></div><button onClick={onClose} className="text-muted" aria-label="Close">✕</button></div>
      <form className="space-y-4" onSubmit={submit}>
        {error && <p role="alert" className="rounded-xl border border-rose/20 bg-rose/5 p-3 text-sm text-rose">{error}</p>}
        <div><label className="label" htmlFor="budget-amount">Spending limit (INR)</label><input id="budget-amount" className="field" type="number" min="0.01" step="0.01" value={values.amount} onChange={(event) => setValues({ ...values, amount: event.target.value })} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="budget-period">Period</label><select className="field" id="budget-period" value={values.period} onChange={(event) => setValues({ ...values, period: event.target.value })}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
          <div><label className="label" htmlFor="budget-category">Category</label><select className="field" id="budget-category" value={values.categoryId} onChange={(event) => setValues({ ...values, categoryId: event.target.value })}><option value="">All expenses</option>{categories.filter((category) => category.type === 'expense').map((category) => <option key={getId(category)} value={getId(category)}>{category.name}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="budget-start">Start date</label><DatePicker id="budget-start" required value={values.startDate} onChange={(startDate) => setValues({ ...values, startDate })} ariaLabel="Budget start date" /></div>
          <div><label className="label" htmlFor="budget-end">End date <span className="font-normal">(optional)</span></label><DatePicker id="budget-end" min={endDateMinimum} value={values.endDate || ''} onChange={(endDate) => setValues({ ...values, endDate })} ariaLabel="Budget end date" /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" className="button-secondary" onClick={onClose}>Cancel</button><button disabled={busy} className="button-primary disabled:opacity-60">{busy ? 'Saving…' : initial ? 'Save changes' : 'Create budget'}</button></div>
      </form>
    </div>
  </div>;
}

export default function BudgetsPage() {
  const [dialog, setDialog] = useState(null);
  const { data: result, loading, error, reload } = useAsync(() => apiRequest('/budget/listing?limit=100'), []);
  const { data: categoryResult } = useAsync(() => apiRequest('/category/listing?limit=100'), []);
  const budgets = result?.Budget || [];
  const categories = categoryResult?.categories || [];
  const categoryMap = useMemo(() => new Map(categories.map((item) => [getId(item), item.name])), [categories]);
  const now = new Date();
  const currentBudgets = budgets.filter((item) => (
    new Date(item.startDate) <= now && (!item.endDate || new Date(item.endDate) >= now)
  ));
  const totalLimit = currentBudgets.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalSpent = currentBudgets.reduce((sum, item) => sum + Number(item.spent || 0), 0);

  const deleteBudget = async (budget) => {
    if (!await confirmAction('Delete this budget?', 'You can create a new plan any time.', 'Delete')) return;
    try {
      await apiRequest(`/budget/delete/${getId(budget)}`, { method: 'DELETE' });
      toast('success', 'Budget deleted');
      reload();
    } catch (requestError) {
      toast('error', requestError.message);
    }
  };

  return <div className="animate-in space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[.17em] text-violet">Plan with intention</p><h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">Budget planner</h1><p className="mt-2 text-sm text-muted">Build a little breathing room into your month.</p></div><button className="button-primary self-start sm:self-auto" onClick={() => setDialog({ mode: 'create' })}><Plus size={16} /> Create budget</button></div>
    <section className="grid gap-4 md:grid-cols-3">
      <article className="card relative overflow-hidden p-5"><div className="absolute -right-7 -top-8 h-24 w-24 rounded-full bg-violet/20 blur-3xl" /><p className="relative text-sm text-muted">Planned spending</p><p className="relative mt-3 text-2xl font-semibold">{currency(totalLimit)}</p><p className="relative mt-2 text-xs text-muted">{currentBudgets.length} active plans</p></article>
      <article className="card relative overflow-hidden p-5"><div className="absolute -right-7 -top-8 h-24 w-24 rounded-full bg-rose/15 blur-3xl" /><p className="relative text-sm text-muted">Combined budget usage</p><p className="relative mt-3 text-2xl font-semibold">{currency(totalSpent)}</p><p className="relative mt-2 text-xs text-muted">Sum across each active plan</p></article>
      <article className="card relative overflow-hidden p-5"><div className="absolute -right-7 -top-8 h-24 w-24 rounded-full bg-mint/15 blur-3xl" /><p className="relative text-sm text-muted">Room remaining</p><p className="relative mt-3 text-2xl font-semibold">{currency(Math.max(totalLimit - totalSpent, 0))}</p><p className="relative mt-2 text-xs text-muted">Across active plans</p></article>
    </section>
    <p className="text-xs text-muted">If budgets overlap, the same expense can count toward more than one plan.</p>
    {loading ? <LoadingState label="Loading your budgets…" /> : error ? <ErrorState message={error} onRetry={reload} /> : budgets.length === 0 ? <EmptyState title="Give your goals a number" description="Create a budget for a category or your overall spending." action={<button className="button-primary mt-4" onClick={() => setDialog({ mode: 'create' })}><Plus size={15} /> Create a budget</button>} /> : <section className="grid gap-4 lg:grid-cols-2">
      {budgets.map((budget) => {
        const spent = Number(budget.spent || 0);
        const limit = Number(budget.amount || 0);
        const percent = Math.round((budget.percentUsed ?? (limit ? spent / limit * 100 : 0)) || 0);
        const status = budget.status || (spent >= limit ? 'over_budget' : spent >= limit * .8 ? 'near_limit' : 'on_track');
        const color = status === 'over_budget' ? 'bg-rose' : status === 'near_limit' ? 'bg-amber' : 'bg-violet';
        const category = getCategoryName(budget.categoryId) || categoryMap.get(getId(budget.categoryId)) || 'All expenses';
        return <article key={getId(budget)} className="card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${status === 'over_budget' ? 'bg-rose/10 text-rose' : status === 'near_limit' ? 'bg-amber/10 text-amber' : 'bg-violet/10 text-violet'}`}><WalletCards size={20} /></div><div className="min-w-0"><h2 className="truncate font-semibold">{category}</h2><p className="mt-1 flex items-center gap-1.5 text-xs capitalize text-muted"><CalendarDays size={13} />{budget.period} budget</p></div></div><div className="flex gap-1"><button className="rounded-lg p-2 text-muted hover:bg-violet/10 hover:text-violet" onClick={() => setDialog({ mode: 'edit', budget: { ...budget, categoryId: getId(budget.categoryId), startDate: toDateInput(budget.startDate), endDate: budget.endDate ? toDateInput(budget.endDate) : '' } })} title="Edit budget"><Edit3 size={15} /></button><button className="rounded-lg p-2 text-muted hover:bg-rose/10 hover:text-rose" onClick={() => deleteBudget(budget)} title="Delete budget"><Trash2 size={15} /></button></div></div>
          <div className="mt-6 flex items-end justify-between"><div><p className="text-xs text-muted">Spent so far</p><p className="mt-1 text-xl font-semibold">{currency(spent)}</p></div><p className="text-right text-xs text-muted">of <span className="font-semibold text-main">{currency(limit)}</span><br />{Math.max(limit - spent, 0) > 0 ? `${currency(limit - spent)} remaining` : `${currency(spent - limit)} over limit`}</p></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[.06]"><div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} /></div>
          <div className="mt-2 flex items-center justify-between"><p className={`flex items-center gap-1 text-xs ${status === 'on_track' ? 'text-muted' : status === 'near_limit' ? 'text-amber' : 'text-rose'}`}>{status !== 'on_track' && <ShieldAlert size={13} />}{status === 'on_track' ? 'On track' : status === 'near_limit' ? 'Near your limit' : 'Over budget'}</p><p className={`text-xs font-semibold ${status === 'on_track' ? 'text-violet' : status === 'near_limit' ? 'text-amber' : 'text-rose'}`}>{percent}%</p></div>
          <div className="mt-4 border-t border-line pt-3 text-xs text-muted">From {dateLabel(budget.startDate)}{budget.endDate ? ` · through ${dateLabel(budget.endDate)}` : ' · no end date'}</div>
        </article>;
      })}
    </section>}
    {dialog && <BudgetDialog initial={dialog.mode === 'edit' ? dialog.budget : null} categories={categories} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); reload(); }} />}
  </div>;
}
