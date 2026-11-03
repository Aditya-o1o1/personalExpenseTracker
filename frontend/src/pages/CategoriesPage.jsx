import { useState } from 'react';
import { BriefcaseBusiness, Bus, CircleDollarSign, Clapperboard, Edit3, GraduationCap, HeartPulse, House, Plus, ShoppingBag, Tags, Trash2, Utensils, X } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { confirmAction, toast } from '../lib/alerts';
import { getId } from '../lib/format';
import { EmptyState, ErrorState, LoadingState } from '../components/ui';

const categoryIcons = [
  { label: 'Food', icon: Utensils }, { label: 'Groceries', icon: ShoppingBag }, { label: 'Dining', icon: Utensils },
  { label: 'Shopping', icon: ShoppingBag }, { label: 'Transport', icon: Bus }, { label: 'Fuel', icon: Bus },
  { label: 'Bills', icon: BriefcaseBusiness }, { label: 'utilities', icon: BriefcaseBusiness },
  { label: 'Housing', icon: House }, { label: 'Rent', icon: House }, { label: 'Education', icon: GraduationCap },
  { label: 'Healthcare', icon: HeartPulse }, { label: 'Entertainment', icon: Clapperboard },
  { label: 'Travel', icon: Bus }, { label: 'Subscriptions', icon: BriefcaseBusiness },
  { label: 'Personal care', icon: CircleDollarSign }, { label: 'Gifts', icon: CircleDollarSign },
  { label: 'Salary', icon: CircleDollarSign }, { label: 'Freelance', icon: BriefcaseBusiness },
  { label: 'Business', icon: BriefcaseBusiness }, { label: 'Investments', icon: CircleDollarSign },
  { label: 'Rental income', icon: House }, { label: 'Other', icon: CircleDollarSign },
];
const colorList = ['violet', 'mint', 'amber', 'sky', 'rose'];
const starterCategories = [
  ...[
    'Food', 'Groceries', 'Dining', 'Shopping', 'Transport', 'Fuel', 'Bills & utilities',
    'Housing', 'Rent', 'Education', 'Healthcare', 'Entertainment', 'Travel',
    'Subscriptions', 'Personal care', 'Gifts & donations', 'Other expenses',
  ]
    .map((name) => ({ name, type: 'expense' })),
  ...['Salary', 'Freelance', 'Business', 'Investments', 'Rental income', 'Gifts', 'Other income']
    .map((name) => ({ name, type: 'income' })),
];
const chooseIcon = (name = '') => {
  const found = categoryIcons.find(({ label }) => name.toLowerCase().includes(label.toLowerCase()));
  return found?.icon || Tags;
};
const colorFor = (name = '') => colorList[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % colorList.length];

function CategoryDialog({ initial, onClose, onSaved }) {
  const [values, setValues] = useState(initial ? { name: initial.name, type: initial.type } : { name: '', type: 'expense' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (initial) await apiRequest(`/category/update/${getId(initial)}`, { method: 'PUT', body: values });
      else await apiRequest('/category/add', { method: 'POST', body: values });
      toast('success', initial ? 'Category updated' : 'Category created');
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-labelledby="category-title" className="w-full max-w-md rounded-3xl border border-line bg-[var(--surface)] p-6 shadow-2xl">
      <div className="mb-6 flex items-start justify-between"><div><h2 id="category-title" className="text-xl font-semibold">{initial ? 'Edit category' : 'Create category'}</h2><p className="mt-1 text-sm text-muted">Keep your spending organized.</p></div><button onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-white/5" aria-label="Close"><X size={18} /></button></div>
      <form className="space-y-4" onSubmit={submit}>
        {error && <p role="alert" className="rounded-xl border border-rose/20 bg-rose/5 p-3 text-sm text-rose">{error}</p>}
        <div><label className="label" htmlFor="category-name">Category name</label><input id="category-name" className="field" minLength="2" maxLength="50" required value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} placeholder="e.g. Travel" /></div>
        <div><label className="label" htmlFor="category-type">Category type</label><select className="field" id="category-type" value={values.type} onChange={(event) => setValues({ ...values, type: event.target.value })}><option value="expense">Expense</option><option value="income">Income</option></select></div>
        <p className="rounded-xl bg-white/[.03] p-3 text-xs leading-5 text-muted">Icons and colors are chosen automatically in the interface. The API stores category name and type.</p>
        <div className="flex justify-end gap-2 pt-2"><button type="button" className="button-secondary" onClick={onClose}>Cancel</button><button disabled={busy} className="button-primary disabled:opacity-60">{busy ? 'Saving…' : initial ? 'Save changes' : 'Create category'}</button></div>
      </form>
    </div>
  </div>;
}

export default function CategoriesPage() {
  const [dialog, setDialog] = useState(null);
  const [type, setType] = useState('');
  const [seeding, setSeeding] = useState(false);
  const { data: result, loading, error, reload } = useAsync(
    () => apiRequest(`/category/listing?limit=100${type ? `&type=${type}` : ''}`),
    [type],
  );
  const categories = result?.categories || [];

  const addStarterCategories = async () => {
    setSeeding(true);
    const existing = new Set(categories.map((category) => `${category.name.toLowerCase()}:${category.type}`));
    const suggestions = type
      ? starterCategories.filter((category) => category.type === type)
      : starterCategories;
    const missing = suggestions.filter((category) => !existing.has(`${category.name.toLowerCase()}:${category.type}`));
    if (missing.length === 0) {
      setSeeding(false);
      toast('info', 'You already have all suggested categories');
      return;
    }
    const outcomes = await Promise.allSettled(
      missing.map((category) => apiRequest('/category/add', { method: 'POST', body: category })),
    );
    const failures = outcomes.filter((outcome) => outcome.status === 'rejected');
    await reload();
    setSeeding(false);
    const added = outcomes.length - failures.length;
    if (failures.length) toast('error', `${added} added; ${failures.length} could not be added.`);
    else toast('success', `${missing.length} starter categories added`);
  };

  const remove = async (category) => {
    if (!await confirmAction('Delete this category?', 'This category will no longer appear in your active list.', 'Delete')) return;
    try {
      await apiRequest(`/category/delete/${getId(category)}`, { method: 'DELETE' });
      toast('success', 'Category deleted');
      reload();
    } catch (requestError) {
      toast('error', requestError.message);
    }
  };

  return <div className="animate-in space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[.17em] text-violet">Make it yours</p><h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">Categories</h1><p className="mt-2 text-sm text-muted">A simple way to understand where things go.</p></div><div className="flex flex-wrap gap-2 self-start sm:self-auto"><button disabled={seeding || loading} title={type ? `Add any missing ${type} suggestions` : 'Add any missing suggested categories'} className="button-secondary disabled:cursor-not-allowed disabled:opacity-50" onClick={addStarterCategories}>{seeding ? 'Adding suggestions…' : 'Add suggestions'}</button><button className="button-primary" onClick={() => setDialog({ mode: 'create' })}><Plus size={16} /> Add category</button></div></div>
    <div className="flex flex-wrap gap-2"><button className={`rounded-xl border px-4 py-2 text-sm font-medium ${!type ? 'border-violet/40 bg-violet/10 text-violet' : 'border-line text-muted'}`} onClick={() => setType('')}>All categories</button><button className={`rounded-xl border px-4 py-2 text-sm font-medium ${type === 'expense' ? 'border-violet/40 bg-violet/10 text-violet' : 'border-line text-muted'}`} onClick={() => setType('expense')}>Expenses</button><button className={`rounded-xl border px-4 py-2 text-sm font-medium ${type === 'income' ? 'border-violet/40 bg-violet/10 text-violet' : 'border-line text-muted'}`} onClick={() => setType('income')}>Income</button></div>
    {loading ? <LoadingState label="Loading categories…" /> : error ? <ErrorState message={error} onRetry={reload} /> : categories.length ? <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => {
        const Icon = chooseIcon(category.name);
        const color = colorFor(category.name);
        const tint = color === 'violet' ? 'bg-violet/10 text-violet' : color === 'mint' ? 'bg-mint/10 text-mint' : color === 'amber' ? 'bg-amber/10 text-amber' : color === 'sky' ? 'bg-sky-400/10 text-sky-400' : 'bg-rose/10 text-rose';
        return <article key={getId(category)} className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:border-violet/25">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tint}`}><Icon size={20} /></div>
          <div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{category.name}</h2><p className="mt-1 text-xs capitalize text-muted">{category.type} category</p></div>
          <div className="flex gap-1 opacity-70 transition group-hover:opacity-100"><button className="rounded-lg p-2 text-muted hover:bg-violet/10 hover:text-violet" onClick={() => setDialog({ mode: 'edit', category })} aria-label={`Edit ${category.name}`}><Edit3 size={15} /></button><button className="rounded-lg p-2 text-muted hover:bg-rose/10 hover:text-rose" onClick={() => remove(category)} aria-label={`Delete ${category.name}`}><Trash2 size={15} /></button></div>
        </article>;
      })}
    </section> : <EmptyState title="Add categories that fit you" description="New accounts start with suggested income and expense categories. You can add them here too." action={<button disabled={seeding} className="button-secondary mt-4 disabled:opacity-60" onClick={addStarterCategories}>{seeding ? 'Adding suggestions…' : 'Add suggested categories'}</button>} />}
    {dialog && <CategoryDialog initial={dialog.mode === 'edit' ? dialog.category : null} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); reload(); }} />}
  </div>;
}
