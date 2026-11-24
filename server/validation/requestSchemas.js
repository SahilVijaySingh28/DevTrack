const { z } = require('zod')

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'A valid ID is required')
const email = z.string().trim().email('A valid email is required').max(254).transform((value) => value.toLowerCase())
const password = z.string().min(8, 'Password must be at least 8 characters').refine(
  (value) => Buffer.byteLength(value, 'utf8') <= 72,
  'Password must not exceed 72 UTF-8 bytes',
)
const attachment = z.object({
  name: z.string().trim().min(1).max(255),
  url: z.string().max(2048).regex(/^https:\/\/\S+$/i, 'Attachment URL must use HTTPS'),
  fileType: z.enum(['image', 'pdf', 'document', 'other']).optional(),
  size: z.number().min(0).max(10485760).optional(),
}).strict()

const registerBody = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: email.optional(),
  password: password.optional(),
}).strict()

const loginBody = z.object({
  email: email.optional(),
  password: z.string().min(1).max(1024).optional(),
}).strict()

const profileBody = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatar: z.string().trim().max(2048).optional(),
}).strict()

const projectFields = {
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(['Active', 'Completed', 'Archived']).optional(),
}

const projectCreateBody = z.object(projectFields).strict()
const projectUpdateBody = z.object(projectFields).partial().strict().refine(
  (body) => Object.keys(body).length > 0,
  'At least one project field is required',
)

const taskFields = {
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
  assignedTo: objectId.nullable().optional(),
  status: z.enum(['Todo', 'In Progress', 'Completed']).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  dueDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'A valid due date is required').nullable().optional(),
  attachments: z.array(attachment).max(10).optional(),
}

const taskCreateBody = z.object({
  ...taskFields,
  project: objectId,
}).strict()

const taskUpdateBody = z.object(taskFields).partial().strict().refine(
  (body) => Object.keys(body).length > 0,
  'At least one task field is required',
)

const commentBody = z.object({
  message: z.string().trim().min(1, 'Comment message is required').max(2000),
  attachments: z.array(attachment).max(10).optional(),
}).strict()

const addMemberBody = z.object({ userId: objectId }).strict()
const updateMemberRoleBody = z.object({
  role: z.enum(['Admin', 'Manager', 'Member']),
}).strict()

module.exports = {
  addMemberBody,
  commentBody,
  loginBody,
  profileBody,
  projectCreateBody,
  projectUpdateBody,
  registerBody,
  taskCreateBody,
  taskUpdateBody,
  updateMemberRoleBody,
}
