import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import en from './locales/en'
import zhCN from './locales/zh-CN'

export type Locale = 'en' | 'zh-CN'
type Values = Record<string, string | number>
type Translate = (key: string, values?: Values) => string

function interpolate(value: string, values?: Values) {
  return value.replace(/{{(\w+)}}/g, (_, key: string) => String(values?.[key] ?? `{{${key}}}`))
}
function browserLocale(): Locale {
  return typeof navigator !== 'undefined' && navigator.languages.some((value) => value.toLowerCase().startsWith('zh')) ? 'zh-CN' : 'en'
}
function initialLocale(): Locale {
  const saved = localStorage.getItem('cyber-kitchen-locale')
  return saved === 'en' || saved === 'zh-CN' ? saved : browserLocale()
}

const I18nContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: Translate } | undefined>(undefined)
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  useEffect(() => { localStorage.setItem('cyber-kitchen-locale', locale); document.documentElement.lang = locale }, [locale])
  const t: Translate = (key, values) => {
    const english = (en as Record<string, string>)[key] ?? key
    const translated = locale === 'zh-CN' ? (zhCN as Partial<Record<string, string>>)[key] : undefined
    return interpolate(translated ?? english, values)
  }
  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
}
// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used within I18nProvider')
  return value
}
