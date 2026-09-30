import { useEffect, useState } from 'react'
import {
  Activity as ActivityIcon,
  AlertCircle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FolderKanban,
  ListTodo,
  Radio,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import socket from '../api/socket'
import AvatarStack from '../components/common/AvatarStack'
import Layout from '../components/layout/Layout'
import { useAuth } from '../context/useAuth'

const statStyles = {
  teal: 'from-teal-500/20 to-emerald-500/10 text-teal-600 border-teal-200',
  blue: 'from-blue-500/20 to-indigo-500/10 text-blue-600 border-blue-200',
  green: 'from-emerald-500/20 to-teal-500/10 text-emerald-600 border-emerald-200',
  amber: 'from-amber-500/20 to-orange-500/10 text-amber-600 border-amber-200',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [activities, setActivities] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })

  useEffect(() => {
    Promise.all([api.get('/projects'), api.get('/tasks'), api.get('/activity')])
      .then(([projectResponse, taskResponse, activityResponse]) => {
        setProjects(projectResponse.data.projects)
        setTasks(taskResponse.data.tasks)
        setActivities(activityResponse.data.activities)
      })
      .catch((error) =>
        setState({ loading: false, error: error.response?.data?.message || 'Unable to load workspace data' })
      )
      .finally(() => setState((current) => ({ ...current, loading: false })))
  }, [])

  // Real-Time Socket.IO Updates
  useEffect(() => {
    const handleActivityCreated = (newActivity) => {
      setActivities((prev) => (prev.some((a) => a._id === newActivity._id) ? prev : [newActivity, ...prev]))
    }

    const handleTaskCreated = (newTask) => {
      setTasks((prev) => (prev.some((t) => t._id === newTask._id) ? prev : [newTask, ...prev]))
    }

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)))
    }

    const handleTaskDeleted = ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId))
    }

    socket.on('activity_created', handleActivityCreated)
    socket.on('task_created', handleTaskCreated)
    socket.on('task_updated', handleTaskUpdated)
    socket.on('task_deleted', handleTaskDeleted)

    return () => {
      socket.off('activity_created', handleActivityCreated)
      socket.off('task_created', handleTaskCreated)
      socket.off('task_updated', handleTaskUpdated)
      socket.off('task_deleted', handleTaskDeleted)
    }
  }, [])

  const completed = tasks.filter((task) => task.status === 'Completed').length
  const inProgress = tasks.filter((task) => task.status === 'In Progress').length
  const completion = tasks.length ? Math.round((completed / tasks.length) * 100) : 0

  const deadline = new Date()
  deadline.setDate(deadline.getDate() + 7)
  const dueSoon = tasks
    .filter((task) => task.dueDate && task.status !== 'Completed' && new Date(task.dueDate) <= deadline)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5)

  return (
    <Layout>
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {/* Hero Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-8 text-white shadow-xl">
          <div className="absolute -top-24 -right-24 size-96 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3.5 py-1 text-xs font-semibold text-teal-300 backdrop-blur">
                <Sparkles size={14} className="text-teal-400" />
                <span>Productivity Intelligence Active</span>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Welcome back, {user?.name || 'Developer'}! 👋
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-300 leading-relaxed">
                Here is your live workspace breakdown. Keep projects moving forward and collaborate seamlessly with your team.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-2.5 text-xs font-semibold text-teal-300">
                <Radio size={14} className="animate-pulse text-teal-400" /> Live WebSocket Synced
              </span>
              <Link
                to="/projects"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:scale-105 active:scale-95"
              >
                View Projects <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {state.error && <Notice message={state.error} />}

        {state.loading ? (
          <Loading />
        ) : (
          <>
            {/* 4 Stat Cards */}
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={FolderKanban} label="Total Projects" value={projects.length} color="teal" trend="+12% this month" />
              <StatCard icon={ListTodo} label="Total Tasks" value={tasks.length} color="blue" trend="Active workspace items" />
              <StatCard icon={CheckCircle2} label="Completed Tasks" value={completed} color="green" trend={`${completion}% done rate`} />
              <StatCard icon={Clock3} label="In Progress" value={inProgress} color="amber" trend="Currently being built" />
            </div>

            {/* Middle Section: Progress Gauge & Due Soon */}
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              {/* Progress Bar Card */}
              <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Workspace Execution</span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-1">Completion Rate</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-teal-600">{completion}%</span>
                    <p className="text-xs text-slate-400 font-medium">overall velocity</p>
                  </div>
                </div>

                <div className="mt-6 h-4 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-slate-200/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 transition-all duration-1000 shadow-sm"
                    style={{ width: `${completion}%` }}
                  />
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-emerald-500" />
                    <span>{completed} Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-amber-500" />
                    <span>{inProgress} In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-slate-400" />
                    <span>{tasks.length - completed - inProgress} Todo</span>
                  </div>
                </div>
              </section>

              {/* Due Soon Deadlines Card */}
              <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition hover:shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-700">
                    <CalendarClock size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Upcoming Deadlines</h2>
                    <p className="text-xs text-slate-400 font-medium">Due in next 7 days</p>
                  </div>
                </div>

                {dueSoon.length ? (
                  <div className="mt-5 space-y-3">
                    {dueSoon.map((task) => (
                      <div
                        key={task._id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 transition hover:bg-amber-50/50 hover:border-amber-200"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{task.title}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500 font-medium">{task.project?.title || 'Project'}</p>
                        </div>
                        <span className="whitespace-nowrap rounded-lg bg-amber-100/80 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-8 text-sm text-slate-500 text-center italic">No urgent deadlines approaching! ✨</p>
                )}
              </section>
            </div>

            {/* Lower Section: Activity History & Recent Projects */}
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              {/* Activity Feed */}
              <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-9 place-items-center rounded-xl bg-teal-100 text-teal-700">
                    <ActivityIcon size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Live Activity Stream</h2>
                    <p className="text-xs text-slate-400 font-medium">Real-time team actions</p>
                  </div>
                </div>

                {activities.length ? (
                  <div className="mt-6 space-y-4">
                    {activities.slice(0, 6).map((activity) => (
                      <div key={activity._id} className="flex gap-3.5 border-b border-slate-100 pb-3.5 last:border-0">
                        <div className="mt-1 size-2.5 shrink-0 rounded-full bg-teal-500 ring-4 ring-teal-100" />
                        <div>
                          <p className="text-sm font-medium text-slate-800 leading-snug">{activity.message}</p>
                          <p className="mt-1 text-[11px] font-mono text-slate-400">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty text="Activity log will record live updates as your team works." />
                )}
              </section>

              {/* Recent Projects */}
              <section className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Recent Projects</h2>
                    <p className="text-xs text-slate-400 font-medium">Active team hubs</p>
                  </div>
                  <Link to="/projects" className="text-xs font-bold text-teal-700 hover:text-teal-900">
                    See All Projects →
                  </Link>
                </div>

                {projects.length ? (
                  <div className="mt-5 space-y-3.5">
                    {projects.slice(0, 4).map((project) => (
                      <Link
                        to={`/projects/${project._id}`}
                        key={project._id}
                        className="group block rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-teal-300 hover:bg-teal-50/40 hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-teal-800 text-sm">{project.title}</p>
                            <div className="mt-2">
                              <AvatarStack members={project.members} max={3} size="sm" />
                            </div>
                          </div>
                          <span className="rounded-full border border-teal-200 bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">
                            {project.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Empty text="No projects created yet. Start your first project!" />
                )}
              </section>
            </div>
          </>
        )}
      </section>
    </Layout>
  )
}

function StatCard({ icon: Icon, label, value, color, trend }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className={`grid size-11 place-items-center rounded-2xl border bg-gradient-to-br ${statStyles[color]}`}>
        <Icon size={22} />
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-500">
        <TrendingUp size={13} className="text-teal-600" /> {trend}
      </p>
    </div>
  )
}

function Empty({ text }) {
  return <p className="mt-8 text-center text-sm text-slate-500 italic">{text}</p>
}

function Loading() {
  return <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading workspace analytics...</div>
}

function Notice({ message }) {
  return (
    <div className="mt-6 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 border border-red-200">
      <AlertCircle size={18} />
      {message}
    </div>
  )
}
