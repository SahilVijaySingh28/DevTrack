import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, CircleAlert, GripVertical, ListFilter, Plus, Radio, Trash2 } from 'lucide-react'
import api from '../api/axios'
import socket from '../api/socket'
import AttachmentPicker, { AttachmentList } from '../components/common/AttachmentPicker'
import Layout from '../components/layout/Layout'

const columns = ['Todo', 'In Progress', 'Completed']
const priorityStyles = {
  Low: 'bg-slate-100 text-slate-600 border-slate-200',
  Medium: 'bg-amber-100 text-amber-800 border-amber-200',
  High: 'bg-red-100 text-red-700 border-red-200',
}

const emptyForm = { title: '', description: '', project: '', assignedTo: '', priority: 'Medium', dueDate: '', attachments: [] }

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' })
  const [form, setForm] = useState(emptyForm)
  const [state, setState] = useState({ loading: true, saving: false, error: '', success: '' })
  const [activeDragId, setActiveDragId] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)

  const load = useCallback(() => {
    Promise.all([api.get('/tasks', { params: filters }), api.get('/projects')])
      .then(([taskResponse, projectResponse]) => {
        setTasks(taskResponse.data.tasks)
        setProjects(projectResponse.data.projects)
        setForm((current) => ({
          ...current,
          project: current.project || projectResponse.data.projects[0]?._id || '',
        }))
      })
      .catch((error) =>
        setState((current) => ({
          ...current,
          error: error.response?.data?.message || 'Unable to load tasks',
        }))
      )
      .finally(() => setState((current) => ({ ...current, loading: false })))
  }, [filters])

  useEffect(() => {
    load()
  }, [load])

  // Socket.IO Real-Time Synchronization
  useEffect(() => {
    const handleTaskCreated = (newTask) => {
      setTasks((prev) => {
        if (prev.some((t) => t._id === newTask._id)) return prev
        return [newTask, ...prev]
      })
    }

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)))
    }

    const handleTaskDeleted = ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId))
    }

    socket.on('task_created', handleTaskCreated)
    socket.on('task_updated', handleTaskUpdated)
    socket.on('task_deleted', handleTaskDeleted)

    return () => {
      socket.off('task_created', handleTaskCreated)
      socket.off('task_updated', handleTaskUpdated)
      socket.off('task_deleted', handleTaskDeleted)
    }
  }, [])

  const selectedProject = projects.find((project) => project._id === form.project)

  const addTask = async (event) => {
    event.preventDefault()
    setState((current) => ({ ...current, saving: true, error: '', success: '' }))
    try {
      const { data } = await api.post('/tasks', {
        ...form,
        assignedTo: form.assignedTo || undefined,
        dueDate: form.dueDate || undefined,
      })
      setTasks((items) => (items.some((i) => i._id === data.task._id) ? items : [data.task, ...items]))
      setForm({ ...emptyForm, project: form.project })
      setState((current) => ({ ...current, success: 'Task created successfully' }))
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.response?.data?.message || 'Unable to create task',
      }))
    } finally {
      setState((current) => ({ ...current, saving: false }))
    }
  }

  const updateStatus = async (task, status) => {
    if (task.status === status) return
    // Optimistic UI update
    const previousTasks = [...tasks]
    setTasks((items) => items.map((item) => (item._id === task._id ? { ...item, status } : item)))

    try {
      const { data } = await api.put(`/tasks/${task._id}`, { status })
      setTasks((items) => items.map((item) => (item._id === task._id ? data.task : item)))
    } catch (error) {
      setTasks(previousTasks)
      setState((current) => ({
        ...current,
        error: error.response?.data?.message || 'Unable to update task status',
      }))
    }
  }

  const deleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return
    try {
      await api.delete(`/tasks/${task._id}`)
      setTasks((items) => items.filter((item) => item._id !== task._id))
      setState((current) => ({ ...current, success: 'Task deleted' }))
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.response?.data?.message || 'Unable to delete task',
      }))
    }
  }

  // HTML5 Drag & Drop Handlers
  const handleDragStart = (event, taskId) => {
    event.dataTransfer.setData('text/plain', taskId)
    event.dataTransfer.effectAllowed = 'move'
    setActiveDragId(taskId)
  }

  const handleDragOver = (event, column) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    if (dragOverColumn !== column) {
      setDragOverColumn(column)
    }
  }

  const handleDragLeave = (event, column) => {
    if (dragOverColumn === column) {
      setDragOverColumn(null)
    }
  }

  const handleDrop = (event, column) => {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/plain')
    setDragOverColumn(null)
    setActiveDragId(null)

    const targetTask = tasks.find((t) => t._id === taskId)
    if (targetTask) {
      updateStatus(targetTask, column)
    }
  }

  return (
    <Layout>
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
              <p className="text-sm font-semibold text-teal-700">Live Execution Board</p>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">Tasks & Drag-and-Drop</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 border border-teal-200">
              <Radio size={12} className="animate-pulse text-teal-600" /> Real-time Synced
            </span>
            <span className="flex items-center gap-2 text-sm text-slate-500">
              <ListFilter size={16} /> {tasks.length} visible
            </span>
          </div>
        </div>

        {(state.error || state.success) && (
          <p
            className={`mt-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
              state.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-teal-50 text-teal-800 border border-teal-200'
            }`}
          >
            <CircleAlert size={16} />
            {state.error || state.success}
          </p>
        )}

        {/* Task Creation Form with Attachments */}
        <form onSubmit={addTask} className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Create New Task</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <input
              required
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Task title"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500 text-sm"
            />
            <select
              required
              value={form.project}
              onChange={(event) => setForm({ ...form, project: event.target.value, assignedTo: '' })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500 text-sm"
            >
              <option value="">Choose project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.title}
                </option>
              ))}
            </select>
            <select
              value={form.assignedTo}
              onChange={(event) => setForm({ ...form, assignedTo: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500 text-sm"
            >
              <option value="">Unassigned</option>
              {selectedProject?.members?.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
            <select
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500 text-sm"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-500 text-sm"
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2">Task Attachments (Optional):</p>
            <AttachmentPicker
              attachments={form.attachments}
              onChange={(newAttachments) => setForm({ ...form, attachments: newAttachments })}
            />
          </div>

          <button
            disabled={state.saving || !projects.length}
            className="mt-4 flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition disabled:opacity-50"
          >
            <Plus size={16} />
            {state.saving ? 'Adding...' : 'Add Task'}
          </button>
        </form>

        {/* Filters bar */}
        <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
          <input
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            placeholder="Search task titles..."
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-500"
          />
          <select
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
          >
            <option value="">All statuses</option>
            {columns.map((column) => (
              <option key={column}>{column}</option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(event) => setFilters({ ...filters, priority: event.target.value })}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
          >
            <option value="">All priorities</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>

        {/* Drag and Drop Kanban Board Columns */}
        {state.loading ? (
          <p className="mt-8 text-sm text-slate-500">Loading live tasks...</p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {columns.map((column) => {
              const columnTasks = tasks.filter((task) => task.status === column)
              const isOver = dragOverColumn === column

              return (
                <section
                  key={column}
                  onDragOver={(e) => handleDragOver(e, column)}
                  onDragLeave={(e) => handleDragLeave(e, column)}
                  onDrop={(e) => handleDrop(e, column)}
                  className={`min-h-96 rounded-2xl p-4 transition-all border-2 ${
                    isOver
                      ? 'bg-teal-50/80 border-teal-400 ring-4 ring-teal-100'
                      : 'bg-slate-100/70 border-slate-200/60'
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-800">{column}</h2>
                      {isOver && <span className="text-xs font-semibold text-teal-700 animate-pulse">Drop here!</span>}
                    </div>
                    <span className="grid size-6 place-items-center rounded-full bg-white text-xs font-bold text-slate-600 shadow-sm border border-slate-200">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {columnTasks.map((task) => {
                      const isDraggingThis = activeDragId === task._id

                      return (
                        <article
                          key={task._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task._id)}
                          onDragEnd={() => setActiveDragId(null)}
                          className={`group cursor-grab active:cursor-grabbing rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
                            isDraggingThis ? 'opacity-40 border-teal-400 scale-95' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <GripVertical size={16} className="mt-0.5 text-slate-300 group-hover:text-slate-500 shrink-0" />
                              <div>
                                <p className="font-semibold text-slate-900 text-sm leading-snug">{task.title}</p>
                                {task.project?.title && (
                                  <p className="mt-0.5 text-xs text-slate-400 font-medium">{task.project.title}</p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => deleteTask(task)}
                              aria-label={`Delete ${task.title}`}
                              className="text-slate-300 hover:text-red-600 transition"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          {/* Priority, Assignee & Due Date */}
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                            <span className={`rounded-full border px-2.5 py-0.5 font-semibold ${priorityStyles[task.priority]}`}>
                              {task.priority}
                            </span>
                            {task.assignedTo && (
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600 font-medium">
                                {task.assignedTo.name}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="flex items-center gap-1 text-slate-500 font-medium">
                                <CalendarDays size={13} className="text-teal-600" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* File Attachments List */}
                          <AttachmentList attachments={task.attachments} />

                          {/* Status Dropdown Alternative */}
                          <div className="mt-3 border-t border-slate-100 pt-2 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 italic">Drag card to move</span>
                            <select
                              aria-label={`Change status for ${task.title}`}
                              value={task.status}
                              onChange={(event) => updateStatus(task, event.target.value)}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 outline-none hover:bg-slate-100"
                            >
                              {columns.map((option) => (
                                <option key={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                        </article>
                      )
                    })}

                    {!columnTasks.length && (
                      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-400">
                        Drop tasks here
                      </div>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </section>
    </Layout>
  )
}
