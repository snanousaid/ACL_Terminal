import { UserCheck, UserX, DoorOpen } from 'lucide-react'
import { useEffect, useState } from 'react'

export interface AccessEvent {
  id?: string
  userId?: string | null
  badge_id?: string
  reader_?: string
  status?: boolean
  event_type?: string
  eventType?: 'ACCESS_GRANTED' | 'ACCESS_DENIED'
  doorName?: string | null
  readerName?: string | null
  createdAt?: string
  user?: {
    first_name?: string
    last_name?: string
    photo?: string | null
  } | null
}

interface Props {
  event: AccessEvent
}

function formatTime(iso?: string): string {
  if (!iso) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function getFullName(event: AccessEvent): string {
  const fn = event.user?.first_name?.trim()
  const ln = event.user?.last_name?.trim()
  if (fn || ln) return [fn, ln].filter(Boolean).join(' ')
  return 'Anonyme'
}

export default function AccessCard({ event }: Props): JSX.Element {
  // status boolean is the reliable field from backend (true=granted, false=denied)
  // eventType is optional enrichment when available
  const granted = event.status === true || event.eventType === 'ACCESS_GRANTED'
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // trigger fade-in
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [event])

  const bg       = granted ? 'bg-green-50 dark:bg-green-950'   : 'bg-red-50 dark:bg-red-950'
  const ring     = granted ? 'ring-green-400'                   : 'ring-red-400'
  const iconBg   = granted ? 'bg-green-100 dark:bg-green-900'  : 'bg-red-100 dark:bg-red-900'
  const iconColor= granted ? 'text-green-600'                   : 'text-red-600'
  const badgeBg  = granted ? 'bg-green-500'                     : 'bg-red-500'
  const label    = granted ? 'ACCÈS ACCORDÉ'                    : 'ACCÈS REFUSÉ'

  return (
    <div
      className={`
        flex flex-col items-center justify-center h-full gap-6 px-6
        transition-opacity duration-500
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Avatar circle */}
      <div className={`w-36 h-36 rounded-full flex items-center justify-center ring-4 ${ring} ${iconBg} shadow-lg`}>
        {granted
          ? <UserCheck size={72} className={iconColor} strokeWidth={1.5} />
          : <UserX     size={72} className={iconColor} strokeWidth={1.5} />
        }
      </div>

      {/* Name */}
      <div className="text-center">
        <p className="text-3xl font-bold tracking-tight text-foreground">
          {getFullName(event)}
        </p>
        {event.badge_id && event.badge_id !== '********' && (
          <p className="text-sm text-muted-foreground mt-1">Badge: {event.badge_id}</p>
        )}
      </div>

      {/* Door */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <DoorOpen size={18} />
        <span className="text-base">{event.doorName ?? event.reader_ ?? '—'}</span>
      </div>

      {/* GRANTED / DENIED badge */}
      <div className={`px-8 py-3 rounded-full ${badgeBg} shadow-md`}>
        <p className="text-white text-xl font-extrabold tracking-widest">{label}</p>
      </div>

      {/* Time */}
      <p className="text-muted-foreground text-sm">{formatTime(event.createdAt)}</p>
    </div>
  )
}
