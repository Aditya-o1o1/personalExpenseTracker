import { LoaderCircle } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="grid min-h-screen place-items-center">
      <LoaderCircle className="animate-spin text-violet" size={30} />
    </div>
  );
}

export function LoadingState({ label = 'Loading your finances…' }) {
  return (
    <div className="grid min-h-52 place-items-center text-sm text-muted">
      <span className="flex items-center gap-2"><LoaderCircle className="animate-spin text-violet" size={18} />{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose/20 bg-rose/5 p-6 text-center">
      <p className="text-sm text-rose">{message}</p>
      {onRetry && <button className="button-secondary mt-4" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-line px-5 text-center">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted">{description}</p>
        {action}
      </div>
    </div>
  );
}
