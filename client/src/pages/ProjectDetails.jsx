import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Edit3,
  MessageSquare,
  Plus,
  Radio,
  Send,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import socket from "../api/socket";
import AttachmentPicker, { AttachmentList } from "../components/common/AttachmentPicker";
import Layout from "../components/layout/Layout";
import { useAuth } from "../context/useAuth";

const statuses = ["Todo", "In Progress", "Completed"];
const priorities = ["Low", "Medium", "High"];

export default function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [users, setUsers] = useState([]);
  const [taskForm, setTaskForm] = useState({
    title: "",
    priority: "Medium",
    dueDate: "",
    assignedTo: "",
    attachments: [],
  });
  const [commentAttachments, setCommentAttachments] = useState([]);
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    status: "Active",
  });
  const [memberSearch, setMemberSearch] = useState("");
  const [comment, setComment] = useState("");
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState({
    loading: true,
    saving: false,
    error: "",
    success: "",
  });

  const load = useCallback(async () => {
    try {
      const [{ data: projectData }, { data: taskData }] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get("/tasks", {
          params: { project: id, status: filter || undefined },
        }),
      ]);
      setProject(projectData.project);
      setProjectForm({
        title: projectData.project.title,
        description: projectData.project.description || "",
        status: projectData.project.status,
      });
      setTasks(taskData.tasks);
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.response?.data?.message || "Unable to load project",
      }));
    } finally {
      setState((current) => ({ ...current, loading: false }));
    }
  }, [id, filter]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  // Socket.IO Real-Time listeners for project view
  useEffect(() => {
    socket.emit("join_project", id);

    const handleTaskCreated = (newTask) => {
      if (String(newTask.project?._id || newTask.project) === String(id)) {
        setTasks((prev) => (prev.some((t) => t._id === newTask._id) ? prev : [newTask, ...prev]));
      }
    };

    const handleTaskUpdated = (updatedTask) => {
      if (String(updatedTask.project?._id || updatedTask.project) === String(id)) {
        setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
      }
    };

    const handleTaskDeleted = ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    };

    const handleCommentAdded = ({ taskId, comment: newComment }) => {
      if (selectedTaskId === taskId) {
        setComments((prev) => (prev.some((c) => c._id === newComment._id) ? prev : [...prev, newComment]));
      }
    };

    const handleCommentDeleted = ({ commentId, taskId }) => {
      if (selectedTaskId === taskId) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
    };

    socket.on("task_created", handleTaskCreated);
    socket.on("task_updated", handleTaskUpdated);
    socket.on("task_deleted", handleTaskDeleted);
    socket.on("comment_added", handleCommentAdded);
    socket.on("comment_deleted", handleCommentDeleted);

    return () => {
      socket.emit("leave_project", id);
      socket.off("task_created", handleTaskCreated);
      socket.off("task_updated", handleTaskUpdated);
      socket.off("task_deleted", handleTaskDeleted);
      socket.off("comment_added", handleCommentAdded);
      socket.off("comment_deleted", handleCommentDeleted);
    };
  }, [id, selectedTaskId]);

  const updateProject = async (event) => {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, error: "" }));
    try {
      const { data } = await api.put(`/projects/${id}`, projectForm);
      setProject(data.project);
      setEditing(false);
      setState((current) => ({
        ...current,
        saving: false,
        success: "Project updated",
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        saving: false,
        error: error.response?.data?.message || "Unable to update project",
      }));
    }
  };

  const createTask = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post("/tasks", {
        ...taskForm,
        project: id,
        assignedTo: taskForm.assignedTo || undefined,
        dueDate: taskForm.dueDate || undefined,
      });
      setTasks((items) => (items.some((i) => i._id === data.task._id) ? items : [data.task, ...items]));
      setTaskForm({
        title: "",
        priority: "Medium",
        dueDate: "",
        assignedTo: "",
        attachments: [],
      });
      setState((current) => ({ ...current, success: "Task created" }));
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.response?.data?.message || "Unable to create task",
      }));
    }
  };

  const updateStatus = async (task, status) => {
    try {
      const { data } = await api.put(`/tasks/${task._id}`, { status });
      setTasks((items) =>
        items.map((item) => (item._id === task._id ? data.task : item)),
      );
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.response?.data?.message || "Unable to update task",
      }));
    }
  };

  const deleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      setTasks((items) => items.filter((item) => item._id !== task._id));
      setState((current) => ({ ...current, success: "Task deleted" }));
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.response?.data?.message || "Unable to delete task",
      }));
    }
  };

  const searchMembers = async (value) => {
    setMemberSearch(value);
    if (value.length < 2) return setUsers([]);
    try {
      const { data } = await api.get("/users", { params: { search: value } });
      setUsers(data.users);
    } catch {
      setUsers([]);
    }
  };

  const addMember = async (userId) => {
    try {
      const { data } = await api.post(`/projects/${id}/members`, { userId });
      setProject(data.project);
      setMemberSearch("");
      setUsers([]);
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.response?.data?.message || "Unable to add member",
      }));
    }
  };

  const updateRole = async (userId, role) => {
    try {
      const { data } = await api.put(`/projects/${id}/members/${userId}/role`, { role });
      setProject(data.project);
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.response?.data?.message || "Unable to update role",
      }));
    }
  };

  const removeMember = async (userId) => {
    try {
      const { data } = await api.delete(`/projects/${id}/members/${userId}`);
      setProject(data.project);
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.response?.data?.message || "Unable to remove member",
      }));
    }
  };

  const loadComments = async (taskId) => {
    try {
      const { data } = await api.get(`/tasks/${taskId}/comments`);
      setSelectedTaskId(taskId);
      setComments(data.comments);
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.response?.data?.message || "Unable to load comments",
      }));
    }
  };

  const addComment = async (event, taskId) => {
    event.preventDefault();
    if (!comment.trim() && !commentAttachments.length) return;
    try {
      const { data } = await api.post(`/tasks/${taskId}/comments`, {
        message: comment,
        attachments: commentAttachments,
      });
      setComments((items) => (items.some((c) => c._id === data.comment._id) ? items : [...items, data.comment]));
      setComment("");
      setCommentAttachments([]);
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.response?.data?.message || "Unable to add comment",
      }));
    }
  };

  const deleteComment = async (item) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await api.delete(`/comments/${item._id}`);
      setComments((items) =>
        items.filter((commentItem) => commentItem._id !== item._id),
      );
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.response?.data?.message || "Unable to delete comment",
      }));
    }
  };

  if (state.loading)
    return (
      <Layout>
        <p className="p-10 text-sm text-slate-500">Loading project...</p>
      </Layout>
    );

  if (!project)
    return (
      <Layout>
        <p className="p-10 text-sm text-red-700">
          {state.error || "Project not found"}
        </p>
      </Layout>
    );

  return (
    <Layout>
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="flex items-center justify-between">
          <Link
            to="/projects"
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={16} /> Back to projects
          </Link>
          <span className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 border border-teal-200">
            <Radio size={12} className="animate-pulse text-teal-600" /> Live Sync Active
          </span>
        </div>

        <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">
              {project.status}
            </span>
            <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight break-words">
              {project.title}
            </h1>
            <p className="mt-2 max-w-2xl text-slate-500">
              {project.description || "No description yet."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>
              {tasks.length} tasks · {project.members.length} members
            </span>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 hover:border-teal-300 hover:text-teal-700"
            >
              <Edit3 size={15} /> Edit
            </button>
          </div>
        </header>

        {editing && (
          <form
            onSubmit={updateProject}
            className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1.3fr_auto_auto]"
          >
            <input
              required
              value={projectForm.title}
              onChange={(event) =>
                setProjectForm({ ...projectForm, title: event.target.value })
              }
              placeholder="Project title"
              className="rounded-xl border border-slate-200 px-3 py-2.5"
            />
            <input
              value={projectForm.description}
              onChange={(event) =>
                setProjectForm({
                  ...projectForm,
                  description: event.target.value,
                })
              }
              placeholder="Description"
              className="rounded-xl border border-slate-200 px-3 py-2.5"
            />
            <select
              value={projectForm.status}
              onChange={(event) =>
                setProjectForm({ ...projectForm, status: event.target.value })
              }
              className="rounded-xl border border-slate-200 px-3 py-2.5"
            >
              {["Active", "Completed", "Archived"].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
            <button
              disabled={state.saving}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {state.saving ? "Saving..." : "Save"}
            </button>
          </form>
        )}

        {(state.error || state.success) && (
          <p
            className={`mt-5 rounded-xl px-4 py-3 text-sm ${
              state.error ? "bg-red-50 text-red-700" : "bg-teal-50 text-teal-800"
            }`}
          >
            {state.error || state.success}
          </p>
        )}

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.35fr]">
          <section>
            {/* Task Creation with AttachmentPicker */}
            <form
              onSubmit={createTask}
              className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Add Task to Project</p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <input
                  required
                  value={taskForm.title}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, title: event.target.value })
                  }
                  placeholder="Task title"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
                <select
                  value={taskForm.assignedTo}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, assignedTo: event.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option value="">Unassigned</option>
                  {project.members.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <select
                  value={taskForm.priority}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, priority: event.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  {priorities.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, dueDate: event.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <AttachmentPicker
                  attachments={taskForm.attachments}
                  onChange={(newAttachments) => setTaskForm({ ...taskForm, attachments: newAttachments })}
                />
              </div>

              <button className="mt-3 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">
                <Plus size={16} /> Add Task
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between">
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              >
                <option value="">All task statuses</option>
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="mt-4 space-y-3">
              {tasks.length ? (
                tasks.map((task) => (
                  <article
                    key={task._id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-slate-900">{task.title}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {task.status} · {task.priority} priority
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {task.assignedTo?.name || "Unassigned"}
                          {task.dueDate
                            ? ` · Due ${new Date(task.dueDate).toLocaleDateString()}`
                            : ""}
                        </p>

                        {/* Task Attachments List */}
                        <AttachmentList attachments={task.attachments} />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => loadComments(task._id)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition"
                          aria-label={`Comments for ${task.title}`}
                        >
                          <MessageSquare size={16} />
                        </button>
                        <button
                          onClick={() => deleteTask(task)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          aria-label={`Delete ${task.title}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <select
                      value={task.status}
                      onChange={(event) =>
                        updateStatus(task, event.target.value)
                      }
                      className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 border border-slate-200"
                    >
                      {statuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>

                    {/* Task Discussion Comments Thread */}
                    {selectedTaskId === task._id && (
                      <div className="mt-4 border-t border-slate-100 pt-4 bg-slate-50/50 p-3 rounded-xl">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Task Comments</p>
                        <div className="space-y-3">
                          {comments.length ? (
                            comments.map((item) => (
                              <div
                                key={item._id}
                                className="flex items-start justify-between gap-3 text-sm bg-white p-3 rounded-lg border border-slate-200"
                              >
                                <div>
                                  <p className="text-slate-800">
                                    <strong className="text-slate-900">{item.user?.name || "User"}:</strong> {item.message}
                                  </p>
                                  <AttachmentList attachments={item.attachments} />
                                </div>
                                {String(item.user?._id || item.user) ===
                                  String(user?._id || user?.id) && (
                                  <button
                                    onClick={() => deleteComment(item)}
                                    aria-label="Delete comment"
                                    className="shrink-0 text-slate-400 hover:text-red-600"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500 italic">
                              No comments yet. Be the first to comment.
                            </p>
                          )}
                        </div>

                        <form
                          onSubmit={(event) => addComment(event, task._id)}
                          className="mt-4 space-y-2"
                        >
                          <div className="flex gap-2">
                            <input
                              value={comment}
                              onChange={(event) => setComment(event.target.value)}
                              placeholder="Add a comment..."
                              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            />
                            <button
                              aria-label="Send comment"
                              className="rounded-lg bg-teal-700 px-3 py-2 text-white hover:bg-teal-800 transition"
                            >
                              <Send size={15} />
                            </button>
                          </div>

                          <AttachmentPicker
                            attachments={commentAttachments}
                            onChange={(newAttachments) => setCommentAttachments(newAttachments)}
                          />
                        </form>
                      </div>
                    )}
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                  No tasks match this filter.
                </div>
              )}
            </div>
          </section>

          {/* Members Sidebar */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">Team members</h2>
            <div className="relative mt-4">
              <div className="flex gap-2">
                <input
                  value={memberSearch}
                  onChange={(event) => searchMembers(event.target.value)}
                  placeholder="Search by name or email"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
                <UserPlus size={19} className="mt-2 text-teal-700" />
              </div>
              {users.length > 0 && (
                <div className="absolute z-10 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  {users.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => addMember(item._id)}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-teal-50"
                    >
                      {item.name}
                      <span className="block text-xs text-slate-500">
                        {item.email}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-5 space-y-3">
              {project.members.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                  <select
                    aria-label={`Role for ${member.name}`}
                    value={
                      project.memberRoles?.find(
                        (entry) => String(entry.user?._id || entry.user) === String(member._id)
                      )?.role || "Member"
                    }
                    onChange={(event) => updateRole(member._id, event.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                  >
                    <option>Admin</option>
                    <option>Manager</option>
                    <option>Member</option>
                  </select>
                  {String(member._id) !== String(project.owner._id) && (
                    <button
                      onClick={() => removeMember(member._id)}
                      aria-label={`Remove ${member.name}`}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
}
