import { UserX } from 'lucide-react'

export default function IdleScreen(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-zinc-600 gap-4">
      <div className="flex flex-col items-center gap-3 opacity-40">
        <UserX size={72} strokeWidth={1} />
        <p className="text-lg font-medium tracking-wide">En attente de badge...</p>
      </div>
    </div>
  )
}
