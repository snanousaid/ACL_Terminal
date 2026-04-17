import { useEffect, useState } from 'react'
import { FACE_API_BASE } from '../socket'

interface Roi {
  enabled: boolean
  x: number
  y: number
  w: number
  h: number
}

type RoiState = 'idle' | 'in' | 'out' | 'granted' | 'denied'

interface Props {
  /** Arrête le polling (ex. pendant une config admin qui masque le stream) */
  paused?: boolean
  /** Intervalle de polling /status.json en ms */
  pollMs?: number
}

/**
 * Cadre ROI superposé au stream. Lit la région depuis /status.json (backend) et
 * change de couleur selon l'état : idle/in/out/granted/denied.
 * Le cadre est aligné au pixel près avec celui dessiné par camera_worker.py
 * car les deux utilisent les mêmes pourcentages.
 */
export default function RoiOverlay({ paused = false, pollMs = 300 }: Props): JSX.Element | null {
  const [roi, setRoi] = useState<Roi | null>(null)
  const [state, setState] = useState<RoiState>('idle')

  useEffect(() => {
    if (paused) return
    let cancelled = false
    const tick = (): void => {
      fetch(`${FACE_API_BASE}/status.json`)
        .then((r) => r.json())
        .then((s: { roi?: Roi; face?: boolean; in_roi?: boolean; access?: string }) => {
          if (cancelled) return
          if (s.roi) setRoi(s.roi)
          if (!s.face) setState('idle')
          else if (s.access === 'granted') setState('granted')
          else if (s.access === 'denied') setState('denied')
          else if (s.in_roi === false || s.access === 'out_of_zone') setState('out')
          else setState('in')
        })
        .catch(() => null)
    }
    tick()
    const id = setInterval(tick, pollMs)
    return (): void => {
      cancelled = true
      clearInterval(id)
    }
  }, [paused, pollMs])

  if (!roi || !roi.enabled) return null

  const border = {
    idle: 'border-cyan-300/80 shadow-[0_0_30px_rgba(103,232,249,0.35)]',
    in: 'border-cyan-200 shadow-[0_0_30px_rgba(165,243,252,0.55)]',
    out: 'border-slate-300/60 shadow-[0_0_20px_rgba(148,163,184,0.25)]',
    granted: 'border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.7)]',
    denied: 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.7)]',
  }[state]

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className={`absolute border-[3px] rounded-2xl transition-colors duration-300 ${border} ${
          state === 'idle' ? 'animate-pulse' : ''
        }`}
        style={{
          left: `${roi.x * 100}%`,
          top: `${roi.y * 100}%`,
          width: `${roi.w * 100}%`,
          height: `${roi.h * 100}%`,
        }}
      />
    </div>
  )
}
