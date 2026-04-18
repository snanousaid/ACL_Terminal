import { useEffect, useRef, useState } from 'react'
import { Loader2, VideoOff } from 'lucide-react'
import { FACE_STREAM_URL } from '../socket'

const buildUrl = (): string => `${FACE_STREAM_URL}?t=${Date.now()}`

// Placeholder 1×1 transparent pour "vider" src sans déclencher onError de Chromium
// (img.src = '' résout vers l'URL de la page et émet error → boucle de reconnexion).
const BLANK_PX =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

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
  const imgRef = useRef<HTMLImageElement | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = (): void => {
    if (retryRef.current) {
      clearTimeout(retryRef.current)
      retryRef.current = null
    }
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current)
      watchdogRef.current = null
    }
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  // Cleanup sur démontage : force la fermeture de la socket MJPEG Chromium.
  // Sans ça, la connexion reste en CLOSE_WAIT et Chromium peut refuser de
  // rouvrir /video_feed au prochain montage (limite 6 connexions par host).
  useEffect(() => {
    return (): void => {
      clearTimers()
      if (imgRef.current) {
        imgRef.current.src = BLANK_PX
      }
    }
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

  // Contrôle impératif du src : on ne laisse pas React démonter/remonter l'img
  // (ça évite les sockets MJPEG orphelines en CLOSE_WAIT). Avant de charger une
  // nouvelle URL on vide d'abord src pour fermer proprement la connexion
  // précédente côté Chromium.
  useEffect(() => {
    const img = imgRef.current
    if (!img) return
    img.src = BLANK_PX
    if (paused) return
    const id = setTimeout(() => {
      if (imgRef.current) imgRef.current.src = url
    }, 50)
    return (): void => clearTimeout(id)
  }, [url, paused])

  // Détection fiable que le flux MJPEG reçoit des frames : on poll naturalWidth
  // de l'<img>. onLoad n'est pas fiable sur multipart/x-mixed-replace dans Chromium
  // (peut ne jamais se déclencher), donc on vérifie la taille décodée.
  useEffect(() => {
    if (paused || loaded) return
    pollRef.current = setInterval(() => {
      const img = imgRef.current
      // > 100 px pour exclure le BLANK_PX de 1×1 placé entre les reconnexions
      if (img && img.naturalWidth > 100) {
        setLoaded(true)
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = null
        if (watchdogRef.current) clearTimeout(watchdogRef.current)
        watchdogRef.current = null
      }
    }, 250)
    return (): void => {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [url, paused, loaded])

  // Watchdog : si aucune frame n'est reçue dans les 4s après un changement d'URL,
  // on force une nouvelle connexion. Délai plus long pour laisser le temps au
  // backend + caméra de produire la première frame.
  // Ne s'arme que tant qu'aucune frame n'a été reçue — une fois le flux établi,
  // on ne le coupe plus.
  useEffect(() => {
    if (paused || loaded) return
    if (watchdogRef.current) clearTimeout(watchdogRef.current)
    watchdogRef.current = setTimeout(() => {
      setUrl(buildUrl())
    }, 4000)
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
    // onLoad se déclenche aussi pour BLANK_PX (1×1) qu'on place entre deux
    // reconnexions. On ne considère le flux comme chargé que si la frame
    // décodée a une vraie taille (exclut le placeholder).
    const img = imgRef.current
    if (!img || img.naturalWidth <= 100) return
    setError(false)
    setLoaded(true)
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current)
      watchdogRef.current = null
    }
  }

  // L'<img> reste TOUJOURS monté. src="" quand paused ferme la socket
  // MJPEG proprement ; quand on reprend on remet l'URL fraîche.
  // Évite les connexions orphelines qui saturent Chromium (6 par host max).
  return (
    <div style={style} className={`relative bg-black ${className ?? ''}`}>
      <img
        ref={imgRef}
        alt="Flux caméra"
        onError={handleError}
        onLoad={handleLoad}
        className={`absolute inset-0 w-full h-full object-cover ${paused ? 'invisible' : ''}`}
      />
      {!paused && !loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 bg-black/30 pointer-events-none">
          <Loader2 size={28} className="animate-spin opacity-70" />
          <p className="text-xs tracking-wide">Connexion caméra…</p>
        </div>
      )}
      {error && !paused && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/80 text-slate-500 pointer-events-none">
          <VideoOff size={32} className="opacity-60" />
          <p className="text-xs">Caméra indisponible — reconnexion…</p>
        </div>
      )}
    </div>
  )
}
