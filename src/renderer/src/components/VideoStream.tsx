import { useEffect, useRef, useState } from 'react'
import { Loader2, VideoOff } from 'lucide-react'
import { FACE_STREAM_URL } from '../socket'

const buildUrl = (): string => `${FACE_STREAM_URL}?t=${Date.now()}`

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
  retryDelay = 1500,
  paused = false,
}: Props): JSX.Element {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [url, setUrl] = useState<string>(buildUrl)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = (): void => {
    if (retryRef.current) {
      clearTimeout(retryRef.current)
      retryRef.current = null
    }
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current)
      watchdogRef.current = null
    }
  }

  useEffect(() => {
    return clearTimers
  }, [])

  // Relance le flux à la sortie de l'état "paused" (cache-busting pour forcer le GET)
  useEffect(() => {
    if (!paused) {
      setError(false)
      setLoaded(false)
      setUrl(buildUrl())
    } else {
      clearTimers()
      setLoaded(false)
    }
  }, [paused])

  // Watchdog : si onLoad ne se déclenche pas dans les 1.5s après un changement d'URL,
  // on force une nouvelle connexion. MJPEG peut rester ouvert sans envoyer d'octets
  // (ni onLoad ni onError), ce qui laisse l'<img> noir indéfiniment.
  // Ne s'arme que tant qu'aucune frame n'a été reçue — une fois le flux établi,
  // on ne le coupe plus.
  useEffect(() => {
    if (paused || loaded) return
    if (watchdogRef.current) clearTimeout(watchdogRef.current)
    watchdogRef.current = setTimeout(() => {
      setUrl(buildUrl())
    }, 1500)
    return (): void => {
      if (watchdogRef.current) clearTimeout(watchdogRef.current)
    }
  }, [url, paused, loaded])

  const handleError = (): void => {
    if (paused) return
    setError(true)
    setLoaded(false)
    if (retryRef.current) clearTimeout(retryRef.current)
    retryRef.current = setTimeout(() => {
      setError(false)
      setUrl(buildUrl())
    }, retryDelay)
  }

  const handleLoad = (): void => {
    setError(false)
    setLoaded(true)
    // Le flux envoie des octets → on annule le watchdog
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current)
      watchdogRef.current = null
    }
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
    <div style={style} className={`relative bg-black ${className ?? ''}`}>
      <img
        key={url}
        src={url}
        alt="Flux caméra"
        onError={handleError}
        onLoad={handleLoad}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500 bg-black/60 pointer-events-none">
          <Loader2 size={28} className="animate-spin opacity-70" />
          <p className="text-xs tracking-wide">Connexion caméra…</p>
        </div>
      )}
    </div>
  )
}
