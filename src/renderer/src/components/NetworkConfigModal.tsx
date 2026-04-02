import { useEffect, useState } from 'react'
import type { NetworkInfo, WifiNetwork } from '../../../preload/index.d'
import KbInput from './KbInput'

type Tab = 'info' | 'wifi' | 'ethernet'

interface Props {
  open: boolean
  onClose: () => void
}

export default function NetworkConfigModal({ open, onClose }: Props): JSX.Element | null {
  const [tab, setTab] = useState<Tab>('info')

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[500px] max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl"
        onClick={(e): void => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-slate-800 shrink-0">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <RouterIcon />
          </div>
          <div>
            <h2 className="text-white font-bold text-base">Configuration Réseau</h2>
            <p className="text-slate-500 text-xs">Informations et configuration réseau</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-slate-500 hover:text-white transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-slate-800 shrink-0 px-2">
          {(
            [
              { id: 'info', label: 'Infos', icon: <InfoTabIcon /> },
              { id: 'wifi', label: 'Wi-Fi', icon: <WifiSmallIcon /> },
              { id: 'ethernet', label: 'Ethernet', icon: <EthSmallIcon /> },
            ] as { id: Tab; label: string; icon: JSX.Element }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'info' && <InfoTab open={open} />}
          {tab === 'wifi' && <WifiTab />}
          {tab === 'ethernet' && <EthernetTab open={open} />}
        </div>

        {/* Pied */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   ONGLET INFOS
══════════════════════════════════════════════════════════ */
function InfoTab({ open }: { open: boolean }): JSX.Element {
  const [info, setInfo] = useState<NetworkInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    window.api
      .getNetworkInfo()
      .then(setInfo)
      .catch(() => setError('Impossible de récupérer les informations réseau.'))
      .finally(() => setLoading(false))
  }, [open])

  if (loading) return <Spinner label="Récupération des informations..." />
  if (error) return <ErrorMsg msg={error} />

  return (
    <div className="space-y-4">
      {info && (
        <>
          <InfoRow
            icon={<HostIcon />}
            label="Hostname"
            value={info.hostname}
            color="text-purple-400"
          />
          <Section label="Wi-Fi">
            <InfoRow
              icon={<WifiSmallIcon />}
              label={info.wifiInterface || 'Interface Wi-Fi'}
              value={info.wifiIP}
              color="text-green-400"
              badge="IPv4"
            />
            {info.wifiMac && (
              <InfoRow
                icon={<MacIcon />}
                label="Adresse MAC"
                value={info.wifiMac.toUpperCase()}
                color="text-slate-300"
              />
            )}
          </Section>
          <Section label="Ethernet">
            <InfoRow
              icon={<EthSmallIcon />}
              label={info.ethernetInterface || 'Interface Ethernet'}
              value={info.ethernetIP}
              color="text-blue-400"
              badge="IPv4"
            />
            {info.ethernetMac && (
              <InfoRow
                icon={<MacIcon />}
                label="Adresse MAC"
                value={info.ethernetMac.toUpperCase()}
                color="text-slate-300"
              />
            )}
          </Section>
        </>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   ONGLET WI-FI
══════════════════════════════════════════════════════════ */
function WifiTab(): JSX.Element {
  const [networks, setNetworks] = useState<WifiNetwork[]>([])
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [selected, setSelected] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'dhcp' | 'static'>('dhcp')
  const [ip, setIp] = useState('')
  const [prefix, setPrefix] = useState('24')
  const [gateway, setGateway] = useState('')
  const [dns, setDns] = useState('')
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const scan = (): void => {
    setScanning(true)
    setScanError('')
    setResult(null)
    window.api
      .scanWifi()
      .then((r) => {
        if (r.success) setNetworks(r.networks)
        else setScanError(r.error ?? 'Scan échoué')
      })
      .catch(() => setScanError('Erreur lors du scan'))
      .finally(() => setScanning(false))
  }

  const apply = (): void => {
    if (!selected) return
    setApplying(true)
    setResult(null)
    window.api
      .connectWifi({ ssid: selected, password, mode, ip, prefix, gateway, dns })
      .then((r) =>
        setResult({
          ok: r.success,
          msg: r.success ? `Connecté à "${selected}"` : (r.error ?? 'Erreur inconnue'),
        })
      )
      .catch((e) => setResult({ ok: false, msg: String(e) }))
      .finally(() => setApplying(false))
  }

  return (
    <div className="space-y-4">
      {/* Scan */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">Réseaux disponibles</p>
        <button
          onClick={scan}
          disabled={scanning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {scanning ? (
            <>
              <SpinIcon /> Scan...
            </>
          ) : (
            <>
              <RefreshIcon /> Scanner
            </>
          )}
        </button>
      </div>

      {scanError && <ErrorMsg msg={scanError} />}

      {/* Liste réseaux */}
      {networks.length > 0 && (
        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
          {networks.map((n) => (
            <button
              key={n.ssid}
              onClick={() => {
                setSelected(n.ssid)
                setResult(null)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                selected === n.ssid
                  ? 'bg-blue-600/30 border border-blue-500/50'
                  : 'bg-slate-800/50 hover:bg-slate-800 border border-transparent'
              }`}
            >
              <WifiSmallIcon />
              <span className="flex-1 text-sm text-white truncate">{n.ssid}</span>
              <SignalBar signal={n.signal} />
              {n.security !== '--' && (
                <span className="text-[10px] text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded">
                  {n.security}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {networks.length === 0 && !scanning && (
        <p className="text-slate-500 text-xs text-center py-4">
          Cliquez sur &quot;Scanner&quot; pour détecter les réseaux
        </p>
      )}

      {/* Formulaire connexion */}
      <div className="border-t border-slate-800 pt-4 space-y-3">
        {/* SSID — lecture seule, rempli par la sélection dans la liste */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">SSID sélectionné</label>
          <div className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 min-h-[38px] flex items-center gap-2">
            {selected ? (
              <>
                <WifiSmallIcon />
                <span className="text-sm font-mono text-white flex-1 truncate">{selected}</span>
                <button
                  onClick={() => { setSelected(''); setResult(null) }}
                  className="text-slate-500 hover:text-slate-300 transition-colors text-xs"
                  title="Désélectionner"
                >
                  ✕
                </button>
              </>
            ) : (
              <span className="text-slate-600 text-sm">Sélectionnez un réseau dans la liste</span>
            )}
          </div>
        </div>
        <KbInput
          label="Mot de passe"
          value={password}
          onChange={setPassword}
          placeholder="Mot de passe Wi-Fi"
          type="password"
        />

        <ModeToggle mode={mode} onChange={setMode} />

        {mode === 'static' && (
          <StaticFields
            ip={ip}
            setIp={setIp}
            prefix={prefix}
            setPrefix={setPrefix}
            gateway={gateway}
            setGateway={setGateway}
            dns={dns}
            setDns={setDns}
          />
        )}

        <button
          onClick={apply}
          disabled={applying || !selected}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
        >
          {applying ? (
            <>
              <SpinIcon /> Connexion...
            </>
          ) : (
            'Se connecter'
          )}
        </button>

        {result && <ResultBanner ok={result.ok} msg={result.msg} />}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   ONGLET ETHERNET
══════════════════════════════════════════════════════════ */
function EthernetTab({ open }: { open: boolean }): JSX.Element {
  const [iface, setIface] = useState('')
  const [mode, setMode] = useState<'dhcp' | 'static'>('dhcp')
  const [ip, setIp] = useState('')
  const [prefix, setPrefix] = useState('24')
  const [gateway, setGateway] = useState('')
  const [dns, setDns] = useState('')
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    if (!open) return
    window.api
      .getNetworkInfo()
      .then((info) => {
        if (info.ethernetInterface) setIface(info.ethernetInterface)
      })
      .catch(() => null)
  }, [open])

  const apply = (): void => {
    setApplying(true)
    setResult(null)
    window.api
      .setEthernet({ iface, mode, ip, prefix, gateway, dns })
      .then((r) =>
        setResult({
          ok: r.success,
          msg: r.success ? 'Configuration Ethernet appliquée' : (r.error ?? 'Erreur inconnue'),
        })
      )
      .catch((e) => setResult({ ok: false, msg: String(e) }))
      .finally(() => setApplying(false))
  }

  return (
    <div className="space-y-3">
      <KbInput
        label="Interface"
        value={iface}
        onChange={setIface}
        placeholder="ex: eth0, enp3s0"
      />

      <ModeToggle mode={mode} onChange={setMode} />

      {mode === 'static' && (
        <StaticFields
          ip={ip}
          setIp={setIp}
          prefix={prefix}
          setPrefix={setPrefix}
          gateway={gateway}
          setGateway={setGateway}
          dns={dns}
          setDns={setDns}
        />
      )}

      {mode === 'dhcp' && (
        <p className="text-xs text-slate-500 bg-slate-800/40 rounded-lg px-3 py-2">
          L&apos;adresse IP sera attribuée automatiquement par le serveur DHCP.
        </p>
      )}

      <button
        onClick={apply}
        disabled={applying || !iface}
        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
      >
        {applying ? (
          <>
            <SpinIcon /> Application...
          </>
        ) : (
          'Appliquer'
        )}
      </button>

      {result && <ResultBanner ok={result.ok} msg={result.msg} />}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   COMPOSANTS PARTAGÉS
══════════════════════════════════════════════════════════ */

function ModeToggle({
  mode,
  onChange,
}: {
  mode: 'dhcp' | 'static'
  onChange: (m: 'dhcp' | 'static') => void
}): JSX.Element {
  return (
    <div className="flex gap-2">
      {(['dhcp', 'static'] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
            mode === m
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
          }`}
        >
          {m === 'dhcp' ? 'DHCP (Auto)' : 'IP Statique'}
        </button>
      ))}
    </div>
  )
}

function StaticFields({
  ip,
  setIp,
  prefix,
  setPrefix,
  gateway,
  setGateway,
  dns,
  setDns,
}: {
  ip: string
  setIp: (v: string) => void
  prefix: string
  setPrefix: (v: string) => void
  gateway: string
  setGateway: (v: string) => void
  dns: string
  setDns: (v: string) => void
}): JSX.Element {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <KbInput label="Adresse IP" value={ip} onChange={setIp} placeholder="192.168.1.100" />
        </div>
        <div className="w-20">
          <KbInput label="Masque (/)" value={prefix} onChange={setPrefix} placeholder="24" />
        </div>
      </div>
      <KbInput label="Passerelle" value={gateway} onChange={setGateway} placeholder="192.168.1.1" />
      <KbInput label="DNS" value={dns} onChange={setDns} placeholder="8.8.8.8" />
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
  color,
  badge,
}: {
  icon: JSX.Element
  label: string
  value: string
  color: string
  badge?: string
}): JSX.Element {
  return (
    <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-3">
      <div className="text-slate-400 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className={`text-sm font-mono font-semibold ${color} truncate`}>{value}</p>
      </div>
      {badge && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 shrink-0">
          {badge}
        </span>
      )}
    </div>
  )
}

function Section({
  label,
  children,
}: {
  label: string
  children: JSX.Element | JSX.Element[]
}): JSX.Element {
  return (
    <div className="border-t border-slate-800 pt-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
        {label}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function ResultBanner({ ok, msg }: { ok: boolean; msg: string }): JSX.Element {
  return (
    <div
      className={`rounded-lg px-3 py-2 text-xs font-medium ${
        ok
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-red-500/20 text-red-400 border border-red-500/30'
      }`}
    >
      {ok ? '✓ ' : '✗ '}
      {msg}
    </div>
  )
}

function Spinner({ label }: { label: string }): JSX.Element {
  return (
    <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
      <SpinIcon /> {label}
    </div>
  )
}

function ErrorMsg({ msg }: { msg: string }): JSX.Element {
  return <div className="text-red-400 text-sm text-center py-4">{msg}</div>
}

function SignalBar({ signal }: { signal: number }): JSX.Element {
  const color = signal >= 70 ? 'text-green-400' : signal >= 40 ? 'text-yellow-400' : 'text-red-400'
  return <span className={`text-xs font-mono ${color}`}>{signal}%</span>
}

/* ══════════════════════════════════════════════════════════
   ICÔNES
══════════════════════════════════════════════════════════ */
function RouterIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3b82f6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <path d="M6.01 18H6" />
      <path d="M10.01 18H10" />
      <path d="M15 10a5 5 0 0 0-7.54-.54" />
      <path d="M19.07 7.93A10 10 0 0 0 6 6" />
      <path d="M12 10v4" />
    </svg>
  )
}
function CloseIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
function InfoTabIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}
function WifiSmallIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" />
    </svg>
  )
}
function EthSmallIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="8" width="18" height="8" rx="1" />
      <path d="M7 8V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3" />
      <path d="M7 16v3" />
      <path d="M17 16v3" />
      <path d="M12 16v3" />
    </svg>
  )
}
function HostIcon(): JSX.Element {
  return (
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
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  )
}
function MacIcon(): JSX.Element {
  return (
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
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  )
}
function RefreshIcon(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}
function SpinIcon(): JSX.Element {
  return (
    <svg
      className="animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
