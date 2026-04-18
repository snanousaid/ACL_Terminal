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
 * Cadre ROI HUD (4 coins en L + ligne de scan) superposé au stream.
 * Les coins sont dessinés en SVG pour un rendu net et un glow via drop-shadow.
 * Aligné pixel-près avec le backend (mêmes pourcentages lus depuis /status.json).
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

  const palette = {
    idle: { color: '#22d3ee', scan: '#22d3ee' },
    in: { color: '#a5f3fc', scan: '#a5f3fc' },
    out: { color: '#94a3b8', scan: '#94a3b8' },
    granted: { color: '#34d399', scan: '#34d399' },
    denied: { color: '#ef4444', scan: '#ef4444' },
  }[state]

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute"
        style={{
          left: `${roi.x * 100}%`,
          top: `${roi.y * 100}%`,
          width: `${roi.w * 100}%`,
          height: `${roi.h * 100}%`,
        }}
      >
        {/* SVG des 4 coins en L — rendu propre, glow via filter */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full transition-[stroke] duration-300"
          style={{ filter: `drop-shadow(0 0 8px ${palette.color})` }}
        >
          {/* Coin haut-gauche */}
          <path
            d="M 2,18 L 2,4 Q 2,2 4,2 L 18,2"
            stroke={palette.color}
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Coin haut-droit */}
          <path
            d="M 82,2 L 96,2 Q 98,2 98,4 L 98,18"
            stroke={palette.color}
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Coin bas-gauche */}
          <path
            d="M 2,82 L 2,96 Q 2,98 4,98 L 18,98"
            stroke={palette.color}
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Coin bas-droit */}
          <path
            d="M 82,98 L 96,98 Q 98,98 98,96 L 98,82"
            stroke={palette.color}
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Ligne de scan animée — cachée sur granted/denied */}
        {state !== 'granted' && state !== 'denied' && (
          <div
            className="absolute left-[6%] right-[6%] h-[2px] rounded-full"
            style={{
              backgroundColor: palette.scan,
              boxShadow: `0 0 12px ${palette.scan}, 0 0 4px ${palette.scan}`,
              animation: 'roi-scan 2.8s ease-in-out infinite',
            }}
          />
        )}

        {/* Flash plein cadre sur granted/denied */}
        {(state === 'granted' || state === 'denied') && (
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              backgroundColor: palette.color,
              animation: 'roi-flash 1.4s ease-out infinite',
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes roi-scan {
          0%, 100% { top: 0%; opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { top: calc(100% - 2px); opacity: 1; }
        }
        @keyframes roi-flash {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.22; }
        }
      `}</style>
    </div>
  )
}
