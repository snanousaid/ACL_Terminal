import { UserX } from 'lucide-react'

export default function IdleScreen(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-zinc-950 gap-4">
      <div className="flex flex-col items-center gap-4 opacity-50">
        <UserX size={72} strokeWidth={1} className="text-zinc-500" />
        <p className="text-base font-semibold tracking-[0.2em] uppercase text-zinc-500">
          En attente de badge...
        </p>
      </div>
    </div>
  )
}
