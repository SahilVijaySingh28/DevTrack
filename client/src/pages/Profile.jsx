import { useState } from 'react'
import { CheckCircle2, Mail, Save, UserRound } from 'lucide-react'
import Layout from '../components/layout/Layout'
import api from '../api/axios'
import { useAuth } from '../context/useAuth'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' })
  const [state, setState] = useState({ saving: false, error: '', success: '' })
  const initials = user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'DU'
  const submit = async (event) => {
    event.preventDefault()
    setState({ saving: true, error: '', success: '' })
    try {
      const { data } = await api.put('/users/profile', form)
      updateUser(data.user)
      setState({ saving: false, error: '', success: 'Profile updated successfully' })
    } catch (error) {
      setState({ saving: false, error: error.response?.data?.message || 'Unable to update profile', success: '' })
    }
  }
  return <Layout><section className="mx-auto max-w-4xl px-6 py-8 lg:px-10"><p className="text-sm font-medium text-teal-700">Account settings</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Your profile</h1><p className="mt-2 text-slate-500">Make your workspace identity easy for teammates to recognize.</p><div className="mt-8 grid gap-5 sm:grid-cols-3"><InfoCard label="Account status" value="Active" accent="text-teal-700" /><InfoCard label="Member since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'} accent="text-slate-900" /><InfoCard label="Sign-in email" value={user?.email || 'Not available'} accent="text-slate-900" /></div><form onSubmit={submit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><div className="flex flex-wrap items-center gap-4 border-b border-slate-100 pb-6"><Avatar src={form.avatar} initials={initials} /><div><p className="font-semibold">{user?.name}</p><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><Mail size={14} /> {user?.email}</p></div></div><div className="mt-6 grid gap-5 md:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Display name<input required minLength="2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100" /></label><label className="block text-sm font-medium text-slate-700">Avatar URL<span className="mt-2 block"><input type="url" value={form.avatar} onChange={(event) => setForm({ ...form, avatar: event.target.value })} placeholder="https://example.com/avatar.jpg" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100" /></span></label></div>{state.error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}{state.success && <p className="mt-4 flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800"><CheckCircle2 size={16} />{state.success}</p>}<button disabled={state.saving} className="mt-6 flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"><Save size={16} />{state.saving ? 'Saving...' : 'Save changes'}</button></form></section></Layout>
}

function Avatar({ src, initials }) { return src ? <img src={src} alt="Profile avatar" className="size-16 rounded-full object-cover ring-4 ring-teal-50" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <div className="grid size-16 place-items-center rounded-full bg-teal-100 text-lg font-semibold text-teal-800 ring-4 ring-teal-50"><UserRound size={25} /><span className="sr-only">{initials}</span></div> }
function InfoCard({ label, value, accent }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{label}</p><p className={`mt-3 truncate text-sm font-semibold ${accent}`}>{value}</p></div> }
