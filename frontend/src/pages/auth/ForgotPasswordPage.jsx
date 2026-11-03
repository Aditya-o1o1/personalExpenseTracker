import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import AuthLayout from './AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await apiRequest('/auth/forgot-password', { method: 'POST', token: null, body: { email: email.trim().toLowerCase() } });
      setSent(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return <AuthLayout title="Reset your password" description="We’ll send a one-time reset code if an account exists for that email." footer={<Link to="/login" className="inline-flex items-center gap-2 font-semibold text-violet">Back to sign in</Link>}>
    {sent ? <div className="space-y-4"><div className="rounded-xl border border-mint/20 bg-mint/5 p-4 text-sm leading-6 text-mint">If an account exists for <strong>{email}</strong>, reset instructions are on their way.</div><Link to={`/reset-password?email=${encodeURIComponent(email)}`} className="button-primary w-full">Enter reset code</Link></div> : <form className="space-y-5" onSubmit={submit}>
      {error && <p role="alert" className="rounded-xl border border-rose/20 bg-rose/5 px-4 py-3 text-sm text-rose">{error}</p>}
      <div><label className="label" htmlFor="email">Email address</label><input className="field" id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
      <button disabled={busy} className="button-primary w-full !py-3 disabled:opacity-60">{busy ? 'Sending…' : 'Send reset code'}</button>
    </form>}
  </AuthLayout>;
}
