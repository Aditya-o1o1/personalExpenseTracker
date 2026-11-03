import { Link } from 'react-router-dom';
import { ArrowLeft, WalletCards } from 'lucide-react';

export default function AuthLayout({ title, description, children, footer }) {
  return (
    <div className="app-bg grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden border-r border-line bg-[#101827] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -left-32 top-28 h-96 w-96 rounded-full bg-violet/20 blur-[100px]" />
        <div className="absolute -bottom-36 right-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px]" />
        <Link to="/login" className="relative z-10 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet text-white"><WalletCards size={22} /></div>
          <span className="text-xl font-bold tracking-tight">spend<span className="text-violet">wise</span></span>
        </Link>
        <div className="relative z-10 max-w-xl">
          <p className="mb-5 inline-flex rounded-full border border-violet/25 bg-violet/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-violet-300">MONEY, MADE CLEARER</p>
          <h1 className="text-5xl font-semibold leading-[1.12] tracking-tight xl:text-6xl">Build a better relationship with <span className="bg-gradient-to-r from-violet to-indigo-300 bg-clip-text text-transparent">your money.</span></h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-400">A thoughtful space to understand your spending, make a plan, and feel good about what comes next.</p>
          <div className="mt-10 flex items-center gap-3"><div className="h-px w-10 bg-violet" /><p className="text-sm text-slate-400">Your finances. Your pace. Your progress.</p></div>
        </div>
        <p className="relative z-10 text-xs text-slate-400">Private by design · SpendWise Finance</p>
      </section>

      <section className="grid min-h-screen place-items-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[410px]">
          <Link to="/login" className="mb-9 inline-flex items-center gap-2 text-sm text-muted hover:text-main lg:hidden"><ArrowLeft size={16} /> SpendWise</Link>
          <div className="mb-7"><h2 className="text-3xl font-semibold tracking-tight">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{description}</p></div>
          {children}
          <div className="mt-6 text-center text-sm text-muted">{footer}</div>
        </div>
      </section>
    </div>
  );
}
