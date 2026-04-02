import { useRef, useState } from 'react'
import Keyboard from 'react-simple-keyboard'
import { useKeyboard } from '../context/KeyboardContext'

type LayoutName = 'default' | 'shift' | 'numbers'

const LAYOUT = {
  default: [
    'a z e r t y u i o p {bksp}',
    'q s d f g h j k l m',
    '{shift} w x c v b n , . {shift}',
    '{numbers} {space} {enter}',
  ],
  shift: [
    'A Z E R T Y U I O P {bksp}',
    'Q S D F G H J K L M',
    '{shift} W X C V B N ; : {shift}',
    '{numbers} {space} {enter}',
  ],
  numbers: [
    '1 2 3 4 5 6 7 8 9 0 {bksp}',
    '@ # / - _ = + * ( )',
    '! ? . , ; : " \' ~ `',
    '{abc} {space} {enter}',
  ],
}

const DISPLAY = {
  '{bksp}':    '⌫',
  '{enter}':   '↵ OK',
  '{space}':   'espace',
  '{shift}':   '⇧',
  '{numbers}': '!@#',
  '{abc}':     'ABC',
}

export default function VirtualKeyboard(): JSX.Element | null {
  const { isOpen, kbValue, kbType, close, handleChange } = useKeyboard()
  const [layout, setLayout] = useState<LayoutName>('default')
  const kbRef = useRef<{ setInput: (v: string) => void } | null>(null)

  if (!isOpen) return null

  const onKeyPress = (key: string): void => {
    switch (key) {
      case '{enter}':
        close()
        setLayout('default')
        break
      case '{shift}':
        setLayout((l) => (l === 'shift' ? 'default' : 'shift'))
        break
      case '{numbers}':
        setLayout('numbers')
        break
      case '{abc}':
        setLayout('default')
        break
      default:
        if (layout === 'shift') setLayout('default')
    }
  }

  const clearAll = (): void => {
    handleChange('')
    kbRef.current?.setInput('')
  }

  const confirm = (): void => {
    close()
    setLayout('default')
  }

  return (
    <div
      className="fixed inset-0 z-[60]"
      onPointerDown={(e): void => {
        if (e.target === e.currentTarget) confirm()
      }}
    >
      {/* Barre de prévisualisation */}
      <div
        className="absolute bottom-[258px] left-0 right-0 flex items-center gap-2 px-3 py-2 bg-slate-950 border-t border-slate-700"
        onPointerDown={(e): void => e.stopPropagation()}
      >
        <div className="flex-1 font-mono text-sm text-white bg-slate-800 rounded px-3 py-1.5 min-h-[32px] overflow-hidden text-ellipsis whitespace-nowrap">
          {kbType === 'password' ? (
            '•'.repeat(kbValue.length) || <span className="text-slate-600">...</span>
          ) : (
            kbValue || <span className="text-slate-600">...</span>
          )}
        </div>
        <button
          onPointerDown={clearAll}
          className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white text-xs transition-colors"
        >
          Effacer
        </button>
        <button
          onPointerDown={confirm}
          className="px-3 py-1 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-colors"
        >
          OK
        </button>
      </div>

      {/* react-simple-keyboard */}
      <div
        className="absolute bottom-0 left-0 right-0"
        onPointerDown={(e): void => e.stopPropagation()}
      >
        <Keyboard
          keyboardRef={(r): void => { kbRef.current = r }}
          layoutName={layout}
          layout={LAYOUT}
          display={DISPLAY}
          onChange={handleChange}
          onKeyPress={onKeyPress}
          input={kbValue}
          theme="hg-theme-default hg-layout-default vio-keyboard"
          preventMouseDownDefault
        />
      </div>
    </div>
  )
}
