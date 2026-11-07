'use client'

import Link from 'next/link'
import { ArrowDown, ArrowRight, Dices } from 'lucide-react'
import { useLang } from '@/lib/i18n'
import { LANG_COOKIE, LANG_CHANGE_EVENT } from '@/lib/i18n/types'
import { landingCopy } from './copy'
import { TableDemo } from './table-demo'
import styles from './landing.module.css'

export function PublicLanding() {
  const lang = useLang()
  const text = landingCopy[lang]

  function changeLanguage() {
    const next = lang === 'ru' ? 'en' : 'ru'
    // The public demo only saves a language preference, without a server action.
    document.cookie = `${LANG_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`
    document.documentElement.lang = next
    window.dispatchEvent(new Event(LANG_CHANGE_EVENT))
  }

  return (
    <div className={styles.landing}>
      <a className={styles.skip} href="#main">
        {text.skip}
      </a>
      <header className={styles.header}>
        <a href="#main" className={styles.brand} aria-label="DM Workspace">
          <Dices size={28} aria-hidden="true" />
          <span>
            DM <strong>Workspace</strong>
          </span>
        </a>
        <nav aria-label={lang === 'ru' ? 'Главная навигация' : 'Main navigation'}>
          <button type="button" onClick={changeLanguage} lang={lang === 'ru' ? 'en' : 'ru'}>
            {lang === 'ru' ? 'English' : 'Русский'}
          </button>
          <Link href="/login" prefetch={false}>
            {text.login}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </nav>
      </header>
      <main id="main" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="landing-title">
          <div>
            <p className={styles.eyebrow}>
              <span aria-hidden="true">✦</span> {text.eyebrow}
            </p>
            <h1 id="landing-title">
              {text.title}
              <br />
              <span>{text.titleAccent}</span>
            </h1>
          </div>
          <div className={styles.heroAside}>
            <p>{text.intro}</p>
            <a href="#demo" className={styles.primary}>
              {text.try}
              <ArrowDown size={18} aria-hidden="true" />
            </a>
            <small>{text.noAccount}</small>
          </div>
        </section>
        <TableDemo text={text} />
        <section className={styles.features} aria-labelledby="features-title">
          <p className={styles.eyebrow}>{text.chapter}</p>
          <h2 id="features-title">{text.nextTitle}</h2>
          <div className={styles.steps}>
            {text.steps.map(([number, title, body]) => (
              <article key={number}>
                <p className={styles.stepNumber}>{number}</p>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
        <section className={styles.cta}>
          <div>
            <h2>{text.ctaTitle}</h2>
            <p>{text.ctaBody}</p>
          </div>
          <Link href="/signup" prefetch={false} className={styles.primary}>
            {text.signup}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      </main>
      <footer className={styles.footer}>
        <span>
          DM Workspace <span aria-hidden="true"> / </span> {text.footer}
        </span>
        <Link href="/srd-license" prefetch={false}>
          {text.license}
        </Link>
      </footer>
    </div>
  )
}
