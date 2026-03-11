import { BadgeCheck } from 'lucide-react'

export default function IdleScreen(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-zinc-950 gap-8">
      <div className="relative w-64 h-48 flex items-center justify-center mt-10">
        {/* Lecteur RFID */}
        <div className="absolute bottom-0 w-32 h-6 bg-gray-400 dark:bg-gray-600 rounded-t-lg z-10"></div>
        <div className="absolute bottom-6 w-24 h-2 bg-blue-500 mx-auto rounded-t-sm"></div>

        {/* Ondes électromagnétiques */}
        <div className="absolute w-40 h-40 rounded-full border-2 border-blue-400 animate-rfid-pulse-1 opacity-10"></div>
        <div className="absolute w-48 h-48 rounded-full border-2 border-blue-500 animate-rfid-pulse-2 opacity-60"></div>
        <div className="absolute w-56 h-56 rounded-full border-2 border-blue-600 animate-rfid-pulse-3 opacity-50"></div>

        {/* Carte RFID */}
        <div className="absolute w-24 h-16 bg-gradient-to-br from-blue-100 to-blue-300 dark:from-blue-800 rounded-md shadow-md animate-rfid-float z-20">
          <div className="absolute top-1 left-1 w-6 h-1 bg-gray-500 rounded-sm"></div>
          <div className="absolute top-3 left-1 w-4 h-1 bg-gray-500 rounded-sm"></div>
          <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-orange-600"></div>
        </div>
      </div>
      <p className="text-base font-semibold tracking-[0.2em] uppercase text-zinc-200 flex items-center">
        En attente de badge
        <span className="dot-ellipsis ml-1">&nbsp;</span>
      </p>
    </div>
  )
}
