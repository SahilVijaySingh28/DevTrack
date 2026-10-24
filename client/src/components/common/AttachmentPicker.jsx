import { useState } from 'react'
import { FileText, Image as ImageIcon, Paperclip, Trash2, X } from 'lucide-react'

export default function AttachmentPicker({ attachments = [], onChange }) {
  const [urlInput, setUrlInput] = useState('')
  const [showUrlForm, setShowUrlForm] = useState(false)
  const [urlError, setUrlError] = useState('')

  const handleAddUrl = (e) => {
    e.preventDefault()
    if (!urlInput.trim()) return
    if (attachments.length >= 10) {
      setUrlError('A maximum of 10 attachments is allowed.')
      return
    }
    let parsedUrl
    try {
      parsedUrl = new URL(urlInput.trim())
    } catch {
      setUrlError('Enter a valid HTTPS URL.')
      return
    }
    if (parsedUrl.protocol !== 'https:') {
      setUrlError('Attachment links must use HTTPS.')
      return
    }
    let fileType = 'other'
    const lower = parsedUrl.pathname.toLowerCase()
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp') || lower.endsWith('.gif')) {
      fileType = 'image'
    } else if (lower.endsWith('.pdf')) {
      fileType = 'pdf'
    }

    const name = parsedUrl.pathname.split('/').pop() || parsedUrl.hostname
    if (name.length > 255) {
      setUrlError('The attachment name must be 255 characters or fewer.')
      return
    }
    onChange([...attachments, { name, url: parsedUrl.toString(), fileType, size: 0 }])
    setUrlInput('')
    setUrlError('')
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
          onClick={() => setShowUrlForm(!showUrlForm)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-700 transition"
        >
          <Paperclip size={14} className="text-teal-600" /> Add HTTPS Link
        </button>
      </div>

      {showUrlForm && (
        <form onSubmit={handleAddUrl} className="flex gap-2 text-xs">
          <input
            type="url"
            required
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value)
              setUrlError('')
            }}
            maxLength={2048}
            placeholder="https://example.com/file.pdf"
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
      {urlError && <p role="alert" className="text-xs text-red-700">{urlError}</p>}

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
