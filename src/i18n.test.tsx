import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it } from 'vitest'
import { I18nProvider, useI18n } from './i18n'

function Probe() {
  const { locale, setLocale, t } = useI18n()
  return <><span>{locale}</span><span>{t('nav.today')}</span><span>{t('language.en')}</span><button onClick={() => setLocale('zh-CN')}>switch</button></>
}

afterEach(() => localStorage.clear())

it('uses the browser language before an explicit locale is saved', () => {
  const languages = Object.getOwnPropertyDescriptor(navigator, 'languages')
  Object.defineProperty(navigator, 'languages', { configurable: true, value: ['zh-CN', 'en'] })
  render(<I18nProvider><Probe /></I18nProvider>)
  expect(screen.getByText('zh-CN')).toBeInTheDocument()
  expect(screen.getByText('今日')).toBeInTheDocument()
  if (languages) Object.defineProperty(navigator, 'languages', languages)
})

it('persists an explicit locale and falls back to English for missing Chinese keys', async () => {
  localStorage.setItem('cyber-kitchen-locale', 'en')
  const user = userEvent.setup()
  render(<I18nProvider><Probe /></I18nProvider>)
  expect(screen.getByText('Today')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'switch' }))
  expect(screen.getByText('今日')).toBeInTheDocument()
  expect(screen.getByText('English')).toBeInTheDocument()
  expect(localStorage.getItem('cyber-kitchen-locale')).toBe('zh-CN')
  expect(document.documentElement.lang).toBe('zh-CN')
})
