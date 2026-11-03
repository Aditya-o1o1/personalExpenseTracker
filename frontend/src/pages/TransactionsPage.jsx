import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownUp, Download, Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import { apiRequest, queryString } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { confirmAction, toast } from '../lib/alerts';
import { currency, dateLabel, getCategoryName, getId, toDateInput } from '../lib/format';
import DatePicker from '../components/DatePicker';
import { EmptyState, ErrorState, LoadingState } from '../components/ui';

const blankForm = () => ({ type: 'expense', amount: '', categoryId: '', description: '', date: toDateInput() });

function TransactionDialog({ initial, categories, onClose, onSaved }) {
  const [values, setValues] = useState(initial || blankForm());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const filteredCategories = categories.filter((category) => category.type === values.type);

  const submit = async (event) => {
    event.preventDefault();
    if (!values.date) {
      setError('Choose a transaction date.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const body = {
        ...values,
        amount: Number(values.amount),
        date: new Date(`${values.date}T00:00:00`).toISOString(),
      };
      if (initial?._id || initial?.id) {
        await apiRequest(`/transaction/update/${getId(initial)}`, { method: 'PUT', body });
      } else {
        await apiRequest('/transaction/add', { method: 'POST', body });
      }
      toast('success', initial ? 'Transaction updated' : 'Transaction added');
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/65 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-labelledby="transaction-dialog-title" className="my-auto w-full max-w-lg rounded-3xl border border-line bg-[var(--surface)] p-5 shadow-2xl sm:p-7">
      <div className="mb-6 flex items-start justify-between"><div><h2 id="transaction-dialog-title" className="text-xl font-semibold">{initial ? 'Edit transaction' : 'Add transaction'}</h2><p className="mt-1 text-sm text-muted">Capture the details that matter.</p></div><button className="rounded-lg p-2 text-muted hover:bg-white/5" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
      <form className="space-y-4" onSubmit={submit}>
        {error && <p role="alert" className="rounded-xl border border-rose/20 bg-rose/5 px-3 py-2 text-sm text-rose">{error}</p>}
        <div><label className="label">Type</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setValues((v) => ({ ...v, type: 'expense', categoryId: '' }))} className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${values.type === 'expense' ? 'border-rose/40 bg-rose/10 text-rose' : 'border-line text-muted'}`}>Expense</button><button type="button" onClick={() => setValues((v) => ({ ...v, type: 'income', categoryId: '' }))} className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${values.type === 'income' ? 'border-mint/40 bg-mint/10 text-mint' : 'border-line text-muted'}`}>Income</button></div></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="amount" className="label">Amount (INR)</label><input id="amount" className="field" type="number" min="0.01" step="0.01" required value={values.amount} onChange={(event) => setValues({ ...values, amount: event.target.value })} placeholder="0.00" /></div>
          <div><label htmlFor="date" className="label">Date</label><DatePicker id="date" value={values.date} max={toDateInput()} required ariaLabel="Transaction date" onChange={(date) => setValues({ ...values, date })} /></div>
        </div>
        <div><label htmlFor="category" className="label">Category</label><select id="category" className="field" required value={values.categoryId} onChange={(event) => setValues({ ...values, categoryId: event.target.value })}><option value="">Choose category</option>{filteredCategories.map((category) => <option key={getId(category)} value={getId(category)}>{category.name}</option>)}</select>{filteredCategories.length === 0 && <p className="mt-1 text-xs text-amber">Add a {values.type} category before creating a transaction.</p>}</div>
        <div><label htmlFor="description" className="label">Title / description</label><input id="description" className="field" maxLength="200" value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} placeholder="e.g. Coffee with friends" /></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" className="button-secondary" onClick={onClose}>Cancel</button><button disabled={busy || filteredCategories.length === 0} className="button-primary disabled:opacity-50">{busy ? 'Saving…' : initial ? 'Save changes' : 'Add transaction'}</button></div>
      </form>
    </div>
  </div>;
}

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [type, setType] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const filters = { page, limit: 10, search: query, type, categoryId, dateFrom, dateTo };
  const { data: result, loading, error, reload } = useAsync(
    () => apiRequest(`/transaction/listing${queryString(filters)}`),
    [page, query, type, categoryId, dateFrom, dateTo],
  );
  const { data: categoriesResult } = useAsync(() => apiRequest('/category/listing?limit=100'), []);
  const categories = categoriesResult?.categories || [];
  const transactions = result?.Transactions || [];
  const sortedTransactions = useMemo(() => [...transactions].sort((a, b) => {
    if (sort === 'oldest') return new Date(a.date) - new Date(b.date);
    if (sort === 'amount-high') return b.amount - a.amount;
    if (sort === 'amount-low') return a.amount - b.amount;
    return new Date(b.date) - new Date(a.date);
  }), [transactions, sort]);

  useEffect(() => {
    setQuery(searchParams.get('search') || '');
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setDialog({ mode: 'create' });
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const clearFilters = () => { setQuery(''); setType(''); setCategoryId(''); setDateFrom(''); setDateTo(''); setPage(1); setSearchParams({}); };
  const deleteTransaction = async (transaction) => {
    const confirmed = await confirmAction('Delete this transaction?', 'This transaction will be removed from your records.', 'Delete');
    if (!confirmed) return;
    try {
      await apiRequest(`/transaction/delete/${getId(transaction)}`, { method: 'DELETE' });
      toast('success', 'Transaction deleted');
      reload();
    } catch (requestError) {
      toast('error', requestError.message);
    }
  };

  const exportCsv = async () => {
    try {
      const rows = [];
      let currentPage = 1;
      let total = 0;
      do {
        const result = await apiRequest(`/transaction/listing${queryString({
          ...filters,
          page: currentPage,
          limit: 100,
        })}`);
        rows.push(...(result.Transactions || []));
        total = result.pagination?.total ?? rows.length;
        currentPage += 1;
      } while (rows.length < total);
      if (!rows.length) return toast('info', 'No transactions to export');
      const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
      const csv = ['Date,Title,Category,Type,Amount (INR)', ...rows.map((item) => {
        const category = categories.find((entry) => getId(entry) === getId(item.categoryId))?.name || 'Other';
        return [item.date?.slice(0, 10), item.description || category, category, item.type, item.amount].map(quote).join(',');
      })].join('\r\n');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      link.download = 'spendwise-transactions.csv';
      link.click();
      URL.revokeObjectURL(link.href);
      toast('success', `Exported ${rows.length} transactions`);
    } catch (requestError) {
      toast('error', requestError.message);
    }
  };

  return <div className="animate-in space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[.17em] text-violet">Your ledger</p><h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">Transactions</h1><p className="mt-2 text-sm text-muted">Every small choice, in one clear place.</p></div><div className="flex gap-2"><button onClick={exportCsv} className="button-secondary"><Download size={16} /> Export CSV</button><button onClick={() => setDialog({ mode: 'create' })} className="button-primary"><Plus size={16} /> Add transaction</button></div></div>
    <section className="card p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1.3fr)_repeat(4,minmax(120px,1fr))_auto]">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} /><input className="field !pl-9" placeholder="Search description or category..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></div>
        <select className="field" aria-label="Transaction type" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}><option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option></select>
        <select className="field" aria-label="Category" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }}><option value="">All categories</option>{categories.map((item) => <option key={getId(item)} value={getId(item)}>{item.name}</option>)}</select>
        <DatePicker ariaLabel="From date" value={dateFrom} onChange={(date) => { setDateFrom(date); setPage(1); }} />
        <DatePicker ariaLabel="To date" value={dateTo} min={dateFrom || undefined} onChange={(date) => { setDateTo(date); setPage(1); }} />
        <select className="field" aria-label="Sort transactions" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="amount-high">Highest amount</option><option value="amount-low">Lowest amount</option></select>
      </div>
      {(query || type || categoryId || dateFrom || dateTo) && <button className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet hover:underline" onClick={clearFilters}><X size={13} /> Clear filters</button>}
    </section>
    {loading ? <LoadingState label="Loading transactions…" /> : error ? <ErrorState message={error} onRetry={reload} /> : <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="text-sm font-semibold">All activity</h2><p className="mt-1 text-xs text-muted">{result?.pagination?.total || 0} transactions found</p></div><ArrowDownUp className="text-muted" size={16} /></div>
      {!sortedTransactions.length ? <div className="p-5"><EmptyState title="Nothing to show yet" description="Try adjusting your filters or add your first transaction." action={<button className="button-primary mt-4" onClick={() => setDialog({ mode: 'create' })}><Plus size={15} /> Add transaction</button>} /></div> : <>
        <div className="overflow-x-auto scrollbar-none"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-white/[.02] text-[11px] uppercase tracking-wider text-muted"><tr><th className="px-5 py-3.5 font-semibold">Description</th><th className="px-5 py-3.5 font-semibold">Category</th><th className="px-5 py-3.5 font-semibold">Date</th><th className="px-5 py-3.5 font-semibold">Type</th><th className="px-5 py-3.5 text-right font-semibold">Amount</th><th className="px-5 py-3.5 text-right font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-[var(--line)]">{sortedTransactions.map((item) => {
          const category = categories.find((entry) => getId(entry) === getId(item.categoryId));
          const income = item.type === 'income';
          return <tr key={getId(item)} className="transition hover:bg-white/[.025]">
            <td className="px-5 py-4"><p className="font-medium">{item.description || category?.name || 'Transaction'}</p><p className="mt-1 text-xs text-muted">SpendWise entry</p></td>
            <td className="px-5 py-4"><span className="rounded-lg bg-violet/10 px-2.5 py-1 text-xs font-medium text-violet">{getCategoryName(item.categoryId) || category?.name || 'Other'}</span></td>
            <td className="px-5 py-4 text-muted">{dateLabel(item.date)}</td>
            <td className="px-5 py-4"><span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${income ? 'bg-mint/10 text-mint' : 'bg-rose/10 text-rose'}`}>{income ? 'Income' : 'Expense'}</span></td>
            <td className={`px-5 py-4 text-right font-semibold ${income ? 'text-mint' : 'text-main'}`}>{income ? '+' : '−'}{currency(item.amount)}</td>
            <td className="px-5 py-4"><div className="flex justify-end gap-1"><button className="rounded-lg p-2 text-muted hover:bg-violet/10 hover:text-violet" title="Edit transaction" onClick={() => setDialog({ mode: 'edit', transaction: { ...item, categoryId: getId(item.categoryId), date: toDateInput(item.date) } })}><Edit3 size={15} /></button><button className="rounded-lg p-2 text-muted hover:bg-rose/10 hover:text-rose" title="Delete transaction" onClick={() => deleteTransaction(item)}><Trash2 size={15} /></button></div></td>
          </tr>;
        })}</tbody></table></div>
        <div className="flex items-center justify-between border-t border-line px-5 py-3"><p className="text-xs text-muted">Page {result?.pagination?.page || page} of {Math.max(result?.pagination?.totalPages || 1, 1)}</p><div className="flex gap-2"><button className="button-secondary !px-3 !py-1.5 text-xs" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><button className="button-secondary !px-3 !py-1.5 text-xs" disabled={page >= (result?.pagination?.totalPages || 1)} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
      </>}
    </section>}
    {dialog && <TransactionDialog initial={dialog.mode === 'edit' ? dialog.transaction : null} categories={categories} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); reload(); }} />}
  </div>;
}
