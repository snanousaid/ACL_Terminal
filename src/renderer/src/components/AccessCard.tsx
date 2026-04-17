import { useState } from 'react'
import { UserCheck, UserX, DoorClosed, CreditCard, ScanFace, Fingerprint } from 'lucide-react'
import { API_BASE } from '../socket'

export type AccessSource = 'badge' | 'face' | 'fingerprint'

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
  /** Source de l'événement : badge | face | fingerprint (défaut = badge) */
  source?: AccessSource
  /** Score de confiance (0-1) pour sources biométriques */
  score?: number
  user?: {
    id?: string
    first_name?: string
    last_name?: string
    image?: string | null
  } | null
}

const SOURCE_LABEL: Record<AccessSource, string> = {
  badge: 'Badge',
  face: 'Reconnaissance faciale',
  fingerprint: 'Empreinte digitale',
}

function SourceIcon({ source, size = 14 }: { source: AccessSource; size?: number }): JSX.Element {
  if (source === 'face') return <ScanFace size={size} />
  if (source === 'fingerprint') return <Fingerprint size={size} />
  return <CreditCard size={size} />
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

function getInitials(event: AccessEvent): string {
  const fn = event.user?.first_name?.trim()
  const ln = event.user?.last_name?.trim()
  return `${(fn || '')[0] ?? ''}${(ln || '')[0] ?? ''}`.toUpperCase() || '?'
}

function getImageUrl(event: AccessEvent): string | null {
  const userId = event.user?.id ?? event.userId
  if (!userId || !event.user?.image) return null
  return `${API_BASE}/api/v2/users/${userId}/image`
}

function Avatar({
  event,
  granted
}: {
  event: AccessEvent
  granted: boolean
}): JSX.Element {
  const [imgError, setImgError] = useState(false)
  const imageUrl = getImageUrl(event)
  const color = granted ? 'emerald' : 'rose'

  const wrapClass = `w-24 h-24 rounded-full border-2 flex items-center justify-center mb-6 overflow-hidden ${
    granted
      ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
      : 'border-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.3)]'
  }`

  if (imageUrl && !imgError) {
    return (
      <div className={wrapClass}>
        <img
          src={imageUrl}
          alt="avatar"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={`${wrapClass} ${
        granted ? 'bg-emerald-500/10' : 'bg-rose-500/10'
      }`}
    >
      {imageUrl === null ? (
        granted ? (
          <UserCheck size={48} className="text-emerald-400" />
        ) : (
          <UserX size={48} className="text-rose-400" />
        )
      ) : (
        <span
          className={`text-2xl font-bold ${
            granted ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {getInitials(event)}
        </span>
      )}
    </div>
  )
}

export default function AccessCard({ event }: Props): JSX.Element {
  const granted = event.status === true || event.eventType === 'ACCESS_GRANTED'
  const source: AccessSource = event.source ?? 'badge'
  const sourceLabel = SOURCE_LABEL[source]

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div
        className={`w-full max-w-md ${
          granted
            ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]'
            : 'bg-rose-950/20 border-rose-500/30 shadow-[0_0_50px_rgba(225,29,72,0.1)]'
        } border rounded-3xl p-10 flex flex-col items-center animate-in slide-in-from-bottom-8 fade-in duration-500`}
      >
        <Avatar event={event} granted={granted} />

        <h2 className="text-3xl font-bold text-white mb-2">{getFullName(event)}</h2>

        {/* Badge source */}
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-6 px-3 py-1 rounded-full ${
            granted
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
          }`}
        >
          <SourceIcon source={source} />
          <span>{sourceLabel}</span>
          {event.score !== undefined && source !== 'badge' && (
            <span className="font-mono ml-1 opacity-80">· {(event.score * 100).toFixed(0)}%</span>
          )}
        </div>

        <div
          className={`${
            granted
              ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
              : 'bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.5)]'
          } text-white px-8 py-4 rounded-full font-bold tracking-[0.1em] text-xl mb-8 w-full text-center`}
        >
          {granted ? 'ACCÈS ACCORDÉ' : 'ACCÈS REFUSÉ'}
        </div>

        <div
          className={`flex items-center gap-6 ${
            granted
              ? 'text-emerald-400/80 bg-emerald-950/40 border-emerald-900/50'
              : 'text-rose-400/80 bg-rose-950/40 border-rose-900/50'
          } px-6 py-3 rounded-2xl border`}
        >
          <div className="flex items-center gap-2">
            <DoorClosed size={18} />
            <span>{event.doorName ?? event.reader_ ?? '—'}</span>
          </div>
          <div className={`w-px h-4 ${granted ? 'bg-emerald-800' : 'bg-rose-800'}`}></div>
          <span className="font-mono text-sm">{formatTime(event.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}
