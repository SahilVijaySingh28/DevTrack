import { useState } from 'react'
import {
  Activity,
  ArrowRight,
  Check,
  ChevronRight,
  Circle,
  FolderKanban,
  LockKeyhole,
  MessageSquareText,
  MoveUpRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const tasks = [
  { title: 'Finalize launch checklist', label: 'In progress', owner: 'AM', accent: 'lavender' },
  { title: 'Review onboarding flow', label: 'Needs review', owner: 'JR', accent: 'mocha' },
  { title: 'Publish activity timeline', label: 'Complete', owner: 'SK', accent: 'neutral' },
]

const benefits = [
  {
    icon: FolderKanban,
    title: 'One place for the plan',
    description: 'Projects, people, priorities, and due dates stay connected to the work.',
  },
  {
    icon: Activity,
    title: 'Progress without chasing',
    description: 'A clear task board and live activity make the next step easier to find.',
  },
  {
    icon: LockKeyhole,
    title: 'Permissions that make sense',
    description: 'Keep project access intentional with Admin, Manager, and Member roles.',
  },
]

export default function Landing() {
  const { user } = useAuth()
  const [demoCopied, setDemoCopied] = useState(false)

  const copyDemoInfo = async () => {
    try {
      await navigator.clipboard.writeText('demo@devtrack.com / Demo123!')
      setDemoCopied(true)
      window.setTimeout(() => setDemoCopied(false), 2000)
    } catch (error) {
      console.error('Unable to copy demo credentials:', error)
    }
  }

  return (
    <main className="landing-theme min-h-screen overflow-hidden font-sans">
      <header className="landing-header sticky top-0 z-20 border-b backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex items-center justify-between gap-4 py-3.5">
            <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="DevTrack home">
              <span className="landing-brand-mark grid size-9 place-items-center rounded-xl">
                <Activity size={18} strokeWidth={2.4} />
              </span>
              <span className="landing-title text-lg font-bold tracking-[-0.05em]">
                devtrack<span className="landing-accent">.</span>
              </span>
            </Link>

            <nav aria-label="Main navigation" className="landing-nav hidden items-center gap-1 rounded-full border p-1 md:flex">
              <a className="landing-nav-link" href="#features">Product</a>
              <a className="landing-nav-link" href="#preview">Preview</a>
              <a className="landing-nav-link" href="#how-it-works">How it works</a>
            </nav>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {!user && (
                <Link to="/login" className="landing-muted hidden px-2 py-2 text-sm font-semibold transition hover:text-[#121826] sm:inline-flex">
                  Sign in
                </Link>
              )}
              <Link to={user ? '/dashboard' : '/register'} className="landing-primary-button inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition sm:px-4 sm:text-sm">
                {user ? 'Open workspace' : 'Get started'} <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <nav aria-label="Mobile navigation" className="landing-mobile-nav -mx-1 flex gap-1 overflow-x-auto pb-3 md:hidden">
            <a className="landing-nav-link shrink-0" href="#features">Product</a>
            <a className="landing-nav-link shrink-0" href="#preview">Preview</a>
            <a className="landing-nav-link shrink-0" href="#how-it-works">How it works</a>
            {!user && (
              <Link className="landing-nav-link shrink-0 sm:hidden" to="/login">Sign in</Link>
            )}
          </nav>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-24">
        <div className="landing-hero-glow pointer-events-none absolute -left-40 top-14 size-96 rounded-full blur-3xl" />
        <div className="relative">
          <p className="landing-accent mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
            <span className="h-px w-6 bg-[#6C63FF]" />
            Project management, thoughtfully simple
          </p>
          <h1 className="landing-hero-title landing-title max-w-xl">
            Keep good work
            <span className="landing-accent landing-hero-emphasis block">moving forward.</span>
          </h1>
          <p className="landing-copy mt-6 max-w-lg text-base leading-7 sm:text-lg sm:leading-8">
            Give your team one clear place to plan projects, move tasks, and share progress—without adding another layer of process.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={user ? '/dashboard' : '/register'} className="landing-primary-button inline-flex items-center gap-2 rounded-lg px-5 py-3.5 text-sm font-semibold transition">
              {user ? 'Go to your workspace' : 'Create a workspace'} <ArrowRight size={16} />
            </Link>
            <a href="#preview" className="landing-outline-button inline-flex items-center gap-2 rounded-lg border px-5 py-3.5 text-sm font-medium transition">
              See how it works <ChevronRight size={16} />
            </a>
          </div>

          {!user && (
            <div className="landing-demo-panel mt-7 flex max-w-lg flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
              <div>
                <p className="landing-muted text-[10px] font-semibold uppercase tracking-[0.12em]">Demo account</p>
                <p className="landing-title mt-1 text-xs font-medium">
                  demo@devtrack.com <span className="landing-muted px-1">/</span> Demo123!
                </p>
              </div>
              <button
                type="button"
                onClick={copyDemoInfo}
                className="landing-accent rounded-md border border-[#6C63FF]/25 px-3 py-1.5 text-xs font-semibold transition hover:bg-[#6C63FF]/10"
              >
                {demoCopied ? 'Copied' : 'Copy login'}
              </button>
            </div>
          )}

          <div className="landing-divider mt-9 flex flex-wrap gap-x-5 gap-y-2 border-t pt-5 text-xs">
            {['Project boards', 'Live activity', 'Team roles'].map((item) => (
              <span key={item} className="landing-muted inline-flex items-center gap-1.5">
                <Check size={13} className="landing-accent" /> {item}
              </span>
            ))}
          </div>
        </div>

        <div id="preview" className="relative scroll-mt-24">
          <div className="landing-preview rounded-2xl p-4 shadow-[0_28px_80px_-38px_rgba(18,24,38,0.48)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-[#2EC4B6]">
                  <FolderKanban size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-white">Website refresh</h2>
                  <p className="landing-preview-muted mt-1 text-xs">Product team · 5 members</p>
                </div>
              </div>
              <span className="landing-lavender-chip rounded-full border px-3 py-1.5 text-[11px] font-medium">Active project</span>
            </div>

            <div className="my-5 flex items-center justify-between">
              <div>
                <p className="landing-preview-muted text-xs">Sprint progress</p>
                <p className="mt-1 text-lg font-semibold text-white">12 of 18 tasks complete</p>
              </div>
              <span className="rounded-lg bg-[#6C63FF]/20 px-3 py-2 text-sm font-semibold text-[#e7e5ff]">67%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-2/3 rounded-full bg-[#2EC4B6]" />
            </div>

            <div className="landing-preview-board mt-6 rounded-xl border p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold text-white">Recently updated</p>
                <span className="landing-preview-muted text-[10px]">View board →</span>
              </div>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <article key={task.title} className="landing-preview-task flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={`size-2 shrink-0 rounded-full ${task.accent === 'lavender' ? 'bg-[#6C63FF]' : task.accent === 'mocha' ? 'bg-[#2EC4B6]' : 'bg-[#94A3B8]'}`} />
                      <p className="truncate text-xs font-medium">{task.title}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] ${task.accent === 'lavender' ? 'text-[#5148E5]' : task.accent === 'mocha' ? 'text-[#168F86]' : 'text-[#64748B]'}`}>{task.label}</span>
                      <span className="grid size-6 place-items-center rounded-full bg-[#F1F5F9] text-[9px] font-semibold text-[#334155]">{task.owner}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="landing-preview-muted mt-4 flex items-center gap-2 text-[11px]">
              <MessageSquareText size={14} className="text-[#2EC4B6]" />
              Latest update: onboarding review moved forward
              <Circle size={7} className="ml-auto fill-[#2EC4B6] text-[#2EC4B6]" />
              Live
            </div>
          </div>
          <p className="landing-muted mt-3 text-right text-[11px]">A quick look at a team workspace</p>
        </div>
      </section>

      <section id="features" className="landing-section-soft border-y">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-xl">
            <p className="landing-accent text-xs font-semibold uppercase tracking-[0.18em]">Made for real team routines</p>
            <h2 className="landing-title mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              Enough structure to stay aligned. Nothing extra to manage.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, description }) => (
              <article key={title} className="landing-step-card rounded-xl border p-6 transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_-30px_rgba(18,24,38,0.32)]">
                <span className="landing-feature-icon grid size-10 place-items-center rounded-xl">
                  <Icon size={18} />
                </span>
                <h3 className="landing-title mt-5 font-semibold">{title}</h3>
                <p className="landing-copy mt-2 text-sm leading-6">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="landing-accent text-xs font-semibold uppercase tracking-[0.18em]">A simple rhythm</p>
            <h2 className="landing-title mt-3 text-3xl font-semibold tracking-[-0.045em]">Plan. Do. Share.</h2>
          </div>
          <p className="landing-copy max-w-md text-sm leading-6">Start with a project, make the next steps visible, and keep updates alongside the work.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['01', 'Set the direction', 'Create a project and invite the people doing the work.'],
            ['02', 'Make progress visible', 'Turn plans into tasks with owners, priorities, and dates.'],
            ['03', 'Keep context together', 'Use comments and activity updates to stay in sync.'],
          ].map(([number, title, description]) => (
            <article key={number} className="landing-step-card rounded-xl border p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_-30px_rgba(18,24,38,0.32)]">
              <span className="landing-accent text-xs font-semibold">{number}</span>
              <h3 className="landing-title mt-4 font-semibold">{title}</h3>
              <p className="landing-copy mt-2 text-sm leading-6">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-20">
        <div className="landing-cta flex flex-col justify-between gap-6 rounded-2xl border p-7 sm:p-9 md:flex-row md:items-center">
          <div>
            <p className="landing-accent text-xs font-semibold uppercase tracking-[0.18em]">A clearer start</p>
            <h2 className="landing-title mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
              Bring your next project into focus.
            </h2>
            <p className="landing-copy mt-2 text-sm">Create a workspace or sign in to continue with your team.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link to={user ? '/dashboard' : '/register'} className="landing-primary-button inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition">
              {user ? 'Open workspace' : 'Get started'} <ArrowRight size={15} />
            </Link>
            {!user && (
              <Link to="/login" className="landing-outline-button inline-flex items-center rounded-lg border px-5 py-3 text-sm font-medium transition">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:py-14">
            <div className="max-w-sm">
              <Link to="/" className="inline-flex items-center gap-2.5" aria-label="DevTrack home">
                <span className="landing-footer-mark grid size-9 place-items-center rounded-xl">
                  <Activity size={18} strokeWidth={2.4} />
                </span>
                <span className="text-lg font-bold tracking-[-0.05em] text-white">
                  devtrack<span className="text-[#2EC4B6]">.</span>
                </span>
              </Link>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Project work, thoughtfully simple. Keep plans, tasks, and team updates moving together.
              </p>
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">Explore</h2>
              <nav aria-label="Footer product links" className="mt-4 flex flex-col items-start gap-3">
                <a className="landing-footer-link" href="#features">Product</a>
                <a className="landing-footer-link" href="#preview">Workspace preview</a>
                <a className="landing-footer-link" href="#how-it-works">How it works</a>
              </nav>
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">Your workspace</h2>
              <nav aria-label="Footer account links" className="mt-4 flex flex-col items-start gap-3">
                <Link className="landing-footer-link" to={user ? '/dashboard' : '/login'}>
                  {user ? 'Open dashboard' : 'Sign in'} <MoveUpRight size={13} />
                </Link>
                {!user && <Link className="landing-footer-link" to="/register">Create an account</Link>}
              </nav>
            </div>
          </div>

          <div className="landing-footer-bottom flex flex-col gap-2 border-t py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} DevTrack. All rights reserved.</span>
            <span>Built for focused teams.</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
