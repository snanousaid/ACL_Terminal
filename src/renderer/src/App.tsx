import { useEffect, useRef, useState } from 'react'
import socket, { SERVER_URL } from './socket'
import AccessCard, { AccessEvent } from './components/AccessCard'
import IdleScreen from './components/IdleScreen'
import StatusBar from './components/StatusBar'
import NetworkConfigModal from './components/NetworkConfigModal'
import { KeyboardProvider } from './context/KeyboardContext'
import VirtualKeyboard from './components/VirtualKeyboard'
import KbInput from './components/KbInput'

const DISPLAY_DURATION = 5000
const LOG_MAX = 20
const SHOW_LOGS = false
const SETTINGS_ICON_DURATION = 6000
const ADMIN_PASSWORD = '2899100*-+'

interface LogEntry {
  time: string
  type: 'connect' | 'disconnect' | 'event' | 'error'
  raw: string
}

function nowTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function App(): JSX.Element {
  const [connected, setConnected] = useState(false)
  const [activeEvent, setActiveEvent] = useState<AccessEvent | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [showSettingsIcon, setShowSettingsIcon] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showNetworkModal, setShowNetworkModal] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const settingsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logEndRef = useRef<HTMLDivElement | null>(null)

  const addLog = (type: LogEntry['type'], raw: string): void => {
    const entry: LogEntry = { time: nowTime(), type, raw }
    console.log(`[VioWatch][${type}]`, raw)
    setLogs((prev) => [entry, ...prev].slice(0, LOG_MAX))
  }

  const handleDoubleClick = (): void => {
    setShowSettingsIcon(true)
    if (settingsTimerRef.current) clearTimeout(settingsTimerRef.current)
    settingsTimerRef.current = setTimeout(() => setShowSettingsIcon(false), SETTINGS_ICON_DURATION)
  }

  const handleSettingsClick = (e: React.MouseEvent): void => {
    e.stopPropagation()
    setPassword('')
    setPasswordError(false)
    setShowPasswordModal(true)
    setShowSettingsIcon(false)
    if (settingsTimerRef.current) clearTimeout(settingsTimerRef.current)
  }

  const handlePasswordSubmit = (): void => {
    if (password === ADMIN_PASSWORD) {
      setShowPasswordModal(false)
      setPassword('')
      setPasswordError(false)
      setShowNetworkModal(true)
    } else {
      setPasswordError(true)
    }
  }

  useEffect(() => {
    return (): void => {
      if (settingsTimerRef.current) clearTimeout(settingsTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const onConnect = (): void => {
      setConnected(true)
      addLog('connect', `Connecté à ${SERVER_URL}`)
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
        const ev: AccessEvent = typeof raw === 'string' ? JSON.parse(raw) : (raw as AccessEvent)
        addLog('event', typeof raw === 'string' ? raw : JSON.stringify(ev, null, 2))
        setActiveEvent(ev)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setActiveEvent(null), DISPLAY_DURATION)
      } catch (e) {
        addLog('error', `Parse error: ${e}`)
      }
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('event', onEvent)

    return (): void => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.off('event', onEvent)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const logColor: Record<LogEntry['type'], string> = {
    connect: 'text-green-400',
    disconnect: 'text-yellow-400',
    event: 'text-blue-300',
    error: 'text-red-400',
  }

  return (
    <KeyboardProvider>
      <div
        className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden relative"
        onDoubleClick={handleDoubleClick}
      >
        {/* Icône paramètres — centrée à droite après double-clic */}
        {showSettingsIcon && (
          <button
            onClick={handleSettingsClick}
            className="absolute top-1/2 -translate-y-1/2 right-4 z-40 p-2 rounded-full bg-slate-800/80 border border-slate-600 hover:bg-slate-700 transition-all duration-200 backdrop-blur-sm"
            title="Paramètres"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        )}

        {/* Dialog mot de passe admin */}
        {showPasswordModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPasswordModal(false)}
          >
            <div
              className="w-80 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6"
              onClick={(e): void => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">Accès administrateur</h3>
                  <p className="text-slate-400 text-xs">Entrez le mot de passe admin</p>
                </div>
              </div>

              <KbInput
                value={password}
                onChange={(v): void => {
                  setPassword(v)
                  setPasswordError(false)
                }}
                type="password"
                placeholder="Mot de passe"
                autoFocus
                className={`w-full bg-slate-800 border ${
                  passwordError ? 'border-red-500' : 'border-slate-600'
                } rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 transition-colors font-mono cursor-text min-h-[42px] flex items-center`}
              />

              {passwordError && (
                <p className="text-red-400 text-xs mt-2">Mot de passe incorrect.</p>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal configuration réseau */}
        <NetworkConfigModal open={showNetworkModal} onClose={() => setShowNetworkModal(false)} />

        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full bg-blue-500"
              style={{ boxShadow: '0 0 10px rgba(59,130,246,0.6)' }}
            />
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-blue-500">Vio</span>
              <span className="text-white">Watch</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="14" x="2" y="3" rx="2" />
              <line x1="8" x2="16" y1="21" y2="21" />
              <line x1="12" x2="12" y1="17" y2="21" />
            </svg>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase">
              Moniteur d&apos;accès
            </span>
          </div>
        </header>

        {/* Log panel */}
        {SHOW_LOGS && (
          <div
            className="bg-zinc-950 text-xs font-mono border-b border-zinc-800 overflow-y-auto"
            style={{ height: '220px' }}
          >
            <div className="sticky top-0 bg-zinc-900 px-3 py-1 flex items-center justify-between border-b border-zinc-800">
              <span className="text-zinc-400">Socket logs — {SERVER_URL}</span>
              <button
                onClick={() => setLogs([])}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
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
          {activeEvent ? <AccessCard event={activeEvent} /> : <IdleScreen />}
        </div>

        {/* Status bar */}
        <StatusBar connected={connected} />

        {/* Clavier virtuel global */}
        <VirtualKeyboard />
      </div>
    </KeyboardProvider>
  )
}

export default App
