import { UserCheck, UserX, DoorClosed } from 'lucide-react'

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
  const granted = event.status === true || event.eventType === 'ACCESS_GRANTED'

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      {granted ? (
        <div className="w-full max-w-md bg-emerald-950/20 border border-emerald-500/30 rounded-3xl p-10 flex flex-col items-center shadow-[0_0_50px_rgba(16,185,129,0.1)] animate-in slide-in-from-bottom-8 fade-in duration-500">
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <UserCheck size={48} className="text-emerald-400" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-8">{getFullName(event)}</h2>

          <div className="bg-emerald-500 text-white px-8 py-4 rounded-full font-bold tracking-[0.1em] text-xl mb-8 w-full text-center shadow-[0_0_20px_rgba(16,185,129,0.5)]">
            ACCÈS ACCORDÉ
          </div>

          <div className="flex items-center gap-6 text-emerald-400/80 bg-emerald-950/40 px-6 py-3 rounded-2xl border border-emerald-900/50">
            <div className="flex items-center gap-2">
              <DoorClosed size={18} />
              <span>{event.doorName ?? event.reader_ ?? '—'}</span>
            </div>
            <div className="w-px h-4 bg-emerald-800"></div>
            <span className="font-mono text-sm">{formatTime(event.createdAt)}</span>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md bg-rose-950/20 border border-rose-500/30 rounded-3xl p-10 flex flex-col items-center shadow-[0_0_50px_rgba(225,29,72,0.1)] animate-in slide-in-from-bottom-8 fade-in duration-500">
          <div className="w-24 h-24 rounded-full bg-rose-500/10 border-2 border-rose-500 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(225,29,72,0.3)]">
            <UserX size={48} className="text-rose-400" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-8">{getFullName(event)}</h2>

          <div className="bg-rose-600 text-white px-8 py-4 rounded-full font-bold tracking-[0.1em] text-xl mb-8 w-full text-center shadow-[0_0_20px_rgba(225,29,72,0.5)]">
            ACCÈS REFUSÉ
          </div>

          <div className="flex items-center gap-6 text-rose-400/80 bg-rose-950/40 px-6 py-3 rounded-2xl border border-rose-900/50">
            <div className="flex items-center gap-2">
              <DoorClosed size={18} />
              <span>{event.doorName ?? event.reader_ ?? '—'}</span>
            </div>
            <div className="w-px h-4 bg-rose-800"></div>
            <span className="font-mono text-sm">{formatTime(event.createdAt)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
