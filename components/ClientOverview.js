"use client"

import { useEffect, useState } from "react"
import { getVisibleMenuSections } from "../lib/menuSections.mjs"
import styles from "./ClientOverview.module.css"

export default function ClientOverview({
  slug,
  project,
  content,
  schedule,
  weddingWebsiteUrl,
  qrReady,
  onOpenEditor,
  onOpenStationery,
}) {
  const [activity, setActivity] = useState({})
  const [copyMessage, setCopyMessage] = useState("")
  const storageKey = `yesday:onboarding:${slug}`

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setActivity(JSON.parse(window.localStorage.getItem(storageKey) || "{}"))
      } catch {
        setActivity({})
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [storageKey])

  function remember(key) {
    setActivity((current) => {
      const next = { ...current, [key]: true }
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  function openRsvp() {
    remember("rsvp")
    window.open(`/${slug}/rsvp`, "_blank", "noopener,noreferrer")
  }

  function openStationery() {
    remember("stationery")
    onOpenStationery()
  }

  function openGuestWebsite() {
    remember("guest")
    window.open(weddingWebsiteUrl, "_blank", "noopener,noreferrer")
  }

  async function copyWebsiteLink() {
    try {
      await navigator.clipboard.writeText(weddingWebsiteUrl)
      remember("shared")
      setCopyMessage("Odkaz na svadobný web je skopírovaný.")
    } catch {
      setCopyMessage("Odkaz sa nepodarilo skopírovať. Otvorte web pre hostí a skopírujte adresu z prehliadača.")
    }
  }

  const basicReady = Boolean(project?.couple_display_name && project?.wedding_date)
  const placesReady = Boolean(
    project?.ceremony_time &&
    project?.reception_time &&
    project?.venue_name &&
    project?.venue_address &&
    project?.reception_venue_name &&
    project?.reception_venue_address
  )
  const contentReady = Boolean(
    content?.welcome_text &&
    content?.story_text &&
    getVisibleMenuSections(content).length > 0 &&
    Array.isArray(schedule) &&
    schedule.length >= 2 &&
    schedule.every((item) => item.item_time && item.item_title)
  )

  const steps = [
    { key: "basic", title: "Základné údaje", detail: "Mená a dátum svadby", complete: basicReady, action: onOpenEditor, actionLabel: "Doplniť" },
    { key: "places", title: "Miesta a časy", detail: "Obrad, oslava a adresy", complete: placesReady, action: onOpenEditor, actionLabel: "Doplniť" },
    { key: "content", title: "Texty a program", detail: "Príbeh, menu a harmonogram", complete: contentReady, action: onOpenEditor, actionLabel: "Doplniť" },
    { key: "rsvp", title: "Skontrolovať RSVP", detail: "Pozrite si formulár očami hosťa", complete: activity.rsvp === true, action: openRsvp, actionLabel: "Otvoriť" },
    { key: "stationery", title: "Pozvánka a QR", detail: qrReady ? "Tlačové výstupy sú pripravené" : "QR kód sa pripravuje", complete: activity.stationery === true, action: openStationery, actionLabel: "Skontrolovať" },
    { key: "guest", title: "Web pre hostí", detail: "Skontrolujte celý web mimo editora", complete: activity.guest === true, action: openGuestWebsite, actionLabel: "Zobraziť" },
    { key: "shared", title: "Pripravené na zdieľanie", detail: "Skopírujte odkaz pre hostí", complete: activity.shared === true, action: copyWebsiteLink, actionLabel: "Kopírovať odkaz" },
  ]

  const completedCount = steps.filter((step) => step.complete).length
  const nextStep = steps.find((step) => !step.complete)
  const progress = Math.round((completedCount / steps.length) * 100)

  return (
    <section className={styles.overview} aria-labelledby="client-overview-title">
      <div className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>Váš svadobný priestor</p>
          <h2 id="client-overview-title">{project?.couple_display_name || "Vaša svadba"}</h2>
          <p>Postupujte krok za krokom. YesDay vám ukáže, čo je hotové a čo odporúčame doplniť ďalej.</p>
        </div>
        <div className={styles.progressSummary} aria-label={`${completedCount} zo 7 krokov dokončených`}>
          <strong>{completedCount} zo 7</strong>
          <span>krokov dokončených</span>
        </div>
      </div>

      <div className={styles.progressTrack} aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      {nextStep ? (
        <div className={styles.nextStep}>
          <div>
            <span>Odporúčaný ďalší krok</span>
            <strong>{nextStep.title}</strong>
          </div>
          <button type="button" onClick={nextStep.action}>{nextStep.actionLabel}</button>
        </div>
      ) : (
        <div className={styles.nextStep}>
          <div>
            <span>Všetko pripravené</span>
            <strong>Váš svadobný priestor môžete poslať hosťom</strong>
          </div>
        </div>
      )}

      <div className={styles.steps}>
        {steps.map((step) => (
          <article key={step.key} className={step.complete ? styles.stepComplete : styles.step}>
            <span className={styles.status} aria-hidden="true">{step.complete ? "✓" : ""}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </div>
            <button type="button" onClick={step.action}>{step.complete ? "Pozrieť" : step.actionLabel}</button>
          </article>
        ))}
      </div>

      {copyMessage ? <p className={styles.copyMessage} role="status">{copyMessage}</p> : null}
    </section>
  )
}
