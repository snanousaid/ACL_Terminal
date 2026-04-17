import { CreditCard, ScanFace } from 'lucide-react'
import VideoStream from './VideoStream'

interface IdleScreenProps {
  /** Coupe le flux caméra (ex. pendant la configuration admin) */
  streamPaused?: boolean
}

export default function IdleScreen({ streamPaused = false }: IdleScreenProps): JSX.Element {
  return (
    <div className="relative flex items-center justify-center h-full w-full select-none overflow-hidden">
      {/* Stream vidéo plein écran — identique à celui de l'enrôlement (aucun filtre) */}
      <div className="absolute inset-0 z-0">
        <VideoStream className="w-full h-full !rounded-none" paused={streamPaused} />
      </div>

      {/* Overlay : animation + instructions, sans masquer le stream */}
      <div className="relative z-10 flex flex-col items-center justify-center animate-in fade-in duration-500 px-8 pointer-events-none">
        <div className="text-white text-sm tracking-[0.25em] uppercase mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          Contrôle d&apos;accès
        </div>
        <div className="text-white text-2xl font-light mb-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          SYSTÈME SÉCURISÉ
        </div>

        {/* Cercles pulsants transparents — on voit la caméra au centre */}
        <div className="relative flex items-center justify-center w-64 h-64 mb-10">
          <div className="absolute inset-0 border-4 border-blue-400/80 rounded-full shadow-[0_0_40px_rgba(59,130,246,0.7)] animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
          <div className="absolute inset-0 border-4 border-cyan-300/80 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.6)] animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_1s]"></div>
          <div className="absolute inset-0 border-2 border-blue-300/70 rounded-full"></div>

          {/* Icônes repoussées légèrement hors du cercle pour ne pas cacher le visage */}
          <div className="absolute -bottom-2 flex items-center gap-4 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
            <ScanFace size={32} strokeWidth={1.5} className="text-cyan-200" />
            <div className="h-7 w-px bg-white/50"></div>
            <CreditCard size={32} strokeWidth={1.5} className="text-blue-200" />
          </div>
        </div>

        <div className="text-white tracking-[0.15em] font-medium text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          <div className="flex items-center justify-center gap-3 mb-2 text-lg">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.9)]"></div>
            APPROCHER VOTRE VISAGE
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.9)]"></div>
          </div>
          <div className="text-slate-200 text-sm">ou présenter votre badge</div>
        </div>
      </div>
    </div>
  )
}
