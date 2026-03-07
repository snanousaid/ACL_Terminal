import { useEffect, useRef, useState } from 'react'
import socket from './socket'
import AccessCard, { AccessEvent } from './components/AccessCard'
import IdleScreen from './components/IdleScreen'
import StatusBar from './components/StatusBar'

const DISPLAY_DURATION = 5000 // ms — durée d'affichage de la card avant retour idle
const LOG_MAX = 20

interface LogEntry {
  time: string
  type: 'connect' | 'disconnect' | 'event' | 'error'
  raw: string
}

function nowTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function App(): JSX.Element {
  const [connected, setConnected]       = useState(false)
  const [activeEvent, setActiveEvent]   = useState<AccessEvent | null>(null)
  const [grantedCount, setGrantedCount] = useState(0)
  const [deniedCount, setDeniedCount]   = useState(0)
  const [logs, setLogs]                 = useState<LogEntry[]>([])
  const [showLogs, setShowLogs]         = useState(false)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logEndRef = useRef<HTMLDivElement | null>(null)

  const addLog = (type: LogEntry['type'], raw: string): void => {
    const entry: LogEntry = { time: nowTime(), type, raw }
    console.log(`[VioWatch][${type}]`, raw)
    setLogs((prev) => [entry, ...prev].slice(0, LOG_MAX))
  }

  useEffect(() => {
    const onConnect = (): void => {
      setConnected(true)
      addLog('connect', `Connecté à ${socket.io.uri}`)
    }
    const onDisconnect = (reason: string): void => {
      setConnected(false)
      addLog('disconnect', `Déconnecté — ${reason}`)
    }
    const onConnectError = (err: Error): void => {
      addLog('error', `Erreur connexion: ${err.message}`)
    }

    const onEvent = (raw: unknown): void => {
      try {
        const ev: AccessEvent = typeof raw === 'string' ? JSON.parse(raw) : raw
        addLog('event', typeof raw === 'string' ? raw : JSON.stringify(ev, null, 2))

        if (ev.eventType === 'ACCESS_GRANTED') setGrantedCount((c) => c + 1)
        else                                   setDeniedCount((c) => c + 1)

        setActiveEvent(ev)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setActiveEvent(null), DISPLAY_DURATION)
      } catch (e) {
        addLog('error', `Parse error: ${e}`)
      }
    }

    socket.on('connect',       onConnect)
    socket.on('disconnect',    onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('event',         onEvent)

    return () => {
      socket.off('connect',       onConnect)
      socket.off('disconnect',    onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.off('event',         onEvent)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const logColor: Record<LogEntry['type'], string> = {
    connect:    'text-green-400',
    disconnect: 'text-yellow-400',
    event:      'text-blue-300',
    error:      'text-red-400',
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <span className="font-bold text-lg tracking-tight text-foreground">
          <span className="text-red-500">Vio</span>Watch
        </span>
        <button
          onClick={() => setShowLogs((v) => !v)}
          className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:bg-muted transition-colors"
        >
          {showLogs ? 'Masquer logs' : 'Voir logs'}
        </button>
      </div>

      {/* Log panel */}
      {showLogs && (
        <div className="bg-zinc-950 text-xs font-mono border-b border-zinc-800 overflow-y-auto"
             style={{ height: '220px' }}>
          <div className="sticky top-0 bg-zinc-900 px-3 py-1 flex items-center justify-between border-b border-zinc-800">
            <span className="text-zinc-400">Socket logs — {socket.io.uri}</span>
            <button onClick={() => setLogs([])} className="text-zinc-500 hover:text-zinc-300 text-xs">
              clear
            </button>
          </div>
          {logs.length === 0 && (
            <p className="text-zinc-600 px-3 py-2">En attente de messages...</p>
          )}
          {logs.map((l, i) => (
            <div key={i} className="px-3 py-1 border-b border-zinc-900 hover:bg-zinc-900">
              <span className="text-zinc-500 mr-2">{l.time}</span>
              <span className={`mr-2 uppercase font-bold ${logColor[l.type]}`}>[{l.type}]</span>
              <span className="text-zinc-300 break-all whitespace-pre-wrap">{l.raw}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}

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

