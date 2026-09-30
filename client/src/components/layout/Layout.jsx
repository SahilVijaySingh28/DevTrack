import { FolderKanban, LayoutDashboard, ListTodo, LogOut, Radio, Settings, Sparkles } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

const links = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks Board', icon: ListTodo },
  { to: '/profile', label: 'Profile & Settings', icon: Settings },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-slate-800/80 bg-[#0b0f19] px-6 py-6 text-slate-100 shadow-2xl z-30 lg:flex">
        <Brand />

        <div className="mt-10 flex-1 space-y-6">
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">Workspace Menu</p>
            <div className="mt-3 space-y-1.5">
              <Navigation vertical />
            </div>
          </div>
        </div>

        {/* Live WebSocket Status Card */}
        <div className="mb-4 rounded-xl border border-teal-500/20 bg-teal-500/10 p-3.5 text-xs text-teal-300 backdrop-blur">
          <div className="flex items-center gap-2 font-semibold">
            <Radio size={14} className="animate-pulse text-teal-400" />
            <span>Real-time Socket Connected</span>
          </div>
          <p className="mt-1 text-[11px] text-teal-400/80">Syncing live workspace events across clients.</p>
        </div>

        {/* Profile Card */}
        <div className="border-t border-slate-800/80 pt-4">
          <NavLink
            to="/profile"
            className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-3 transition hover:border-teal-500/50 hover:bg-slate-900"
          >
            <Avatar user={user} />
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm text-white font-semibold">{user?.name}</strong>
              <span className="block truncate text-xs text-slate-400">{user?.email}</span>
            </span>
            <Settings size={16} className="text-slate-500" />
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="pb-24 lg:pl-72 lg:pb-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-4 backdrop-blur-md lg:px-10">
          <div className="lg:hidden">
            <Brand dark={false} />
          </div>

          <div className="hidden lg:block">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-teal-700">DevTrack Workspace</p>
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800">Pro</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </header>

        <div className="page-enter">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-2xl backdrop-blur-lg lg:hidden">
        <Navigation />
      </nav>
    </div>
  )
}

function Navigation({ vertical = false }) {
  return (
    <div className={vertical ? 'w-full space-y-1.5' : 'contents'}>
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex ${
              vertical
                ? 'items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition'
                : 'flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium'
            } ${
              isActive
                ? vertical
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold shadow-lg shadow-teal-500/20'
                  : 'bg-teal-50 text-teal-800 font-bold'
                : vertical
                ? 'text-slate-400 hover:bg-slate-900 hover:text-white'
                : 'text-slate-500 hover:bg-slate-50'
            }`
          }
        >
          <Icon size={vertical ? 18 : 19} />
          <span>{label}</span>
        </NavLink>
      ))}
    </div>
  )
}

function Brand({ dark = true }) {
  return (
    <NavLink to="/dashboard" className="flex items-center gap-3 text-xl font-extrabold tracking-tight">
      <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-slate-950 shadow-md shadow-teal-500/20">
        <Sparkles size={20} />
      </span>
      <span className={dark ? 'text-white' : 'text-slate-900'}>
        Dev<span className="text-teal-400">Track</span>
      </span>
    </NavLink>
  )
}

function Avatar({ user }) {
  const initials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DU'

  return (
    <div className="relative">
      {user?.avatar ? (
        <img src={user.avatar} alt="" className="size-10 rounded-full object-cover ring-2 ring-teal-500/30" />
      ) : (
        <span className="grid size-10 place-items-center rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 text-xs font-extrabold text-slate-950 ring-2 ring-teal-500/30">
          {initials}
        </span>
      )}
      <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
    </div>
  )
}
