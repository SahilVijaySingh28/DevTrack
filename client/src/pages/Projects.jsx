import { useCallback, useEffect, useState } from 'react'
import { FolderPlus, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import AvatarStack from '../components/common/AvatarStack'
import Layout from '../components/layout/Layout'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({ title: '', description: '' })
  const [editing, setEditing] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [state, setState] = useState({ loading: true, saving: false, error: '' })

  const load = useCallback(async () => {
    try {
      const [{ data: projectData }, { data: taskData }] = await Promise.all([api.get('/projects'), api.get('/tasks')])
      const tasksByProject = taskData.tasks.reduce((result, task) => {
        const key = task.project?._id || task.project
        result[key] = (result[key] || []).concat(task)
        return result
      }, {})
      setProjects(
        projectData.projects.map((project) => {
          const projectTasks = tasksByProject[project._id] || []
          const completed = projectTasks.filter((task) => task.status === 'Completed').length
          return {
            ...project,
            taskCount: projectTasks.length,
            progress: projectTasks.length ? Math.round((completed / projectTasks.length) * 100) : 0,
          }
        })
      )
    } catch (error) {
      setState((current) => ({ ...current, error: error.response?.data?.message || 'Unable to load projects' }))
    } finally {
      setState((current) => ({ ...current, loading: false }))
    }
  }, [])

  useEffect(() => {
    queueMicrotask(load)
  }, [load])

  const submit = async (event) => {
    event.preventDefault()
    setState((current) => ({ ...current, saving: true, error: '' }))
    try {
      if (editing) {
        const { data } = await api.put(`/projects/${editing}`, form)
        setProjects((items) => items.map((project) => (project._id === editing ? { ...project, ...data.project } : project)))
      } else {
        const { data } = await api.post('/projects', form)
        setProjects((items) => [{ ...data.project, taskCount: 0, progress: 0 }, ...items])
      }
      setForm({ title: '', description: '' })
      setEditing(null)
      setShowModal(false)
    } catch (error) {
      setState((current) => ({ ...current, error: error.response?.data?.message || 'Unable to save project' }))
    } finally {
      setState((current) => ({ ...current, saving: false }))
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this project?')) return
    try {
      await api.delete(`/projects/${id}`)
      setProjects((items) => items.filter((project) => project._id !== id))
    } catch (error) {
      setState((current) => ({ ...current, error: error.response?.data?.message || 'Unable to delete project' }))
    }
  }

  const edit = (project) => {
    setEditing(project._id)
    setForm({ title: project.title, description: project.description || '' })
    setShowModal(true)
  }

  return (
    <Layout>
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Workspace Hub</span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Projects</h1>
            <p className="mt-1 text-sm text-slate-500">Manage team initiatives, collaborator permissions, and progress in one place.</p>
          </div>

          <button
            onClick={() => {
              setEditing(null)
              setForm({ title: '', description: '' })
              setShowModal(true)
            }}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:scale-105 active:scale-95"
          >
            <Plus size={18} /> Start New Project
          </button>
        </div>

        {state.error && <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 border border-red-200">{state.error}</p>}

        {/* Modal for Creating / Editing Project */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="grid size-9 place-items-center rounded-xl bg-teal-100 text-teal-700">
                    <FolderPlus size={18} />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Project' : 'Create New Project'}</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={submit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Project Title</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Design System 2.0"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description (Optional)</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe project goals and deliverables..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={state.saving}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50"
                  >
                    {editing ? <Pencil size={16} /> : <Sparkles size={16} />}
                    {state.saving ? 'Saving...' : editing ? 'Update Project' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Project Cards Grid */}
        {state.loading ? (
          <p className="mt-10 text-sm text-slate-500 text-center">Loading projects...</p>
        ) : projects.length ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <article
                key={project._id}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
                      <span className="size-2 rounded-full bg-teal-500 animate-pulse" />
                      {project.status}
                    </span>

                    <div className="flex gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => edit(project)}
                        aria-label={`Edit ${project.title}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => remove(project._id)}
                        aria-label={`Delete ${project.title}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <Link to={`/projects/${project._id}`} className="mt-4 block group-hover:text-teal-700">
                    <h2 className="text-xl font-extrabold text-slate-900 transition">{project.title}</h2>
                    <p className="mt-2 min-h-12 text-sm text-slate-500 leading-relaxed line-clamp-2">
                      {project.description || 'No description provided.'}
                    </p>
                  </Link>

                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                      <span>{project.taskCount} tasks</span>
                      <span className="text-teal-700">{project.progress}% Complete</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer: Members Stack & Open Link */}
                <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <AvatarStack members={project.members} max={4} size="sm" />
                    <span className="text-xs text-slate-400 font-medium">({project.members?.length || 0})</span>
                  </div>

                  <Link
                    to={`/projects/${project._id}`}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline"
                  >
                    Open Hub →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
            <div className="grid size-12 place-items-center rounded-2xl bg-teal-100 text-teal-700 mx-auto mb-4">
              <FolderPlus size={24} />
            </div>
            <p className="text-lg font-bold text-slate-900">No projects in workspace yet</p>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Create your first project above to invite team members and start assigning Kanban tasks.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-teal-700"
            >
              <Plus size={16} /> Start First Project
            </button>
          </div>
        )}
      </section>
    </Layout>
  )
}
