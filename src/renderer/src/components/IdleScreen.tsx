import { UserX } from 'lucide-react'

interface Props {
  connected: boolean
}

export default function IdleScreen({ connected }: Props): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-background text-muted-foreground gap-4">
      <div className="flex flex-col items-center gap-3 opacity-40">
        <UserX size={72} strokeWidth={1} />
        <p className="text-lg font-medium tracking-wide">En attente de badge...</p>
      </div>
      <div className={`mt-4 flex items-center gap-2 text-sm ${connected ? 'text-green-500' : 'text-red-500'}`}>
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        {connected ? 'Connecté au serveur' : 'Déconnecté'}
      </div>
    </div>
  )
}
