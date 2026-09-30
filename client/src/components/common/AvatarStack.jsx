export default function AvatarStack({ members = [], max = 4, size = 'md' }) {
  if (!members || !members.length) return null

  const visibleMembers = members.slice(0, max)
  const remainingCount = members.length - max

  const sizeClasses = {
    sm: 'size-7 text-[10px] -ml-2 ring-2',
    md: 'size-9 text-xs -ml-2.5 ring-2',
    lg: 'size-11 text-sm -ml-3 ring-4',
  }

  const badgeSize = sizeClasses[size] || sizeClasses.md

  return (
    <div className="flex items-center pl-2.5">
      {visibleMembers.map((member, idx) => {
        const name = member.name || member.email || 'User'
        const initials = name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()

        return (
          <div
            key={member._id || idx}
            title={`${name} (${member.email || ''})`}
            className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 font-bold text-white ring-white shadow-sm transition hover:z-10 hover:scale-110 ${badgeSize}`}
          >
            {member.avatar ? (
              <img
                src={member.avatar}
                alt={name}
                className="size-full rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
        )
      })}

      {remainingCount > 0 && (
        <div
          title={`${remainingCount} more members`}
          className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-slate-200 ring-white shadow-sm ${badgeSize}`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
