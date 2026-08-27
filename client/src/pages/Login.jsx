import { useState } from 'react'
import { ArrowRight, CheckCircle2, LockKeyhole, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(form)
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to sign in right now')
    } finally { setSubmitting(false) }
  }

  return <AuthShell title="Welcome back" subtitle="Your team’s work, in one clear view.">
    <form onSubmit={submit} className="space-y-5">
      <Field icon={Mail} label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
      <Field icon={LockKeyhole} label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <button disabled={submitting} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? 'Signing in...' : 'Sign in'} <ArrowRight size={17} className="transition group-hover:translate-x-1" />
      </button>
    </form>
    <p className="mt-7 text-center text-sm text-slate-500">New to DevTrack? <Link className="font-semibold text-teal-700 hover:text-teal-900" to="/register">Create an account</Link></p>
  </AuthShell>
}

function Field({ icon: Icon, label, type, value, onChange }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<span className="relative mt-2 block"><Icon size={17} className="absolute left-3 top-3.5 text-slate-400" /><input required type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100" /></span></label>
}

function AuthShell({ title, subtitle, children }) {
  return <main className="flex min-h-screen bg-[#f4f7f2] text-slate-900"><section className="hidden flex-1 flex-col justify-between bg-slate-900 p-12 text-white lg:flex"><div className="flex items-center gap-3 text-lg font-bold"><span className="grid size-9 place-items-center rounded-xl bg-teal-400 text-slate-950"><CheckCircle2 size={21} /></span>DevTrack</div><div className="max-w-lg"><p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-teal-300">Project intelligence</p><h2 className="text-5xl font-semibold leading-[1.05] tracking-tight">Make progress visible.</h2><p className="mt-6 max-w-md text-lg leading-8 text-slate-300">Plan work, align your team, and keep every delivery moving with less noise.</p></div><p className="text-sm text-slate-500">Built for focused teams.</p></section><section className="page-enter flex flex-1 items-center justify-center px-6 py-12"><div className="w-full max-w-md"><div className="mb-9 lg:hidden"><p className="text-xl font-bold">Dev<span className="text-teal-700">Track</span></p></div><p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Workspace access</p><h1 className="text-3xl font-semibold tracking-tight">{title}</h1><p className="mt-2 mb-8 text-slate-500">{subtitle}</p>{children}</div></section></main>
}
