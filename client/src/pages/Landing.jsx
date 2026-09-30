import { useState } from 'react'
import {
  Activity as ActivityIcon,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  FolderKanban,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Landing() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('kanban')
  const [demoCopied, setDemoCopied] = useState(false)

  const copyDemoInfo = () => {
    navigator.clipboard?.writeText('demo@devtrack.com / Demo123!')
    setDemoCopied(true)
    setTimeout(() => setDemoCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 selection:bg-teal-500 selection:text-slate-950 font-sans">
      {/* Background glowing gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-teal-500/20 via-emerald-500/10 to-indigo-500/20 blur-[130px] rounded-full" />
        <div className="absolute top-[40%] -left-40 w-[600px] h-[600px] bg-teal-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-10 right-0 w-[700px] h-[500px] bg-indigo-600/10 blur-[160px] rounded-full" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 z-0" 
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0b0f19]/80 border-b border-slate-800/80 transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link to="/" className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-white group">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-slate-950 shadow-lg shadow-teal-500/20 transition-transform group-hover:scale-105">
              <Sparkles size={20} />
            </span>
            <span>Dev<span className="text-teal-400">Track</span></span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex text-sm font-medium text-slate-300">
            <a href="#features" className="transition hover:text-teal-400">Features</a>
            <a href="#preview" className="transition hover:text-teal-400">Interactive Preview</a>
            <a href="#how-it-works" className="transition hover:text-teal-400">How It Works</a>
            <a href="#security" className="transition hover:text-teal-400">Security & Roles</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-teal-500/25 transition hover:brightness-110"
              >
                Go to Workspace <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-300 transition hover:text-white px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Started Free <ChevronRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-24 text-center lg:px-10 lg:pt-24 lg:pb-32">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold text-teal-300 backdrop-blur-md mb-8 shadow-sm animate-pulse">
          <span className="flex size-2 rounded-full bg-teal-400" />
          <span>DevTrack 2.0 • Production Project Management Platform</span>
          <ChevronRight size={14} className="text-teal-400" />
        </div>

        {/* Hero Title */}
        <h1 className="mx-auto max-w-5xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1]">
          Manage Engineering Projects with{' '}
          <span className="bg-gradient-to-r from-teal-300 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Absolute Clarity.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mx-auto mt-7 max-w-3xl text-lg text-slate-300 sm:text-xl leading-relaxed">
          Streamline your team’s delivery with interactive Kanban boards, automated audit activity trails, fine-grained role permissions, and real-time project metrics.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 px-8 py-4 text-base font-bold text-slate-950 shadow-xl shadow-teal-500/25 transition hover:scale-105 active:scale-95"
          >
            Start Free Workspace <ArrowRight size={18} />
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2.5 rounded-2xl border border-slate-700 bg-slate-800/60 px-8 py-4 text-base font-semibold text-white backdrop-blur-md transition hover:border-slate-500 hover:bg-slate-800"
          >
            Sign In with Demo Account
          </Link>
        </div>

        {/* Demo Credentials Quick Pill */}
        <div className="mt-6 flex items-center justify-center gap-3 text-xs text-slate-400">
          <span>Demo login: <strong className="text-slate-200">demo@devtrack.com</strong> / <strong className="text-slate-200">Demo123!</strong></span>
          <button
            onClick={copyDemoInfo}
            className="rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-teal-400 transition hover:bg-slate-700 hover:text-teal-300"
          >
            {demoCopied ? 'Copied!' : 'Copy credentials'}
          </button>
        </div>

        {/* Feature Pill Highlights */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-teal-400" />
            <span>JWT & bcrypt Security</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-teal-400" />
            <span>Kanban Board Execution</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-teal-400" />
            <span>Project RBAC (Admin, Manager, Member)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-teal-400" />
            <span>Automated Audit Activity Log</span>
          </div>
        </div>
      </section>

      {/* Interactive App Preview Showcase */}
      <section id="preview" className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10">
          {/* Mockup Header bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <span className="size-3 rounded-full bg-red-500/80" />
                <span className="size-3 rounded-full bg-amber-500/80" />
                <span className="size-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="ml-2 rounded-lg bg-slate-800 px-3 py-1 text-xs font-mono text-slate-400">
                devtrack-app.internal/dashboard
              </span>
            </div>

            {/* Tab Selector Buttons */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              {[
                { id: 'kanban', label: 'Kanban Board', icon: FolderKanban },
                { id: 'analytics', label: 'Metrics & Stats', icon: BarChart3 },
                { id: 'rbac', label: 'Roles & RBAC', icon: ShieldCheck },
                { id: 'activity', label: 'Audit Log', icon: ActivityIcon },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
                    activeTab === id
                      ? 'bg-teal-500 text-slate-950 font-semibold shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Screen Container */}
          <div className="mt-6 min-h-[380px] rounded-2xl bg-[#080c14] p-6 border border-slate-800/80">
            {activeTab === 'kanban' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Project: Launch Planning 🚀</h3>
                    <p className="text-xs text-slate-400 mt-0.5">3 tasks • Updated 2m ago</p>
                  </div>
                  <span className="rounded-full bg-teal-500/10 border border-teal-500/30 px-3 py-1 text-xs font-semibold text-teal-400">
                    Active Sprint
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Todo Column */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Todo</span>
                      <span className="grid size-5 place-items-center rounded-full bg-slate-800 text-[11px] font-bold text-slate-300">1</span>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 shadow-sm hover:border-slate-700 transition">
                      <p className="text-sm font-semibold text-white">Document color tokens</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 font-medium">Low Priority</span>
                        <span className="text-[11px] text-slate-500">Assignee: Demo</span>
                      </div>
                    </div>
                  </div>

                  {/* In Progress Column */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">In Progress</span>
                      <span className="grid size-5 place-items-center rounded-full bg-amber-500/20 text-[11px] font-bold text-amber-300">1</span>
                    </div>
                    <div className="rounded-lg border border-amber-500/30 bg-slate-950 p-3.5 shadow-sm">
                      <p className="text-sm font-semibold text-white">Review onboarding flow</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-300">Medium</span>
                        <span className="text-[11px] text-teal-400">Due Today</span>
                      </div>
                    </div>
                  </div>

                  {/* Completed Column */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Completed</span>
                      <span className="grid size-5 place-items-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-300">1</span>
                    </div>
                    <div className="rounded-lg border border-emerald-500/30 bg-slate-950 p-3.5 shadow-sm opacity-90">
                      <p className="text-sm font-semibold text-slate-200 line-through">Define release checklist</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="rounded bg-red-500/20 px-2 py-0.5 text-[11px] font-medium text-red-300">High Priority</span>
                        <span className="text-[11px] text-emerald-400">Done ✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Total Projects</p>
                    <p className="mt-2 text-3xl font-extrabold text-teal-400">12</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Active Tasks</p>
                    <p className="mt-2 text-3xl font-extrabold text-white">48</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Completed Rate</p>
                    <p className="mt-2 text-3xl font-extrabold text-emerald-400">84%</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Team Velocity</p>
                    <p className="mt-2 text-3xl font-extrabold text-indigo-400">9.4/10</p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-white">Overall Workspace Progress</span>
                    <span className="text-teal-400">84% Finished</span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-slate-950 p-0.5 border border-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 w-[84%] transition-all duration-1000" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rbac' && (
              <div className="space-y-4 animate-fadeIn">
                <h4 className="text-sm font-bold text-white mb-3">Project Roles & Access Matrix</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-teal-500/40 bg-teal-500/5 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-300 text-sm">Admin Role</span>
                      <span className="rounded bg-teal-400 text-slate-950 px-2 py-0.5 text-[10px] font-bold">Full Access</span>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <li className="flex items-center gap-1.5"><Check size={13} className="text-teal-400" /> Delete project</li>
                      <li className="flex items-center gap-1.5"><Check size={13} className="text-teal-400" /> Manage team members</li>
                      <li className="flex items-center gap-1.5"><Check size={13} className="text-teal-400" /> Assign Admin/Manager roles</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 text-sm">Manager Role</span>
                      <span className="rounded bg-slate-800 text-slate-300 px-2 py-0.5 text-[10px] font-bold">Management</span>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <li className="flex items-center gap-1.5"><Check size={13} className="text-teal-400" /> Update project info</li>
                      <li className="flex items-center gap-1.5"><Check size={13} className="text-teal-400" /> Add & remove members</li>
                      <li className="flex items-center gap-1.5"><Check size={13} className="text-teal-400" /> Create & edit tasks</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-400 text-sm">Member Role</span>
                      <span className="rounded bg-slate-800 text-slate-400 px-2 py-0.5 text-[10px] font-bold">Standard</span>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <li className="flex items-center gap-1.5"><Check size={13} className="text-teal-400" /> View project dashboard</li>
                      <li className="flex items-center gap-1.5"><Check size={13} className="text-teal-400" /> Move task status</li>
                      <li className="flex items-center gap-1.5"><Check size={13} className="text-teal-400" /> Post task comments</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-3 animate-fadeIn">
                <h4 className="text-sm font-bold text-white mb-2">Live Workspace Audit History</h4>
                <div className="space-y-2.5">
                  {[
                    { user: 'Demo User', action: 'Created project "Launch Planning"', time: 'Just now', type: 'project' },
                    { user: 'Sarah Connor', action: 'Moved task "Review onboarding flow" to In Progress', time: '5m ago', type: 'task' },
                    { user: 'Alex Rivera', action: 'Added comment on "Define release checklist"', time: '12m ago', type: 'comment' },
                    { user: 'Demo User', action: 'Updated project role for Sarah Connor to Manager', time: '1h ago', type: 'role' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-xs">
                      <div className="size-2 rounded-full bg-teal-400 shrink-0" />
                      <span className="font-semibold text-white">{item.user}</span>
                      <span className="text-slate-300 flex-1">{item.action}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-teal-400">Everything You Need</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Engineered for high-performing teams.
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-slate-400">
            DevTrack removes administrative complexity so your team can focus on shipping products.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={FolderKanban}
            title="Kanban Board Execution"
            description="Organize work into Todo, In Progress, and Completed columns with priority tags, assignee management, and target due dates."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="Granular Project RBAC"
            description="Control permissions per project with explicit Admin, Manager, and Member roles enforced at the server controller level."
          />
          <FeatureCard
            icon={ActivityIcon}
            title="Automated Audit Stream"
            description="Track every project milestone, task update, member change, and comment deletion in a centralized activity feed."
          />
          <FeatureCard
            icon={MessageSquare}
            title="Contextual Task Comments"
            description="Discuss implementation specifics directly inside tasks. Author deletion rights and admin overrides keep conversations clean."
          />
          <FeatureCard
            icon={Lock}
            title="State-of-the-Art Security"
            description="Protected with 12-round bcrypt password hashing, stateless JWT session tokens, and sanitized payload validation."
          />
          <FeatureCard
            icon={Zap}
            title="Blazing Fast Performance"
            description="Built with React 19 and Vite 8 for instant page navigation, fluid animations, and sub-50ms REST API responses."
          />
        </div>
      </section>

      {/* How It Works Step-by-Step */}
      <section id="how-it-works" className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-10 border-t border-slate-800/80">
        <div className="text-center mb-16">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Simple 3-Step Setup</p>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">How DevTrack Works</h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <StepCard
            number="01"
            title="Create Your Project"
            description="Set up your workspace initiatives in seconds. Define goals, set default status, and set project visibility."
          />
          <StepCard
            number="02"
            title="Invite & Assign Roles"
            description="Search collaborators by name or email. Assign Admin, Manager, or Member privileges according to responsibilities."
          />
          <StepCard
            number="03"
            title="Execute & Deliver"
            description="Create tasks, move cards across Kanban columns, add discussion notes, and monitor completion progress."
          />
        </div>
      </section>

      {/* Testimonial / Social Proof Banner */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="rounded-3xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-indigo-950/60 p-8 sm:p-12 border border-teal-500/20 text-center">
          <div className="flex justify-center gap-1 text-amber-400 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={20} fill="currentColor" />
            ))}
          </div>
          <blockquote className="text-xl sm:text-2xl font-medium text-slate-200 max-w-3xl mx-auto leading-relaxed">
            "DevTrack gave our engineering team total transparency without the bloat of traditional tools. The role-based permissions and instant Kanban updates kept everyone aligned."
          </blockquote>
          <p className="mt-6 text-sm font-bold text-teal-400">Engineering Lead • Software Engineering Team</p>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-10 text-center">
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-[#080c14] p-10 sm:p-16 border border-slate-800 shadow-2xl">
          <h2 className="text-3xl font-extrabold text-white sm:text-5xl">
            Ready to supercharge your workspace?
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto text-lg">
            Join thousands of developers and project managers delivering high-impact projects with DevTrack.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-400 px-8 py-4 text-base font-bold text-slate-950 shadow-xl shadow-teal-500/25 transition hover:scale-105"
            >
              Create Free Account <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-8 py-4 text-base font-semibold text-white transition hover:bg-slate-700"
            >
              Sign In to Existing Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 bg-[#080c14] px-6 py-12 text-slate-400 lg:px-10">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-teal-400 text-slate-950 font-bold">
              <Sparkles size={16} />
            </span>
            <span className="font-bold text-white text-base">DevTrack</span>
            <span className="text-xs text-slate-500 ml-2">© {new Date().getFullYear()} DevTrack Platform</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 font-medium">
            <span>Built with React 19</span>
            <span>•</span>
            <span>Vite 8</span>
            <span>•</span>
            <span>Node.js & Express 5</span>
            <span>•</span>
            <span>MongoDB Atlas</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/50 hover:bg-slate-900 shadow-lg">
      <div className="grid size-12 place-items-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors">
        <Icon size={22} />
      </div>
      <h3 className="mt-5 text-xl font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }) {
  return (
    <div className="relative rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-left">
      <span className="text-4xl font-black text-teal-500/40 font-mono">{number}</span>
      <h3 className="mt-4 text-xl font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  )
}
