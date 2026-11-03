import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import PasswordField from '../../components/PasswordField';
import AuthLayout from './AuthLayout';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await apiRequest('/auth/reset-password', { method: 'POST', token: null, body: { email: email.trim().toLowerCase(), code, password } });
      navigate('/login', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return <AuthLayout title="Choose a new password" description="Use the six-digit code from your password reset email." footer={<Link to="/login" className="font-semibold text-violet">Back to sign in</Link>}>
    <form className="space-y-5" onSubmit={submit}>
      {error && <p role="alert" className="rounded-xl border border-rose/20 bg-rose/5 px-4 py-3 text-sm text-rose">{error}</p>}
      <div><label className="label" htmlFor="email">Email address</label><input className="field" id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
      <div><label className="label" htmlFor="code">Reset code</label><input className="field text-center tracking-[.45em]" id="code" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} /></div>
      <p className="-mt-2 text-xs leading-5 text-muted">The code expires in 5 minutes. You have up to 5 attempts. Request another code from the password reset page if it expires or is locked.</p>
      <PasswordField id="password" label="New password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} />
      <button disabled={busy} className="button-primary w-full !py-3 disabled:opacity-60">{busy ? 'Updating…' : 'Update password'}</button>
    </form>
  </AuthLayout>;
}
