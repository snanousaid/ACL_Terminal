import { useEffect, useRef, useState } from 'react'
import socket from './socket'
import AccessCard, { AccessEvent } from './components/AccessCard'
import IdleScreen from './components/IdleScreen'
import StatusBar from './components/StatusBar'

const DISPLAY_DURATION = 5000 // ms — durée d'affichage de la card avant retour idle

function App(): JSX.Element {
  const [connected, setConnected]     = useState(false)
  const [activeEvent, setActiveEvent] = useState<AccessEvent | null>(null)
  const [grantedCount, setGrantedCount] = useState(0)
  const [deniedCount, setDeniedCount]   = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onConnect    = (): void => setConnected(true)
    const onDisconnect = (): void => setConnected(false)

    const onEvent = (raw: unknown): void => {
      try {
        const ev: AccessEvent = typeof raw === 'string' ? JSON.parse(raw) : raw

        // Update today counters
        if (ev.eventType === 'ACCESS_GRANTED') setGrantedCount((c) => c + 1)
        else                                   setDeniedCount((c) => c + 1)

        // Show card
        setActiveEvent(ev)

        // Auto-hide after DISPLAY_DURATION
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setActiveEvent(null), DISPLAY_DURATION)
      } catch { /* skip */ }
    }

    socket.on('connect',    onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('event',      onEvent)

    return () => {
      socket.off('connect',    onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('event',      onEvent)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <span className="font-bold text-lg tracking-tight text-foreground">
          <span className="text-red-500">Vio</span>Watch
        </span>
        <span className="text-xs text-muted-foreground">Moniteur d'accès</span>
      </div>

      {/* Main area */}
      <div className="flex-1 overflow-hidden">
        {activeEvent
          ? <AccessCard event={activeEvent} />
          : <IdleScreen connected={connected} />
        }
      </div>

      {/* Status bar */}
      <StatusBar connected={connected} granted={grantedCount} denied={deniedCount} />
    </div>
  )
}

export default App

