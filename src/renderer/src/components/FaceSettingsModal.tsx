import { useEffect, useState } from 'react'
import { ScanFace, Users, Plus, Trash2, Power, RefreshCw, X, Check, AlertCircle } from 'lucide-react'
import { FACE_API_BASE } from '../socket'
import VideoStream from './VideoStream'
import RoiOverlay from './RoiOverlay'
import KbInput from './KbInput'

interface Props {
  open: boolean
  onClose: () => void
}

type Tab = 'users' | 'enroll'

interface FaceUser {
  name: string
  role: string
  created_at: string
  active: boolean
  dim?: number
}

interface EnrollPose {
  id: string
  label: string
  count: number
  target: number
  done: boolean
  required: boolean
}

interface EnrollStatus {
  enrolling?: boolean
  enroll_poses?: EnrollPose[]
  enroll_next?: string | null
  enroll_current_pose?: string
  enroll_complete?: boolean
  enroll_msg?: string
  enroll_name?: string
}

const POSE_FR: Record<string, string> = {
  center: 'Face',
  left: 'Gauche',
  right: 'Droite',
  up: 'Haut',
  down: 'Bas',
}

/* ============================================================
   MODAL PRINCIPALE
   ============================================================ */
export default function FaceSettingsModal({ open, onClose }: Props): JSX.Element | null {
  const [tab, setTab] = useState<Tab>('users')

  // Ferme la modale en annulant au passage un éventuel enrôlement en cours côté backend
  // (sinon CameraWorker reste en mode enrôlement et le stream home affiche les overlays de poses)
  const handleClose = (): void => {
    fetch(`${FACE_API_BASE}/enroll_live/cancel`, { method: 'POST' })
      .catch(() => null)
      .finally(() => {
        setTab('users')
        onClose()
      })
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-[560px] max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl"
        onClick={(e): void => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-slate-800 shrink-0">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <ScanFace size={20} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base">Configuration Face ID</h2>
            <p className="text-slate-500 text-xs">Utilisateurs et enrôlement facial</p>
          </div>
          <button
            onClick={handleClose}
            className="ml-auto text-slate-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-slate-800 shrink-0 px-2">
          {(
            [
              { id: 'users', label: 'Utilisateurs', icon: <Users size={13} /> },
              { id: 'enroll', label: 'Enrôler', icon: <Plus size={13} /> },
            ] as { id: Tab; label: string; icon: JSX.Element }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-cyan-500 text-cyan-400'
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
          {tab === 'users' && <UsersTab />}
          {tab === 'enroll' && <EnrollTab onDone={() => setTab('users')} />}
        </div>

        {/* Pied */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   ONGLET UTILISATEURS
   ============================================================ */
function UsersTab(): JSX.Element {
  const [users, setUsers] = useState<FaceUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = (): void => {
    setLoading(true)
    setError('')
    fetch(`${FACE_API_BASE}/api/users`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((data: FaceUser[]) => setUsers(data))
      .catch((e) => setError(`Impossible de charger les utilisateurs (${e})`))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const toggle = (name: string): void => {
    fetch(`${FACE_API_BASE}/api/users/${encodeURIComponent(name)}/toggle`, { method: 'POST' })
      .then(() => load())
      .catch(() => setError(`Échec bascule pour ${name}`))
  }

  const remove = (name: string): void => {
    if (!confirm(`Supprimer "${name}" ?`)) return
    fetch(`${FACE_API_BASE}/api/users/${encodeURIComponent(name)}`, { method: 'DELETE' })
      .then(() => load())
      .catch(() => setError(`Échec suppression de ${name}`))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {users.length} utilisateur{users.length > 1 ? 's' : ''} enrôlé{users.length > 1 ? 's' : ''}
        </p>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Recharger
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {users.length === 0 && !loading && !error && (
        <p className="text-slate-500 text-xs text-center py-8">
          Aucun utilisateur enrôlé. Utilisez l&apos;onglet « Enrôler » pour en ajouter.
        </p>
      )}

      <div className="space-y-2">
        {users.map((u) => (
          <div
            key={u.name}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${
              u.active
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-slate-900/50 border-slate-800 opacity-60'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                u.active ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-700 text-slate-500'
              }`}
            >
              {u.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{u.name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                {u.role} · {u.created_at}
              </p>
            </div>
            <button
              onClick={() => toggle(u.name)}
              className={`p-2 rounded-lg transition-colors ${
                u.active
                  ? 'text-amber-400 hover:bg-amber-500/10'
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
              title={u.active ? 'Désactiver' : 'Activer'}
            >
              <Power size={14} />
            </button>
            <button
              onClick={() => remove(u.name)}
              className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============================================================
   ONGLET ENRÔLEMENT LIVE
   ============================================================ */
function EnrollTab({ onDone }: { onDone: () => void }): JSX.Element {
  const [name, setName] = useState('')
  const [role, setRole] = useState<'user' | 'admin' | 'visitor'>('user')
  const [started, setStarted] = useState(false)
  const [status, setStatus] = useState<EnrollStatus | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!started) return
    const id = setInterval(() => {
      fetch(`${FACE_API_BASE}/status.json`)
        .then((r) => r.json())
        .then((s: EnrollStatus) => setStatus(s))
        .catch(() => null)
    }, 400)
    return () => clearInterval(id)
  }, [started])

  const start = (): void => {
    if (!name.trim()) {
      setMsg({ ok: false, text: 'Nom requis.' })
      return
    }
    const form = new FormData()
    form.append('name', name.trim())
    form.append('role', role)
    form.append('samples_per_pose', '5')

    fetch(`${FACE_API_BASE}/enroll_live/start`, { method: 'POST', body: form })
      .then((r) => r.json())
      .then((r: { ok: boolean; msg: string }) => {
        if (r.ok) {
          setStarted(true)
          setMsg({ ok: true, text: r.msg || 'Enrôlement démarré.' })
        } else {
          setMsg({ ok: false, text: r.msg })
        }
      })
      .catch((e) => setMsg({ ok: false, text: String(e) }))
  }

  const finalize = (): void => {
    fetch(`${FACE_API_BASE}/enroll_live/finalize`, { method: 'POST' })
      .then((r) => r.json())
      .then((r: { ok: boolean; msg: string }) => {
        setMsg({ ok: r.ok, text: r.msg })
        if (r.ok) {
          setStarted(false)
          setName('')
          setStatus(null)
          setTimeout(onDone, 800)
        }
      })
  }

  const cancel = (): void => {
    fetch(`${FACE_API_BASE}/enroll_live/cancel`, { method: 'POST' }).finally(() => {
      setStarted(false)
      setStatus(null)
      setMsg(null)
    })
  }

  const enrollPoses: EnrollPose[] =
    status?.enroll_poses ??
    [
      { id: 'center', label: POSE_FR.center, count: 0, target: 5, done: false, required: true },
      { id: 'left', label: POSE_FR.left, count: 0, target: 5, done: false, required: true },
      { id: 'right', label: POSE_FR.right, count: 0, target: 5, done: false, required: true },
    ]
  const allRequiredDone = status?.enroll_complete ?? false
  const nextPose = status?.enroll_next
  const currentPose = status?.enroll_current_pose
  const nextLabel = enrollPoses.find((p) => p.id === nextPose)?.label

  return (
    <div className="space-y-4">
      {!started ? (
        <>
          <KbInput
            label="Nom de l'utilisateur"
            value={name}
            onChange={setName}
            placeholder="ex: said"
          />

          <div>
            <label className="block text-xs text-slate-500 mb-1">Rôle</label>
            <div className="flex gap-2">
              {(['user', 'admin', 'visitor'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    role === r
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={start}
            className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            <ScanFace size={16} /> Démarrer l&apos;enrôlement
          </button>
        </>
      ) : (
        <>
          {/* En-tête : nom + rôle */}
          <div className="rounded-lg bg-slate-800/50 border border-slate-700 px-4 py-2.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
                Enrôlement en cours
              </p>
              <p className="text-sm font-semibold text-white">
                {name} <span className="text-slate-500">·</span>{' '}
                <span className="text-slate-400 text-xs uppercase">{role}</span>
              </p>
            </div>
            {allRequiredDone && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2 py-1 rounded">
                <Check size={12} /> Prêt
              </span>
            )}
          </div>

          {/* Stream live — l'utilisateur se voit */}
          <div className="relative">
            <VideoStream className="w-full aspect-[4/3] border border-slate-700" />
            <RoiOverlay mode="enroll" />
            {/* Hint pose courante sur le stream */}
            <div className="absolute left-3 bottom-3 right-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-sm border border-slate-700 text-[10px] font-semibold text-slate-300">
                <ScanFace size={12} className="text-cyan-400" />
                <span>
                  Pose détectée :{' '}
                  <span className="text-cyan-300 font-mono">{currentPose ?? '…'}</span>
                </span>
              </div>
              {!allRequiredDone && nextLabel && (
                <div className="px-2.5 py-1 rounded-lg bg-cyan-500/20 backdrop-blur-sm border border-cyan-500/40 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  ➜ {nextLabel}
                </div>
              )}
            </div>
          </div>

          {/* Message backend (qualité, échantillon accepté…) */}
          {status?.enroll_msg && (
            <p className="text-[11px] text-slate-400 font-mono px-1">{status.enroll_msg}</p>
          )}

          {/* Grille de poses — vignettes réelles depuis /pose_thumb */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Poses capturées</p>
            <div className="grid grid-cols-5 gap-2">
              {enrollPoses.map((pose) => {
                const isNext = pose.id === nextPose
                const thumbUrl =
                  pose.count > 0
                    ? `${FACE_API_BASE}/pose_thumb/${pose.id}.jpg?c=${pose.count}`
                    : null
                return (
                  <div
                    key={pose.id}
                    className={`aspect-square rounded-lg border overflow-hidden relative flex flex-col transition-colors ${
                      pose.done
                        ? 'border-emerald-500/50'
                        : isNext
                        ? 'border-cyan-500/60 animate-pulse'
                        : pose.required
                        ? 'border-slate-700'
                        : 'border-slate-800 opacity-60'
                    }`}
                  >
                    {thumbUrl ? (
                      <img src={thumbUrl} alt={pose.id} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex-1 bg-slate-800/50 flex items-center justify-center">
                        <ScanFace
                          size={18}
                          className={isNext ? 'text-cyan-400' : 'text-slate-600'}
                        />
                      </div>
                    )}
                    {/* Label + count */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent px-1 py-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] uppercase tracking-wider font-semibold ${
                            pose.done
                              ? 'text-emerald-300'
                              : isNext
                              ? 'text-cyan-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {pose.label}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold ${
                            pose.done ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {pose.count}/{pose.target}
                        </span>
                      </div>
                    </div>
                    {pose.done && (
                      <div className="absolute top-1 right-1 p-0.5 rounded-full bg-emerald-500">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={cancel}
              className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={finalize}
              disabled={!allRequiredDone}
              className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
            >
              Valider
            </button>
          </div>
        </>
      )}

      {msg && (
        <div
          className={`rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-2 ${
            msg.ok
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {msg.ok ? <Check size={14} /> : <AlertCircle size={14} />}
          {msg.text}
        </div>
      )}
    </div>
  )
}
