import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PasswordField from '../../components/PasswordField';
import AuthLayout from './AuthLayout';

export default function LoginPage() {
  const location = useLocation();
  const [values, setValues] = useState(() => ({
    email: location.state?.email || new URLSearchParams(location.search).get('email') || '',
    password: '',
  }));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login({ email: values.email.trim().toLowerCase(), password: values.password });
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" description="Sign in to pick up where you left off." footer={<>New to SpendWise? <Link to="/register" className="font-semibold text-violet hover:text-violet/80">Create an account</Link></>}>
      <form className="space-y-5" onSubmit={submit}>
        {error && <p role="alert" className="rounded-xl border border-rose/20 bg-rose/5 px-4 py-3 text-sm text-rose">{error}</p>}
        <div><label className="label" htmlFor="email">Email address</label><input id="email" className="field" type="email" autoComplete="email" required value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} placeholder="you@example.com" /></div>
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          required
          value={values.password}
          onChange={(event) => setValues({ ...values, password: event.target.value })}
          placeholder="Your password"
          rightContent={<Link to="/forgot-password" className="text-xs font-medium text-violet hover:underline">Forgot password?</Link>}
        />
        <button disabled={busy} className="button-primary w-full !py-3 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </AuthLayout>
  );
}
