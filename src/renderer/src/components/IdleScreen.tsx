import { CreditCard, Wifi } from 'lucide-react'

export default function IdleScreen(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full select-none animate-in fade-in zoom-in duration-500">

      <div className="text-slate-500 text-sm tracking-[0.2em] uppercase mb-2">Contrôle d'accès</div>
      <div className="text-slate-300 text-xl font-light mb-16">SYSTÈME SÉCURISÉ</div>

      <div className="relative flex flex-col items-center justify-center w-64 h-64 mb-12">
        {/* Cercles animés ping */}
        <div className="absolute inset-0 border border-blue-500/20 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        <div className="absolute inset-4 border border-blue-500/10 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_1s]"></div>

        {/* Socle du lecteur */}
        <div className="absolute bottom-10 w-40 h-12 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-end justify-center pb-2"
          style={{ boxShadow: '0 0 30px rgba(59,130,246,0.15)' }}>
          <div className="w-24 h-1 bg-blue-500/50 rounded-full blur-[2px]"></div>
        </div>

        {/* Icône Carte flottante */}
        <div className="relative z-10 mb-8 text-slate-300 animate-[bounce_4s_ease-in-out_infinite]">
          <CreditCard size={80} strokeWidth={1} className="fill-slate-800" />
          <Wifi size={32} className="absolute -top-6 left-1/2 -translate-x-1/2 text-blue-400 rotate-90" />
        </div>
      </div>

      <div className="text-slate-300 tracking-[0.15em] font-medium flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
        APPROCHER VOTRE BADGE
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
      </div>

    </div>
  )
}
