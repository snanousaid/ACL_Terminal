import { useEffect, useState } from 'react'
import { Circle, CreditCard, ScanFace } from 'lucide-react'

interface Props {
  /** Connexion ACL_Controller (badge) */
  connected: boolean
  /** Connexion FACE_detection (face). Optionnel — affiché si fourni. */
  faceConnected?: boolean
}

function StatusDot({
  label,
  connected,
  icon,
}: {
  label: string
  connected: boolean
  icon: JSX.Element
}): JSX.Element {
  return (
    <div
      className={`flex items-center gap-2 text-xs font-bold tracking-wider ${
        connected ? 'text-emerald-500' : 'text-red-400'
      }`}
    >
      {icon}
      <span className="text-slate-400 text-[10px] uppercase">{label}</span>
      <Circle
        size={10}
        className={connected ? 'fill-emerald-500 animate-pulse' : 'fill-red-400'}
        style={connected ? { filter: 'drop-shadow(0 0 4px #10b981)' } : {}}
      />
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
    .toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    .replace('.', '')
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <footer className="flex items-center justify-between px-8 h-24 border-t border-slate-800/80 bg-slate-950 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.2)] select-none">
      {/* Statuts connexion — plusieurs sources */}
      <div className="flex items-center gap-5">
        <StatusDot
          label="Badge"
          connected={connected}
          icon={<CreditCard size={14} className="text-slate-500" />}
        />
        {faceConnected !== undefined && (
          <>
            <div className="w-px h-5 bg-slate-800" />
            <StatusDot
              label="Face"
              connected={faceConnected}
              icon={<ScanFace size={14} className="text-slate-500" />}
            />
          </>
        )}
      </div>

      {/* Date + Heure */}
      <div className="flex items-center gap-4 bg-slate-900/80 px-5 py-3 rounded-xl border border-slate-800 shadow-inner">
        <div className="text-slate-300 text-base font-medium capitalize tracking-wide">{date}</div>
        <div className="w-px h-6 bg-slate-700"></div>
        <div className="text-white text-xl font-bold font-mono tracking-widest">{time}</div>
      </div>
    </footer>
  )
}
