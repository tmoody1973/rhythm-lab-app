'use client'

import { ThemeProvider } from '@thesysai/genui-sdk'
import { ReactNode } from 'react'

interface C1ThemeProviderProps {
  children: ReactNode
}

export function C1ThemeProvider({ children }: C1ThemeProviderProps) {
  return <ThemeProvider>{children}</ThemeProvider>
}
