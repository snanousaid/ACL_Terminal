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

  const ring      = granted ? 'ring-emerald-400'       : 'ring-rose-500'
  const iconBg    = granted ? 'bg-emerald-900/60'      : 'bg-rose-900/60'
  const iconColor = granted ? 'text-emerald-300'       : 'text-rose-300'
  const badgeBg   = granted ? 'bg-emerald-600'         : 'bg-rose-600'
  const label     = granted ? 'ACCÈS ACCORDÉ'            : 'ACCÈS REFUSÉ'
  const doorColor = granted ? 'text-emerald-400/80'    : 'text-rose-400/80'
  const timeColor = granted ? 'text-emerald-500/60'    : 'text-rose-500/60'

  return (
    <div
      className={`
        flex flex-col items-center justify-center h-full gap-6 px-6
        bg-zinc-950
        transition-opacity duration-500
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Avatar circle */}
      <div className={`w-36 h-36 rounded-full flex items-center justify-center ring-4 ${ring} ${iconBg} shadow-lg shadow-black/40`}>
        {granted
          ? <UserCheck size={72} className={iconColor} strokeWidth={1.5} />
          : <UserX     size={72} className={iconColor} strokeWidth={1.5} />
        }
      </div>

      {/* Name */}
      <div className="text-center">
        <p className="text-3xl font-bold tracking-tight text-white">
          {getFullName(event)}
        </p>
      </div>

      {/* Door */}
      <div className={`flex items-center gap-2 ${doorColor}`}>
        <DoorOpen size={18} />
        <span className="text-base">{event.doorName ?? event.reader_ ?? '—'}</span>
      </div>

      {/* GRANTED / DENIED badge */}
      <div className={`px-8 py-3 rounded-full ${badgeBg} shadow-md shadow-black/40`}>
        <p className="text-white text-xl font-extrabold tracking-widest">{label}</p>
      </div>

      {/* Time */}
      <p className={`text-sm ${timeColor}`}>{formatTime(event.createdAt)}</p>
    </div>
  )
}
