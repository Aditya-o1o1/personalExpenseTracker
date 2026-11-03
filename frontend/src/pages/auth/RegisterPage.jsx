import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { toDateInput } from '../../lib/format';
import DatePicker from '../../components/DatePicker';
import PasswordField from '../../components/PasswordField';
import AuthLayout from './AuthLayout';

const initialValues = { firstName: '', lastName: '', email: '', password: '', dob: '', phoneNumber: '', gender: 'other' };

export default function RegisterPage() {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const update = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!values.dob) {
      setError('Choose your date of birth.');
      return;
    }
    setBusy(true);
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        token: null,
        body: { ...values, email: values.email.trim().toLowerCase(), dob: new Date(`${values.dob}T00:00:00.000Z`).toISOString() },
      });
      navigate(`/verify-email?email=${encodeURIComponent(values.email.trim().toLowerCase())}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Create your account" description="A few details, then your money gets a little clearer." footer={<>Already have an account? <Link to="/login" className="font-semibold text-violet hover:text-violet/80">Sign in</Link></>}>
      <form className="space-y-4" onSubmit={submit}>
        {error && <p role="alert" className="rounded-xl border border-rose/20 bg-rose/5 px-4 py-3 text-sm text-rose">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="firstName">First name</label><input id="firstName" className="field" value={values.firstName} onChange={update('firstName')} minLength="2" maxLength="50" required /></div>
          <div><label className="label" htmlFor="lastName">Last name</label><input id="lastName" className="field" value={values.lastName} onChange={update('lastName')} minLength="2" maxLength="50" required /></div>
        </div>
        <div><label className="label" htmlFor="email">Email address</label><input id="email" className="field" type="email" autoComplete="email" value={values.email} onChange={update('email')} required /></div>
        <PasswordField id="password" label="Password" autoComplete="new-password" minLength={8} maxLength={128} value={values.password} onChange={update('password')} required hint="Use at least 8 characters." />
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="dob">Date of birth</label><DatePicker id="dob" max={toDateInput()} value={values.dob} onChange={(dob) => setValues((current) => ({ ...current, dob }))} required ariaLabel="Date of birth" /></div>
          <div><label className="label" htmlFor="gender">Gender</label><select id="gender" className="field" value={values.gender} onChange={update('gender')}><option value="other">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option></select></div>
        </div>
        <div><label className="label" htmlFor="phone">Phone <span className="font-normal">(optional)</span></label><input id="phone" className="field" type="tel" value={values.phoneNumber} onChange={update('phoneNumber')} /></div>
        <button disabled={busy} className="button-primary w-full !py-3 disabled:opacity-60">{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="text-center text-[11px] leading-5 text-muted">By continuing, you agree to keep your account details accurate and secure.</p>
      </form>
    </AuthLayout>
  );
}
