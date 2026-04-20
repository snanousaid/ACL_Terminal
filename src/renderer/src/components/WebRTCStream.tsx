import { useEffect, useRef, useState } from 'react'
import { Loader2, VideoOff } from 'lucide-react'
import { FACE_WEBRTC_OFFER_URL } from '../socket'

interface Props {
  className?: string
  style?: React.CSSProperties
  /** Intervalle de reconnexion en cas d'erreur (ms) */
  retryDelay?: number
  /** Si vrai, ferme la PeerConnection (libère la caméra côté backend) */
  paused?: boolean
}

/**
 * Affiche le flux vidéo WebRTC depuis FACE_detection.
 * Signalisation : POST SDP offer vers /webrtc/offer, reçoit SDP answer.
 */
export default function WebRTCStream({
  className,
  style,
  retryDelay = 2000,
  paused = false,
}: Props): JSX.Element {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Génération pour invalider les négociations en cours lors d'un unmount/retry
  const genRef = useRef(0)

  const closePc = (): void => {
    if (pcRef.current) {
      try {
        pcRef.current.close()
      } catch {
        /* noop */
      }
      pcRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const connect = async (): Promise<void> => {
    const gen = ++genRef.current
    closePc()
    setError(false)
    setLoaded(false)

    // Localhost uniquement : pas de STUN (candidats host suffisent).
    // L'ajout d'un serveur STUN externe provoque des timeouts quand le réseau
    // filtre UDP 19302 (erreur `stun_port.cc: Binding request timed out`).
    const pc = new RTCPeerConnection({ iceServers: [] })
    pcRef.current = pc

    pc.addTransceiver('video', { direction: 'recvonly' })

    pc.ontrack = (ev) => {
      if (gen !== genRef.current) return
      if (videoRef.current && ev.streams[0]) {
        videoRef.current.srcObject = ev.streams[0]
      }
    }

    pc.onconnectionstatechange = (): void => {
      if (gen !== genRef.current) return
      const st = pc.connectionState
      if (st === 'connected') {
        setLoaded(true)
        setError(false)
      } else if (st === 'failed' || st === 'disconnected' || st === 'closed') {
        setLoaded(false)
        if (!paused && gen === genRef.current) {
          setError(true)
          if (retryRef.current) clearTimeout(retryRef.current)
          retryRef.current = setTimeout(() => {
            if (!paused) void connect()
          }, retryDelay)
        }
      }
    }

    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      const res = await fetch(FACE_WEBRTC_OFFER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sdp: offer.sdp, type: offer.type }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const answer = await res.json()
      if (gen !== genRef.current) return
      await pc.setRemoteDescription(answer)
    } catch (err) {
      console.warn('[WebRTCStream] negotiation failed:', err)
      if (gen !== genRef.current) return
      setError(true)
      setLoaded(false)
      if (retryRef.current) clearTimeout(retryRef.current)
      retryRef.current = setTimeout(() => {
        if (!paused) void connect()
      }, retryDelay)
    }
  }

  useEffect(() => {
    if (paused) {
      if (retryRef.current) {
        clearTimeout(retryRef.current)
        retryRef.current = null
      }
      closePc()
      setLoaded(false)
      setError(false)
      return
    }
    void connect()
    return (): void => {
      genRef.current++ // invalide toute négociation en cours
      if (retryRef.current) {
        clearTimeout(retryRef.current)
        retryRef.current = null
      }
      closePc()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused])

  return (
    <div style={style} className={`relative bg-black ${className ?? ''}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        // pointer-events-none : Chromium consomme le double-clic sur <video>
        // pour le plein écran, ce qui empêcherait le double-clic du parent
        // (ouverture des réglages admin) de remonter.
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
          paused ? 'invisible' : ''
        }`}
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
