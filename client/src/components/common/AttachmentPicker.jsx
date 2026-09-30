import { useRef, useState } from 'react'
import { FileText, Image as ImageIcon, Paperclip, Trash2, UploadCloud, X } from 'lucide-react'

export default function AttachmentPicker({ attachments = [], onChange }) {
  const fileInputRef = useRef(null)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlForm, setShowUrlForm] = useState(false)

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const url = e.target.result
        let fileType = 'other'
        if (file.type.startsWith('image/')) fileType = 'image'
        else if (file.type.includes('pdf')) fileType = 'pdf'
        else if (file.type.includes('word') || file.type.includes('text') || file.type.includes('doc')) fileType = 'document'

        const newAttachment = {
          name: file.name,
          url,
          fileType,
          size: file.size,
        }
        onChange([...attachments, newAttachment])
      }
      reader.readAsDataURL(file)
    })
    event.target.value = ''
  }

  const handleAddUrl = (e) => {
    e.preventDefault()
    if (!urlInput.trim()) return
    let fileType = 'other'
    const lower = urlInput.toLowerCase()
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp') || lower.endsWith('.gif')) {
      fileType = 'image'
    } else if (lower.endsWith('.pdf')) {
      fileType = 'pdf'
    }

    const name = urlInput.split('/').pop().split('?')[0] || 'Web Link'
    onChange([...attachments, { name, url: urlInput.trim(), fileType, size: 0 }])
    setUrlInput('')
    setShowUrlForm(false)
  }

  const removeAttachment = (indexToRemove) => {
    onChange(attachments.filter((_, idx) => idx !== indexToRemove))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-700 transition"
        >
          <Paperclip size={14} className="text-teal-600" /> Attach File
        </button>

        <button
          type="button"
          onClick={() => setShowUrlForm(!showUrlForm)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-700 transition"
        >
          <UploadCloud size={14} className="text-teal-600" /> Add URL Link
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {showUrlForm && (
        <form onSubmit={handleAddUrl} className="flex gap-2 text-xs">
          <input
            type="url"
            required
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/file.png"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 outline-none focus:border-teal-500"
          />
          <button type="submit" className="rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white">
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowUrlForm(false)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-500"
          >
            <X size={14} />
          </button>
        </form>
      )}

      {/* Attachments Preview Grid */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {attachments.map((item, idx) => (
            <div
              key={idx}
              className="group relative flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs shadow-sm"
            >
              {item.fileType === 'image' ? (
                <img src={item.url} alt="" className="size-6 rounded object-cover border border-slate-200" />
              ) : item.fileType === 'pdf' ? (
                <FileText size={16} className="text-red-500" />
              ) : (
                <ImageIcon size={16} className="text-teal-600" />
              )}

              <span className="max-w-[130px] truncate font-medium text-slate-700">{item.name}</span>

              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                className="text-slate-400 hover:text-red-600 ml-1"
                aria-label="Remove attachment"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AttachmentList({ attachments = [] }) {
  if (!attachments || !attachments.length) return null

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {attachments.map((item, idx) => (
        <a
          key={item._id || idx}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-teal-50 hover:border-teal-200 transition"
        >
          {item.fileType === 'image' ? (
            <img src={item.url} alt="" className="size-5 rounded object-cover border border-slate-200" />
          ) : item.fileType === 'pdf' ? (
            <FileText size={14} className="text-red-500" />
          ) : (
            <Paperclip size={14} className="text-teal-600" />
          )}
          <span className="max-w-[140px] truncate font-medium">{item.name}</span>
        </a>
      ))}
    </div>
  )
}
