import { useEffect, useRef, useState } from 'react'
import { VideoOff } from 'lucide-react'
import { FACE_STREAM_URL } from '../socket'

interface Props {
  className?: string
  style?: React.CSSProperties
  /** Intervalle de reconnexion en cas d'erreur (ms) */
  retryDelay?: number
  /** Si vrai, coupe la connexion MJPEG (libère la caméra côté client) */
  paused?: boolean
}

/**
 * Affiche le flux MJPEG depuis FACE_detection (http://localhost:5000/video_feed).
 * Reconnexion automatique si le backend n'est pas disponible.
 * `paused` : coupe la connexion MJPEG (utile quand l'écran d'accueil est masqué).
 */
export default function VideoStream({
  className,
  style,
  retryDelay = 3000,
  paused = false,
}: Props): JSX.Element {
  const [error, setError] = useState(false)
  const [url, setUrl] = useState(FACE_STREAM_URL)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return (): void => {
      if (retryRef.current) clearTimeout(retryRef.current)
    }
  }, [])

  // Relance le flux à la sortie de l'état "paused" (cache-busting pour forcer le GET)
  useEffect(() => {
    if (!paused) {
      setError(false)
      setUrl(`${FACE_STREAM_URL}?t=${Date.now()}`)
    }
  }, [paused])

  const handleError = (): void => {
    if (paused) return
    setError(true)
    if (retryRef.current) clearTimeout(retryRef.current)
    retryRef.current = setTimeout(() => {
      setError(false)
      setUrl(`${FACE_STREAM_URL}?t=${Date.now()}`)
    }, retryDelay)
  }

  const handleLoad = (): void => {
    setError(false)
  }

  if (paused) {
    return (
      <div
        style={style}
        className={`bg-black ${className ?? ''}`}
        aria-label="Flux caméra en pause"
      />
    )
  }

  if (error) {
    return (
      <div
        style={style}
        className={`flex flex-col items-center justify-center gap-2 bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-500 ${
          className ?? ''
        }`}
      >
        <VideoOff size={32} className="opacity-60" />
        <p className="text-xs">Caméra indisponible — reconnexion…</p>
      </div>
    )
  }

  return (
    <img
      src={url}
      alt="Flux caméra"
      onError={handleError}
      onLoad={handleLoad}
      style={style}
      className={`object-cover bg-black rounded-2xl ${className ?? ''}`}
    />
  )
}
