import { useState } from 'react'
import { CheckCircle2, Mail, Save, ShieldCheck, UserRound } from 'lucide-react'
import api from '../api/axios'
import Layout from '../components/layout/Layout'
import { useAuth } from '../context/useAuth'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' })
  const [state, setState] = useState({ saving: false, error: '', success: '' })

  const initials =
    user?.name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'DU'

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

  return (
    <Layout>
      <section className="mx-auto max-w-4xl px-6 py-8 lg:px-10">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Account Preferences</span>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">User Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your identity, avatar URL, and sign-in details.</p>

        {/* Info Header Badges */}
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <InfoCard label="Account Status" value="Active (Verified)" icon={ShieldCheck} accent="text-teal-700" />
          <InfoCard
            label="Member Since"
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}
            icon={UserRound}
            accent="text-slate-900"
          />
          <InfoCard label="Workspace Email" value={user?.email || 'Not available'} icon={Mail} accent="text-slate-900" />
        </div>

        {/* Profile Card Form */}
        <form onSubmit={submit} className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-5 border-b border-slate-100 pb-8">
            <AvatarPreview src={form.avatar} initials={initials} />
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">{user?.name}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                <Mail size={15} className="text-teal-600" /> {user?.email}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Display Name</label>
              <input
                required
                minLength="2"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={form.avatar}
                onChange={(event) => setForm({ ...form, avatar: event.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
              <p className="mt-1.5 text-xs text-slate-400">Paste any public image link or avatar URL.</p>
            </div>
          </div>

          {state.error && <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 border border-red-200">{state.error}</p>}

          {state.success && (
            <p className="mt-6 flex items-center gap-2 rounded-2xl bg-teal-50 p-4 text-sm font-semibold text-teal-800 border border-teal-200">
              <CheckCircle2 size={18} className="text-teal-600" />
              {state.success}
            </p>
          )}

          <div className="mt-8 flex justify-end pt-4 border-t border-slate-100">
            <button
              disabled={state.saving}
              className="flex items-center gap-2 rounded-2xl bg-slate-900 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-teal-700 shadow-md disabled:opacity-50"
            >
              <Save size={17} />
              {state.saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </section>
    </Layout>
  )
}

function AvatarPreview({ src, initials }) {
  return src ? (
    <img src={src} alt="Profile avatar" className="size-20 rounded-full object-cover ring-4 ring-teal-100 shadow-md" />
  ) : (
    <div className="grid size-20 place-items-center rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-xl font-black text-slate-950 ring-4 ring-teal-100 shadow-md">
      {initials}
    </div>
  )
}

function InfoCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        <Icon size={16} />
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`truncate text-sm font-extrabold ${accent}`}>{value}</p>
    </div>
  )
}
