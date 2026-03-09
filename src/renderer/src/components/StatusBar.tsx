interface Props {
  connected: boolean
}

export default function StatusBar({ connected }: Props): JSX.Element {
  const now = new Date()
  const date = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t bg-background text-xs text-muted-foreground select-none">
      {/* Connection */}
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        <span>{connected ? 'Connecté' : 'Déconnecté'}</span>
      </div>

      {/* Date */}
      <span>{date}</span>
    </div>
  )
}
