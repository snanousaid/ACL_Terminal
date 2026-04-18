import { useEffect, useState } from 'react'
import { CreditCard, ScanFace } from 'lucide-react'

interface Props {
  /** Connexion ACL_Controller (badge) */
  connected: boolean
  /** Connexion FACE_detection (face). Optionnel — affiché si fourni. */
  faceConnected?: boolean
}

/**
 * Chip compact : icône + label + point + état, tout sur une seule ligne.
 * - connected=true  → vert, "ACTIF"
 * - connected=false → ambre pulsant, "ATTENTE"
 */
function StatusChip({
  label,
  connected,
  icon,
}: {
  label: string
  connected: boolean
  icon: JSX.Element
}): JSX.Element {
  const dot = connected
    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
    : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse'
  const status = connected ? 'ACTIF' : 'ATTENTE'
  const statusColor = connected ? 'text-emerald-400' : 'text-amber-400'

  return (
    <div className="flex items-center gap-2.5 bg-[#131c2d] py-2 px-3 rounded-lg border border-slate-700/50 whitespace-nowrap">
      {icon}
      <span className="text-xs font-medium tracking-wider text-slate-300">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${dot}`} />
        <span className={`text-[10px] uppercase font-bold ${statusColor}`}>{status}</span>
      </div>
    </div>
  )
}

export default function StatusBar({ connected, faceConnected }: Props): JSX.Element {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const date = now
    .toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/\./g, '')

  const time = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <footer className="flex items-center justify-between gap-3 px-4 py-3 bg-[#0d1421] border-t border-slate-800 z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.2)] select-none">
      {/* Chips de statut */}
      <div className="flex items-center gap-2 min-w-0">
        <StatusChip
          label="BADGE"
          connected={connected}
          icon={<CreditCard size={16} className="text-slate-400 shrink-0" />}
        />
        {faceConnected !== undefined && (
          <StatusChip
            label="CAMÉRA"
            connected={faceConnected}
            icon={<ScanFace size={16} className="text-slate-400 shrink-0" />}
          />
        )}
      </div>

      {/* Horodatage — toujours sur une seule ligne */}
      <div className="flex items-center gap-2.5 bg-[#090e17] py-1.5 px-3 rounded-xl border border-slate-800 whitespace-nowrap shrink-0">
        <div className="text-slate-400 text-[11px] font-medium tracking-wide">{date}</div>
        <div className="w-px h-5 bg-slate-700" />
        <div className="text-white text-lg font-bold font-mono tracking-wider">{time}</div>
      </div>
    </footer>
  )
}
