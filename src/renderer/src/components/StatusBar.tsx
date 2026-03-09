interface Props {
  connected: boolean
}

export default function StatusBar({ connected }: Props): JSX.Element {
  const now = new Date()
  const date = now.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800 bg-zinc-900 select-none">
      {/* Connection */}
      <div className={`flex items-center gap-2 text-xs font-semibold tracking-wide uppercase
        ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
        {connected ? 'Connecté' : 'Déconnecté'}
      </div>

      {/* Date + Time */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-zinc-400 font-medium">{date}</span>
        <span className="text-zinc-300 font-bold tabular-nums">{time}</span>
      </div>
    </div>
  )
}
