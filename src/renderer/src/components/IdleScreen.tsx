import { CreditCard, ScanFace, ShieldCheck } from 'lucide-react'
import VideoStream from './VideoStream'
import RoiOverlay from './RoiOverlay'

interface IdleScreenProps {
  /** Coupe le flux caméra (ex. pendant la configuration admin) */
  streamPaused?: boolean
}

export default function IdleScreen({ streamPaused = false }: IdleScreenProps): JSX.Element {
  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full select-none overflow-hidden bg-black">
      {/* Stream vidéo plein écran */}
      <div className="absolute inset-0 z-0">
        <VideoStream className="w-full h-full !rounded-none" paused={streamPaused} />
      </div>

      {/* Voile sombre — léger pour garder la caméra lisible */}
      <div className="absolute inset-0 bg-[#090e17]/30 z-0" />

      {/* Grille tech en arrière-plan */}
      <div
        className="absolute inset-0 opacity-20 z-0 pointer-events-none bg-[size:40px_40px] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)]"
      />

      {/* Cadre ROI — couvre toute la zone, positionné dynamiquement par /status.json */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <RoiOverlay paused={streamPaused} />
      </div>

      {/* Contenu superposé : titre + instructions (au-dessus du cadre ROI) */}
      <div className="relative z-20 flex flex-col items-center justify-between h-full w-full animate-in fade-in duration-500 py-10 px-6 pointer-events-none">
        {/* Haut : carte titre floutée */}
        <div className="flex flex-col items-center backdrop-blur-md bg-black/25 py-4 px-10 rounded-2xl border border-slate-700/70 shadow-xl">
          <ShieldCheck className="text-blue-400 mb-2" size={32} />
          <h2 className="text-[11px] tracking-[0.3em] text-slate-400 uppercase mb-1">
            Contrôle d&apos;accès
          </h2>
          <h3 className="text-2xl font-light tracking-wide text-white">
            SYSTÈME <span className="font-semibold text-blue-400">SÉCURISÉ</span>
          </h3>
        </div>

        {/* Bas : pill d'instruction */}
        <div className="flex flex-col items-center gap-2 backdrop-blur-md bg-slate-900/60 py-4 px-8 rounded-full border border-slate-700/50 shadow-lg">
          <div className="flex items-center gap-3 text-base">
            <ScanFace className="text-cyan-400" size={22} />
            <span className="font-semibold tracking-wide text-white">
              PLACEZ VOTRE VISAGE DANS LE CADRE
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <div className="w-10 h-px bg-slate-600" />
            <div className="flex items-center gap-2 px-2">
              <CreditCard size={12} />
              <span>ou présentez votre badge</span>
            </div>
            <div className="w-10 h-px bg-slate-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
