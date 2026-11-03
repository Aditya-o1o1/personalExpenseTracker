import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Plus, Repeat2, Trash2 } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { confirmAction, toast } from '../lib/alerts';
import { currency, dateLabel, getId, toDateInput } from '../lib/format';
import DatePicker from '../components/DatePicker';
import { EmptyState, ErrorState, LoadingState } from '../components/ui';

const frequencyLabels = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const addRecurrenceInterval = (value, frequency) => {
  if (!value) return '';

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (frequency === 'daily') date.setDate(date.getDate() + 1);
  if (frequency === 'weekly') date.setDate(date.getDate() + 7);
  if (frequency === 'monthly' || frequency === 'yearly') {
    const monthsToAdd = frequency === 'monthly' ? 1 : 12;
    const targetMonth = month - 1 + monthsToAdd;
    const targetYear = year + Math.floor(targetMonth / 12);
    const normalizedMonth = targetMonth % 12;
    const lastDayOfTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
    date.setFullYear(targetYear, normalizedMonth, Math.min(day, lastDayOfTargetMonth));
  }

  return toDateInput(date);
};

const blankForm = () => {
  return {
    type: 'expense',
    amount: '',
    categoryId: '',
    description: '',
    frequency: 'monthly',
    startDate: toDateInput(),
    endDate: '',
  };
};

export default function RecurringTransactionsPage() {
  const [values, setValues] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const {
    data: scheduleResult,
    loading,
    error,
    reload,
  } = useAsync(() => apiRequest('/recurring-transactions'), []);
  const {
    data: categoryResult,
    loading: categoriesLoading,
    error: categoriesError,
  } = useAsync(() => apiRequest('/category/listing?limit=100'), []);
  const categories = categoryResult?.categories || [];
  const schedules = scheduleResult?.schedules || [];
  const matchingCategories = categories.filter((category) => category.type === values.type);
  const categoryNames = new Map(categories.map((category) => [getId(category), category.name]));
  const activeSchedules = schedules.filter((schedule) => schedule.isActive);

  const changeType = (type) => setValues((current) => ({ ...current, type, categoryId: '' }));
  const changeFrequency = (frequency) => setValues((current) => ({ ...current, frequency }));
  const changeStartDate = (startDate) => setValues((current) => ({ ...current, startDate }));

  const createSchedule = async (event) => {
    event.preventDefault();
    if (!values.startDate) {
      setFormError('Choose a schedule start date.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await apiRequest('/recurring-transactions', {
        method: 'POST',
        body: {
          ...values,
          amount: Number(values.amount),
          ...(values.endDate ? {} : { endDate: undefined }),
        },
      });
      setValues(blankForm());
      toast('success', 'Recurring transaction created');
      await reload();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const cancelSchedule = async (schedule) => {
    if (
      !(await confirmAction(
        'Cancel this schedule?',
        'No future transactions will be created from this schedule.',
        'Cancel schedule',
      ))
    )
      return;
    try {
      await apiRequest(`/recurring-transactions/${getId(schedule)}`, { method: 'DELETE' });
      toast('success', 'Recurring schedule cancelled');
      await reload();
    } catch (requestError) {
      toast('error', requestError.message || 'Could not cancel this schedule');
    }
  };

  return (
    <div className="animate-in space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[.17em] text-violet">
          Set it on repeat
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">
          Recurring transactions
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Schedule regular income or expenses. SpendWise creates each transaction automatically when
          it’s due.
        </p>
      </div>

      <section className="card p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet/10 text-violet">
            <Plus size={19} />
          </div>
          <div>
            <h2 className="font-semibold">Create a schedule</h2>
            <p className="text-xs text-muted">Choose the amount, category, and repeat frequency.</p>
          </div>
        </div>
        {formError && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-rose/20 bg-rose/5 px-3 py-2 text-sm text-rose"
          >
            {formError}
          </p>
        )}
        {categoriesError && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-rose/20 bg-rose/5 px-3 py-2 text-sm text-rose"
          >
            Could not load categories: {categoriesError}
          </p>
        )}
        <form className="space-y-4" onSubmit={createSchedule}>
          <div>
            <span className="label">Type</span>
            <div className="grid max-w-md grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => changeType('expense')}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${values.type === 'expense' ? 'border-rose/40 bg-rose/10 text-rose' : 'border-line text-muted'}`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => changeType('income')}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium ${values.type === 'income' ? 'border-mint/40 bg-mint/10 text-mint' : 'border-line text-muted'}`}
              >
                Income
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="recurring-amount" className="label">
                Amount (INR)
              </label>
              <input
                id="recurring-amount"
                className="field"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={values.amount}
                onChange={(event) => setValues({ ...values, amount: event.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="recurring-category" className="label">
                Category
              </label>
              <select
                id="recurring-category"
                className="field"
                required
                disabled={categoriesLoading || matchingCategories.length === 0}
                value={values.categoryId}
                onChange={(event) => setValues({ ...values, categoryId: event.target.value })}
              >
                <option value="">
                  {categoriesLoading ? 'Loading categories…' : 'Choose category'}
                </option>
                {matchingCategories.map((category) => (
                  <option key={getId(category)} value={getId(category)}>
                    {category.name}
                  </option>
                ))}
              </select>
              {!categoriesLoading && !categoriesError && matchingCategories.length === 0 && (
                <p className="mt-1 text-xs text-amber">
                  Add a matching category on the{' '}
                  <Link className="text-violet underline" to="/categories">
                    Categories page
                  </Link>
                  .
                </p>
              )}
            </div>
            <div>
              <label htmlFor="recurring-frequency" className="label">
                Repeat
              </label>
              <select
                id="recurring-frequency"
                className="field"
                value={values.frequency}
                onChange={(event) => changeFrequency(event.target.value)}
              >
                {Object.entries(frequencyLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="recurring-start" className="label">
                Schedule start date
              </label>
              <DatePicker
                id="recurring-start"
                value={values.startDate}
                onChange={changeStartDate}
                min={toDateInput()}
                required
                ariaLabel="Schedule start date"
              />
              <p id="recurring-start-hint" className="mt-1 text-xs text-muted">
                First transaction is scheduled one interval after this date.
              </p>
            </div>
            <div>
              <label htmlFor="recurring-end" className="label">
                End date <span className="font-normal text-muted">(optional)</span>
              </label>
              <DatePicker
                id="recurring-end"
                value={values.endDate}
                onChange={(endDate) => setValues({ ...values, endDate })}
                min={addRecurrenceInterval(values.startDate, values.frequency)}
                ariaLabel="End date"
              />
            </div>
            <div>
              <label htmlFor="recurring-description" className="label">
                Description <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="recurring-description"
                className="field"
                maxLength="200"
                value={values.description}
                onChange={(event) => setValues({ ...values, description: event.target.value })}
                placeholder="e.g. Monthly rent"
              />
            </div>
          </div>
          <button
            disabled={saving || categoriesLoading || matchingCategories.length === 0}
            className="button-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Repeat2 size={16} />
            {saving ? 'Creating schedule…' : 'Create schedule'}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Your schedules</h2>
            <p className="text-xs text-muted">{activeSchedules.length} active</p>
          </div>
          <button className="button-secondary !px-3 !py-2 text-xs" onClick={reload}>
            Refresh
          </button>
        </div>
        {loading ? (
          <LoadingState label="Loading recurring schedules…" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : activeSchedules.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {activeSchedules.map((schedule) => (
              <article
                key={getId(schedule)}
                className={`card p-5 ${!schedule.isActive ? 'opacity-65' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${schedule.type === 'income' ? 'bg-mint/10 text-mint' : 'bg-rose/10 text-rose'}`}
                    >
                      <CalendarClock size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">
                        {schedule.description ||
                          categoryNames.get(getId(schedule.categoryId)) ||
                          'Recurring transaction'}
                      </h3>
                      <p className="mt-1 truncate text-xs text-muted">
                        {categoryNames.get(getId(schedule.categoryId)) || 'Category unavailable'} ·{' '}
                        {frequencyLabels[schedule.frequency] || schedule.frequency}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${schedule.isActive ? 'bg-mint/10 text-mint' : 'bg-white/5 text-muted'}`}
                  >
                    {schedule.isActive ? 'Active' : 'Cancelled'}
                  </span>
                </div>
                <div className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-4">
                  <div>
                    <p
                      className={`text-xl font-semibold ${schedule.type === 'income' ? 'text-mint' : 'text-main'}`}
                    >
                      {currency(schedule.amount)}{' '}
                      <span className="text-xs font-medium text-muted">
                        /{' '}
                        {schedule.frequency === 'daily'
                          ? 'day'
                          : schedule.frequency === 'weekly'
                            ? 'week'
                            : schedule.frequency === 'monthly'
                              ? 'month'
                              : 'year'}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {schedule.isActive
                        ? `Next on ${dateLabel(schedule.nextRun)}`
                        : `Started ${dateLabel(schedule.startDate)}`}
                      {schedule.endDate ? ` · Ends ${dateLabel(schedule.endDate)}` : ''}
                    </p>
                  </div>
                  {schedule.isActive && (
                    <button
                      className="button-secondary !px-3 !py-2 text-xs text-rose hover:border-rose/30"
                      onClick={() => cancelSchedule(schedule)}
                    >
                      <Trash2 size={14} /> Cancel
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No active recurring transactions"
            description="Create a schedule above to automate regular income or expenses."
          />
        )}
      </section>
    </div>
  );
}
