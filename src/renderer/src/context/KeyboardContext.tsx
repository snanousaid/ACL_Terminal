import { createContext, useContext, useRef, useState } from 'react'

interface KbCtx {
  isOpen: boolean
  kbValue: string
  kbType: 'text' | 'password'
  open: (value: string, onChange: (v: string) => void, type?: 'text' | 'password') => void
  close: () => void
  handleChange: (v: string) => void
}

const KeyboardContext = createContext<KbCtx>({
  isOpen: false,
  kbValue: '',
  kbType: 'text',
  open: () => undefined,
  close: () => undefined,
  handleChange: () => undefined,
})

export function KeyboardProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [kbValue, setKbValue] = useState('')
  const [kbType, setKbType] = useState<'text' | 'password'>('text')
  // Toujours la dernière fonction onChange de l'input actif
  const onChangeFn = useRef<(v: string) => void>(() => undefined)

  const open = (value: string, onChange: (v: string) => void, type: 'text' | 'password' = 'text'): void => {
    onChangeFn.current = onChange
    setKbValue(value)
    setKbType(type)
    setIsOpen(true)
  }

  const close = (): void => setIsOpen(false)

  const handleChange = (v: string): void => {
    setKbValue(v)
    onChangeFn.current(v)
  }

  return (
    <KeyboardContext.Provider value={{ isOpen, kbValue, kbType, open, close, handleChange }}>
      {children}
    </KeyboardContext.Provider>
  )
}

export const useKeyboard = (): KbCtx => useContext(KeyboardContext)
