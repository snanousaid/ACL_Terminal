import { CreditCard, ScanFace } from 'lucide-react'
import VideoStream from './VideoStream'
import RoiOverlay from './RoiOverlay'

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
        {/* Cadre ROI — zone de détection dans laquelle placer le visage */}
        <RoiOverlay paused={streamPaused} />
      </div>

      {/* Overlay : textes d'instruction. Le cadre ROI (au-dessous) fait déjà la cible visuelle. */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full w-full animate-in fade-in duration-500 px-8 py-10 pointer-events-none">
        {/* Haut : titre */}
        <div className="flex flex-col items-center">
          <div className="text-white text-sm tracking-[0.25em] uppercase mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            Contrôle d&apos;accès
          </div>
          <div className="text-white text-2xl font-light drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            SYSTÈME SÉCURISÉ
          </div>
        </div>

        {/* Bas : icônes + consigne */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
            <ScanFace size={32} strokeWidth={1.5} className="text-cyan-200" />
            <div className="h-7 w-px bg-white/50" />
            <CreditCard size={32} strokeWidth={1.5} className="text-blue-200" />
          </div>
          <div className="text-white tracking-[0.15em] font-medium text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-center gap-3 mb-1 text-lg">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.9)]" />
              PLACEZ VOTRE VISAGE DANS LE CADRE
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.9)]" />
            </div>
            <div className="text-slate-200 text-sm">ou présenter votre badge</div>
          </div>
        </div>
      </div>
    </div>
  )
}
