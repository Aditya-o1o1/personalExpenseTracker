import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Shield, Sun, Trash2, UserRound } from 'lucide-react';
import { apiRequest, tokenStore } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { confirmAction, toast } from '../lib/alerts';
import { toDateInput } from '../lib/format';
import PasswordField from '../components/PasswordField';
import DatePicker from '../components/DatePicker';
import { ErrorState, LoadingState } from '../components/ui';

export default function SettingsPage() {
  const { data: result, loading, error, reload } = useAsync(() => apiRequest('/profile'), []);
  const { setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [values, setValues] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [password, setPassword] = useState({ currentPassword: '', password: '' });
  const [passwordError, setPasswordError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (result?.profile) {
      setValues({
        firstName: result.profile.firstName || '',
        lastName: result.profile.lastName || '',
        email: result.profile.email || '',
        dob: result.profile.dob ? toDateInput(result.profile.dob) : '',
        phoneNumber: result.profile.phoneNumber || '',
        gender: result.profile.gender || 'other',
      });
    }
  }, [result]);

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!values?.dob) {
      setProfileError('Choose your date of birth.');
      return;
    }
    setBusy(true);
    setProfileError('');
    try {
      const body = { ...values, dob: new Date(`${values.dob}T00:00:00.000Z`).toISOString() };
      const response = await apiRequest('/profile', { method: 'PUT', body });
      setUser(response.profile);
      toast('success', 'Profile updated');
      reload();
    } catch (requestError) {
      setProfileError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    setBusy(true);
    setPasswordError('');
    try {
      await apiRequest('/profile', { method: 'PUT', body: password });
      setPassword({ currentPassword: '', password: '' });
      toast('success', 'Password updated');
    } catch (requestError) {
      setPasswordError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    const confirmed = await confirmAction('Delete your account?', 'This will deactivate your SpendWise account. This action cannot be undone.', 'Delete account');
    if (!confirmed) return;
    setDeletePassword('');
    setDeleteError('');
    setDeleteDialogOpen(true);
  };

  const confirmAccountDeletion = async (event) => {
    event.preventDefault();
    setBusy(true);
    setDeleteError('');
    try {
      await apiRequest('/auth/deleteAccount', {
        method: 'DELETE',
        body: { password: deletePassword },
      });
      tokenStore.clear();
      setUser(null);
      setDeleteDialogOpen(false);
      toast('success', 'Your account has been deleted');
      navigate('/login', { replace: true });
    } catch (requestError) {
      setDeleteError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState label="Loading your settings…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return <div className="animate-in space-y-6">
    <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.17em] text-violet">Your space</p><h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">Settings</h1><p className="mt-2 text-sm text-muted">Make SpendWise feel like yours.</p></div>
    <section className="card p-5 sm:p-7">
      <div className="mb-6 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet/10 text-violet"><UserRound size={19} /></div><div><h2 className="font-semibold">Personal details</h2><p className="mt-1 text-xs text-muted">Update the details associated with your account.</p></div></div>
      {values && <form className="space-y-4" onSubmit={saveProfile}>
        {profileError && <p role="alert" className="rounded-xl border border-rose/20 bg-rose/5 p-3 text-sm text-rose">{profileError}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="firstName">First name</label><input id="firstName" className="field" minLength="2" maxLength="50" required value={values.firstName} onChange={(event) => setValues({ ...values, firstName: event.target.value })} /></div>
          <div><label className="label" htmlFor="lastName">Last name</label><input id="lastName" className="field" minLength="2" maxLength="50" required value={values.lastName} onChange={(event) => setValues({ ...values, lastName: event.target.value })} /></div>
          <div><label className="label" htmlFor="email">Email address</label><input id="email" className="field" type="email" required value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} /></div>
          <div><label className="label" htmlFor="dob">Date of birth</label><DatePicker id="dob" max={toDateInput()} required value={values.dob} ariaLabel="Date of birth" onChange={(dob) => setValues({ ...values, dob })} /></div>
          <div><label className="label" htmlFor="phone">Phone number</label><input id="phone" className="field" type="tel" value={values.phoneNumber} onChange={(event) => setValues({ ...values, phoneNumber: event.target.value })} /></div>
          <div><label className="label" htmlFor="gender">Gender</label><select id="gender" className="field" value={values.gender} onChange={(event) => setValues({ ...values, gender: event.target.value })}><option value="other">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option></select></div>
        </div>
        <button disabled={busy} className="button-primary disabled:opacity-60">{busy ? 'Saving…' : 'Save profile'}</button>
      </form>}
    </section>

    <section className="card p-5 sm:p-7">
      <div className="mb-6 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet/10 text-violet"><Shield size={19} /></div><div><h2 className="font-semibold">Security</h2><p className="mt-1 text-xs text-muted">Choose a strong password that you don’t reuse elsewhere.</p></div></div>
      <form className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={updatePassword}>
        <PasswordField id="currentPassword" label="Current password" autoComplete="current-password" minLength={8} required value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} />
        <PasswordField id="newPassword" label="New password" autoComplete="new-password" minLength={8} maxLength={128} required value={password.password} onChange={(event) => setPassword({ ...password, password: event.target.value })} />
        <button disabled={busy} className="button-secondary disabled:opacity-60">{busy ? 'Updating…' : 'Update password'}</button>
      </form>
      {passwordError && <p role="alert" className="mt-3 text-sm text-rose">{passwordError}</p>}
    </section>

    <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div><div className="flex items-center gap-2"><h2 className="font-semibold">Appearance</h2>{theme === 'dark' ? <Moon size={15} className="text-violet" /> : <Sun size={15} className="text-amber" />}</div><p className="mt-1 text-sm text-muted">Your preference is saved on this device.</p></div>
      <button onClick={toggleTheme} className="button-secondary">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}{theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</button>
    </section>

    <section className="rounded-2xl border border-rose/20 bg-rose/[.035] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-rose">Delete account</h2><p className="mt-1 max-w-xl text-sm leading-6 text-muted">Your account will be deactivated. You’ll be signed out immediately.</p></div><button onClick={deleteAccount} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose/30 px-4 py-2.5 text-sm font-semibold text-rose transition hover:bg-rose/10"><Trash2 size={16} /> Delete account</button></div>
    </section>
    {deleteDialogOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && !busy && setDeleteDialogOpen(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" className="w-full max-w-md rounded-3xl border border-line bg-[var(--surface)] p-6 shadow-2xl">
        <h2 id="delete-account-title" className="text-xl font-semibold text-rose">Confirm account deletion</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Enter your password to deactivate your account. This cannot be undone.</p>
        <form className="mt-5 space-y-4" onSubmit={confirmAccountDeletion}>
          {deleteError && <p role="alert" className="rounded-xl border border-rose/20 bg-rose/5 p-3 text-sm text-rose">{deleteError}</p>}
          <PasswordField id="delete-account-password" label="Current password" autoComplete="current-password" required value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} />
          <div className="flex justify-end gap-2">
            <button type="button" className="button-secondary" disabled={busy} onClick={() => setDeleteDialogOpen(false)}>Cancel</button>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={busy}>{busy ? 'Deleting…' : 'Delete account'}</button>
          </div>
        </form>
      </div>
    </div>}
  </div>;
}
