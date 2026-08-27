import { FolderKanban, LayoutDashboard, ListTodo, LogOut, Settings, Sparkles } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

const links = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/profile', label: 'Profile', icon: Settings },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  return <div className="min-h-screen bg-[#f4f7f2]/80 text-slate-900"><aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-slate-200/80 bg-white/90 px-5 py-6 shadow-[8px_0_30px_rgba(23,32,42,0.03)] backdrop-blur lg:flex"><Brand /><div className="mt-10"><p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p><Navigation vertical /></div><NavLink to="/profile" className="mt-auto flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-teal-200 hover:bg-teal-50"><Avatar user={user} /><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{user?.name}</strong><span className="block truncate text-xs text-slate-500">{user?.email}</span></span><Settings size={16} className="text-slate-400" /></NavLink></aside><main className="pb-20 lg:pl-72 lg:pb-0"><header className="flex items-center justify-between border-b border-slate-200/80 bg-white/75 px-6 py-5 backdrop-blur lg:px-10"><div className="lg:hidden"><Brand /></div><div className="hidden lg:block"><p className="text-sm font-medium text-teal-700">DevTrack workspace</p><p className="mt-1 text-sm text-slate-500">{user?.email}</p></div><button onClick={logout} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><LogOut size={17} /> Sign out</button></header><div className="page-enter">{children}</div></main><nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-8px_25px_rgba(23,32,42,0.05)] backdrop-blur lg:hidden"><Navigation /></nav></div>
}

function Navigation({ vertical = false }) { return <div className={vertical ? 'w-full space-y-2' : 'contents'}>{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex ${vertical ? '' : 'flex-col'} items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-medium ${isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-500 hover:bg-slate-50'}`}><Icon size={vertical ? 17 : 18} />{label}</NavLink>)}</div> }
function Brand() { return <NavLink to="/dashboard" className="flex items-center gap-3 text-lg font-bold"><span className="grid size-9 place-items-center rounded-xl bg-teal-400 text-slate-950"><Sparkles size={19} /></span>DevTrack</NavLink> }
function Avatar({ user }) { return user?.avatar ? <img src={user.avatar} alt="" className="size-9 rounded-full object-cover" /> : <span className="grid size-9 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">{user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'DU'}</span> }
