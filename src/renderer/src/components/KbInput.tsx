import { useKeyboard } from '../context/KeyboardContext'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: 'text' | 'password'
  className?: string
  label?: string
  autoFocus?: boolean
}

export default function KbInput({ value, onChange, placeholder, type = 'text', className, label, autoFocus }: Props): JSX.Element {
  const { open, isOpen } = useKeyboard()

  const handleOpen = (): void => open(value, onChange, type)

  const display = type === 'password' ? '•'.repeat(value.length) : value

  return (
    <div className="w-full">
      {label && <label className="block text-xs text-slate-500 mb-1">{label}</label>}
      <div
        role="textbox"
        tabIndex={0}
        autoFocus={autoFocus}
        onPointerDown={handleOpen}
        onFocus={handleOpen}
        className={
          className ??
          'w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500 transition-colors font-mono cursor-text min-h-[38px] flex items-center gap-1'
        }
      >
        <span className="flex-1 truncate">
          {display || <span className="text-slate-600">{placeholder}</span>}
        </span>
        {isOpen && (
          <span className="inline-block w-0.5 h-4 bg-blue-400 animate-pulse shrink-0" />
        )}
      </div>
    </div>
  )
}
