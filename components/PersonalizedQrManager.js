"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import QRCode from "qrcode"
import supabase from "../lib/supabase"
import { getDianaStationeryData } from "../lib/dianaStationeryData"
import { downloadStationeryPdf, downloadStationeryPdfBundle } from "../lib/dianaStationeryPdf"
import { DianaQrCardPrintTemplate } from "./DianaStationeryPrintTemplates"
import { AlternativeQrCardPrintTemplate, getAlternativeStationeryConfig } from "./AlternativeStationerySet"

const EMPTY_FORM = { recipient_type: "individual", recipient_label: "", salutation: "" }

export default function PersonalizedQrManager({ project, weddingWebsiteUrl }) {
  const [recipients, setRecipients] = useState([])
  const [respondedIds, setRespondedIds] = useState(new Set())
  const [qrCodes, setQrCodes] = useState({})
  const [selectedId, setSelectedId] = useState("")
  const [editingId, setEditingId] = useState("")
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState("")
  const [message, setMessage] = useState("")
  const cardRefs = useRef(new Map())

  const stationeryData = useMemo(() => ({
    ...getDianaStationeryData(project, weddingWebsiteUrl),
    websiteDisplayUrl: weddingWebsiteUrl,
  }), [project, weddingWebsiteUrl])
  const variant = String(project?.design_family || "diana").toLowerCase()
  const alternativeConfig = variant === "botanique" || variant === "penelope"
    ? getAlternativeStationeryConfig(variant, project)
    : null
  const selectedRecipient = recipients.find((recipient) => recipient.id === selectedId) || recipients[0] || null

  useEffect(() => {
    if (!project?.id) return
    loadRecipients(project.id)
  }, [project?.id])

  useEffect(() => {
    let active = true
    async function generateCodes() {
      const entries = await Promise.all(recipients.map(async (recipient) => {
        const url = `${weddingWebsiteUrl}?invite=${recipient.token}`
        const dataUrl = await QRCode.toDataURL(url, { width: 360, margin: 2 })
        return [recipient.id, dataUrl]
      }))
      if (active) setQrCodes(Object.fromEntries(entries))
    }
    if (weddingWebsiteUrl && recipients.length) generateCodes().catch(() => setMessage("QR kódy sa nepodarilo pripraviť."))
    return () => { active = false }
  }, [recipients, weddingWebsiteUrl])

  async function loadRecipients(projectId) {
    setLoading(true)
    setMessage("")
    const [recipientResult, responseResult] = await Promise.all([
      supabase.from("invitation_recipients").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
      supabase.from("rsvp_responses").select("invitation_recipient_id").eq("project_id", projectId).not("invitation_recipient_id", "is", null),
    ])
    if (recipientResult.error) {
      setMessage("Zoznam personalizovaných kartičiek sa nepodarilo načítať.")
    } else {
      const rows = recipientResult.data || []
      setRecipients(rows)
      setSelectedId((current) => current && rows.some((row) => row.id === current) ? current : rows[0]?.id || "")
    }
    setRespondedIds(new Set((responseResult.data || []).map((row) => row.invitation_recipient_id)))
    setLoading(false)
  }

  async function saveRecipient(event) {
    event.preventDefault()
    const recipientLabel = form.recipient_label.trim()
    const salutation = form.salutation.trim()
    if (!recipientLabel) {
      setMessage("Doplňte, pre koho je kartička určená.")
      return
    }

    setSaving(true)
    setMessage("")
    const payload = {
      recipient_type: form.recipient_type,
      recipient_label: recipientLabel,
      salutation: salutation || recipientLabel,
      updated_at: new Date().toISOString(),
    }
    const result = editingId
      ? await supabase.from("invitation_recipients").update(payload).eq("id", editingId).eq("project_id", project.id).select().single()
      : await supabase.from("invitation_recipients").insert({ ...payload, project_id: project.id }).select().single()

    if (result.error) {
      setMessage("Kartičku sa nepodarilo uložiť.")
    } else {
      await loadRecipients(project.id)
      setSelectedId(result.data.id)
      setEditingId("")
      setForm(EMPTY_FORM)
      setMessage(editingId ? "Kartička bola upravená." : "Personalizovaná kartička je pripravená.")
    }
    setSaving(false)
  }

  function startEditing(recipient) {
    setEditingId(recipient.id)
    setForm({
      recipient_type: recipient.recipient_type,
      recipient_label: recipient.recipient_label,
      salutation: recipient.salutation || "",
    })
    setMessage("")
  }

  async function deleteRecipient(recipient) {
    if (!window.confirm(`Odstrániť kartičku pre „${recipient.recipient_label}“?`)) return
    const { error } = await supabase.from("invitation_recipients").delete().eq("id", recipient.id).eq("project_id", project.id)
    if (error) setMessage("Kartičku sa nepodarilo odstrániť.")
    else await loadRecipients(project.id)
  }

  async function downloadOne(recipient) {
    const node = cardRefs.current.get(recipient.id)
    if (!node || !qrCodes[recipient.id]) return
    setExporting(recipient.id)
    setMessage("")
    try {
      await downloadStationeryPdf(node, {
        filename: `${variant}-qr-${slugify(recipient.recipient_label)}.pdf`,
        title: `QR kartička pre ${recipient.recipient_label}`,
        requireImage: true,
      })
    } catch {
      setMessage("PDF sa nepodarilo pripraviť. Skúste to znova.")
    } finally {
      setExporting("")
    }
  }

  async function downloadAll() {
    const readyRecipients = recipients.filter((recipient) => cardRefs.current.get(recipient.id) && qrCodes[recipient.id])
    if (!readyRecipients.length) return
    setExporting("all")
    setMessage("")
    try {
      await downloadStationeryPdfBundle(
        readyRecipients.map((recipient) => cardRefs.current.get(recipient.id)),
        {
          filename: `${variant}-personalizovane-qr-${project.slug}.pdf`,
          title: "Personalizované QR kartičky",
          requireImage: true,
        }
      )
    } catch {
      setMessage("Spoločné PDF sa nepodarilo pripraviť. Skúste to znova.")
    } finally {
      setExporting("")
    }
  }

  if (loading) return <section style={sectionStyle}><p style={mutedStyle}>Načítavam personalizované QR kartičky…</p></section>

  return (
    <section style={sectionStyle}>
      <div>
        <p style={eyebrowStyle}>Signature a Atelier</p>
        <h2 style={titleStyle}>Personalizované QR kartičky</h2>
        <p style={introStyle}>Vytvorte osobný QR kód pre jednotlivca, pár alebo rodinu. Meno zostane priamo pod QR kódom, takže po vytlačení vždy viete, komu kartička patrí. Odpoveď sa automaticky spojí s adresátom.</p>
      </div>

      <div style={workspaceStyle}>
        <form onSubmit={saveRecipient} style={formStyle}>
          <label style={labelStyle}>Typ adresáta
            <select value={form.recipient_type} onChange={(event) => setForm({ ...form, recipient_type: event.target.value })} style={fieldStyle}>
              <option value="individual">Jednotlivec</option>
              <option value="couple">Pár</option>
              <option value="family">Rodina</option>
            </select>
          </label>
          <label style={labelStyle}>Pre koho je kartička
            <input value={form.recipient_label} onChange={(event) => setForm({ ...form, recipient_label: event.target.value })} placeholder="Janka a Jožko alebo Novákovci" maxLength={120} style={fieldStyle} />
          </label>
          <label style={labelStyle}>Oslovenie na kartičke
            <input value={form.salutation} onChange={(event) => setForm({ ...form, salutation: event.target.value })} placeholder="Milí Janka a Jožko" maxLength={160} style={fieldStyle} />
          </label>
          <div style={formActionsStyle}>
            <button type="submit" disabled={saving} style={primaryButtonStyle}>{saving ? "Ukladám…" : editingId ? "Uložiť zmenu" : "Pridať kartičku"}</button>
            {editingId ? <button type="button" onClick={() => { setEditingId(""); setForm(EMPTY_FORM) }} style={secondaryButtonStyle}>Zrušiť úpravu</button> : null}
          </div>
        </form>

        {selectedRecipient ? (
          <div style={previewStyle}>
            <PersonalizedCard
              project={project}
              variant={variant}
              data={stationeryData}
              config={alternativeConfig}
              recipient={selectedRecipient}
              qrDataUrl={qrCodes[selectedRecipient.id]}
            />
          </div>
        ) : <div style={emptyStyle}>Pridajte prvého adresáta a tu sa zobrazí jeho kartička.</div>}
      </div>

      {message ? <p role="status" style={messageStyle}>{message}</p> : null}

      {recipients.length ? (
        <div style={listWrapStyle}>
          <div style={listHeaderStyle}>
            <div><strong>{recipients.length} {recipients.length === 1 ? "kartička" : recipients.length < 5 ? "kartičky" : "kartičiek"}</strong><span style={mutedStyle}> · každá s vlastným QR odkazom</span></div>
            <button type="button" onClick={downloadAll} disabled={Boolean(exporting) || !recipients.every((recipient) => qrCodes[recipient.id])} style={primaryButtonStyle}>{exporting === "all" ? "Pripravujem PDF…" : "Stiahnuť všetky v jednom PDF"}</button>
          </div>
          <div style={listStyle}>
            {recipients.map((recipient) => (
              <article key={recipient.id} style={{ ...rowStyle, ...(selectedRecipient?.id === recipient.id ? selectedRowStyle : {}) }}>
                <button type="button" onClick={() => setSelectedId(recipient.id)} style={selectButtonStyle}>
                  <span style={recipientNameStyle}>{recipient.recipient_label}</span>
                  <span style={statusStyle}>{respondedIds.has(recipient.id) ? "RSVP prijaté" : "Čaká na odpoveď"}</span>
                </button>
                <div style={rowActionsStyle}>
                  <button type="button" onClick={() => downloadOne(recipient)} disabled={Boolean(exporting) || !qrCodes[recipient.id]} style={textButtonStyle}>{exporting === recipient.id ? "Pripravujem…" : "Stiahnuť"}</button>
                  <button type="button" onClick={() => startEditing(recipient)} style={textButtonStyle}>Upraviť</button>
                  <button type="button" onClick={() => deleteRecipient(recipient)} style={deleteButtonStyle}>Odstrániť</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div aria-hidden="true" style={offscreenStyle}>
        {recipients.map((recipient) => (
          <div key={recipient.id} style={offscreenCardStyle}>
            <PersonalizedCard
              ref={(node) => node ? cardRefs.current.set(recipient.id, node) : cardRefs.current.delete(recipient.id)}
              project={project}
              variant={variant}
              data={stationeryData}
              config={alternativeConfig}
              recipient={recipient}
              qrDataUrl={qrCodes[recipient.id]}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function PersonalizedCard({ variant, data, config, recipient, qrDataUrl, ref }) {
  if (variant === "botanique" || variant === "penelope") {
    return <AlternativeQrCardPrintTemplate ref={ref} data={data} config={config} variant={variant} recipient={recipient} qrDataUrl={qrDataUrl} />
  }
  return <DianaQrCardPrintTemplate ref={ref} data={data} recipient={recipient} qrDataUrl={qrDataUrl} />
}

function slugify(value) {
  return String(value || "host")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "host"
}

const sectionStyle = { display: "grid", gap: "22px", marginTop: "34px", paddingTop: "34px", borderTop: "1px solid rgba(95,72,56,.17)" }
const eyebrowStyle = { margin: 0, fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase", color: "#9b7c62" }
const titleStyle = { margin: "8px 0 10px", fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(28px,4vw,40px)", fontWeight: 400, color: "#3f3128" }
const introStyle = { maxWidth: "760px", margin: 0, color: "#6f5b4b", fontSize: "15px", lineHeight: 1.65 }
const workspaceStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", alignItems: "start" }
const formStyle = { display: "grid", gap: "15px", padding: "22px", border: "1px solid #ded3c6", background: "#fffdf9" }
const labelStyle = { display: "grid", gap: "7px", color: "#59483c", fontSize: "13px" }
const fieldStyle = { width: "100%", boxSizing: "border-box", border: "1px solid #d6c7b8", borderRadius: 0, background: "white", padding: "11px 12px", color: "#44362d", font: "inherit" }
const formActionsStyle = { display: "flex", flexWrap: "wrap", gap: "9px", marginTop: "3px" }
const primaryButtonStyle = { border: "1px solid #5f4838", borderRadius: 0, background: "#5f4838", color: "#fffaf5", padding: "10px 14px", font: "inherit", fontSize: "13px", cursor: "pointer" }
const secondaryButtonStyle = { ...primaryButtonStyle, background: "transparent", color: "#5f4838" }
const previewStyle = { display: "grid", minHeight: "340px", placeItems: "center", padding: "22px", overflow: "hidden", background: "#f4ede5" }
const emptyStyle = { ...previewStyle, color: "#8a7767", textAlign: "center", lineHeight: 1.6 }
const messageStyle = { margin: 0, color: "#765443", fontSize: "13px" }
const listWrapStyle = { display: "grid", gap: "12px" }
const listHeaderStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }
const mutedStyle = { color: "#8a7767", fontSize: "13px" }
const listStyle = { display: "grid", borderTop: "1px solid #e2d8cd" }
const rowStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", padding: "13px 10px", borderBottom: "1px solid #e2d8cd" }
const selectedRowStyle = { background: "#f8f2eb" }
const selectButtonStyle = { display: "grid", flex: 1, gap: "4px", border: 0, background: "transparent", padding: 0, textAlign: "left", color: "inherit", cursor: "pointer" }
const recipientNameStyle = { fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "20px" }
const statusStyle = { color: "#8a7767", fontSize: "11px", letterSpacing: ".08em", textTransform: "uppercase" }
const rowActionsStyle = { display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "10px" }
const textButtonStyle = { border: 0, borderBottom: "1px solid currentColor", background: "transparent", padding: "2px 0", color: "#5f4838", font: "inherit", fontSize: "12px", cursor: "pointer" }
const deleteButtonStyle = { ...textButtonStyle, color: "#9a4d3e" }
const offscreenStyle = { position: "fixed", left: "-12000px", top: 0, width: "420px", pointerEvents: "none" }
const offscreenCardStyle = { display: "grid", width: "320px", minHeight: "440px", placeItems: "center", padding: "20px" }
