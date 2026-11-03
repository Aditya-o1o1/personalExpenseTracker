export const currency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export const dateLabel = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', options).format(new Date(value));
};

export const toDateInput = (value = new Date()) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const getId = (value) => (typeof value === 'string' ? value : value?._id || value?.id || '');
export const getCategoryName = (value) => (typeof value === 'object' ? value?.name : '');
