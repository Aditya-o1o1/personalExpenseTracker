import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import AuthLayout from './AuthLayout';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  const resendCode = async () => {
    setResending(true);
    setError('');
    setNotice('');
    try {
      await apiRequest('/auth/resend-verification', {
        method: 'POST',
        token: null,
        body: { email: email.trim().toLowerCase() },
      });
      setCode('');
      setNotice('If this address has an unconfirmed account, a new code will be sent.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setResending(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await apiRequest('/auth/verify-email', { method: 'POST', token: null, body: { email: email.trim().toLowerCase(), code } });
      navigate('/login', {
        replace: true,
        state: {
          email: email.trim().toLowerCase(),
          message: 'Email confirmed. You can now sign in.',
        },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return <AuthLayout title="Confirm your email" description="Enter the six-digit code sent to your inbox." footer={<>Already verified? <Link to="/login" state={{ email }} className="font-semibold text-violet">Sign in</Link></>}>
    <form className="space-y-5" onSubmit={submit}>
      {error && <p role="alert" className="rounded-xl border border-rose/20 bg-rose/5 px-4 py-3 text-sm text-rose">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-mint/20 bg-mint/5 px-4 py-3 text-sm text-mint">{notice}</p>}
      <div><label className="label" htmlFor="email">Email address</label><input className="field" id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
      <div><label className="label" htmlFor="code">Confirmation code</label><input className="field text-center text-lg tracking-[.45em]" id="code" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" /></div>
      <p className="-mt-2 text-xs leading-5 text-muted">The code expires in 5 minutes. You have up to 5 attempts.</p>
      <button disabled={busy || resending} className="button-primary w-full !py-3 disabled:opacity-60">{busy ? 'Confirming…' : 'Confirm email'}</button>
      <button type="button" disabled={busy || resending || !email.trim()} onClick={resendCode} className="w-full text-sm font-semibold text-violet hover:text-violet/80 disabled:cursor-not-allowed disabled:opacity-50">{resending ? 'Sending…' : 'Send a new code'}</button>
    </form>
  </AuthLayout>;
}
