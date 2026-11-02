"use client"

import Image from "next/image"
import { forwardRef, useMemo, useRef, useState } from "react"
import { getDianaStationeryData } from "../lib/dianaStationeryData"
import { downloadStationeryPdf } from "../lib/dianaStationeryPdf"
import { getDesignCustomization } from "../lib/designCustomization"

const FLOWER_LEFT = "/templates/chloe/gypsophila.png"

export default function ChloeStationerySet({ project, weddingWebsiteUrl, qrDataUrl, qrError, websiteDisplayUrl }) {
  const invitationRef = useRef(null)
  const qrRef = useRef(null)
  const [exporting, setExporting] = useState("")
  const [exportError, setExportError] = useState("")
  const data = useMemo(
    () => ({ ...getDianaStationeryData(project, weddingWebsiteUrl), websiteDisplayUrl }),
    [project, weddingWebsiteUrl, websiteDisplayUrl],
  )
  const config = getChloeStationeryConfig(project)

  async function download(kind) {
    setExportError("")
    if (kind === "qr" && !qrDataUrl) {
      setExportError("QR kód sa ešte pripravuje. Skúste to o chvíľu znova.")
      return
    }
    setExporting(kind)
    try {
      await downloadStationeryPdf(kind === "invitation" ? invitationRef.current : qrRef.current, {
        filename: `chloe-${kind === "invitation" ? "pozvanka" : "qr-karticka"}-${project?.slug || "svadba"}.pdf`,
        title: `${kind === "invitation" ? "Svadobná pozvánka" : "QR kartička"} Chloe`,
        requireImage: kind === "qr",
        fontEmbedCSS: await getChloePrintFontCSS(),
      })
    } catch {
      setExportError("PDF sa nepodarilo pripraviť. Skúste export zopakovať.")
    } finally {
      setExporting("")
    }
  }

  return (
    <section style={sectionStyle}>
      <div style={introStyle}>
        <p style={{ ...eyebrowStyle, color: config.accent }}>Chloe stationery set</p>
        <h2 style={{ ...titleStyle, color: config.ink, fontFamily: config.fontFamily }}>Pozvánka a QR kartička</h2>
        <p style={{ ...copyStyle, color: config.ink }}>Vzdušná papierová kompozícia s jemnou gypsomilkou, navrhnutá priamo k svadobnému webu Chloe.</p>
      </div>
      <div style={stageStyle}>
        <ChloeInvitationPrintTemplate ref={invitationRef} data={data} config={config} />
        <ChloeQrCardPrintTemplate ref={qrRef} data={data} config={config} qrDataUrl={qrDataUrl} />
      </div>
      {qrError || exportError ? <p role="alert" style={errorStyle}>{qrError || exportError}</p> : null}
      <div style={actionsStyle}>
        <button type="button" disabled={Boolean(exporting)} onClick={() => download("invitation")}>
          {exporting === "invitation" ? "Pripravujem PDF..." : "Stiahnuť pozvánku"}
        </button>
        <button type="button" disabled={Boolean(exporting) || !weddingWebsiteUrl || !qrDataUrl} onClick={() => download("qr")}>
          {exporting === "qr" ? "Pripravujem PDF..." : !qrDataUrl && weddingWebsiteUrl ? "Pripravujem QR kód..." : "Stiahnuť QR kartičku"}
        </button>
      </div>
    </section>
  )
}

export const ChloeInvitationPrintTemplate = forwardRef(function ChloeInvitationPrintTemplate({ data, config }, ref) {
  return (
    <article ref={ref} style={{ ...invitationStyle, color: config.ink, fontFamily: config.fontFamily }} aria-label="Chloe pozvánka">
      <div style={paperWashStyle} />
      <div style={invitationRuleStyle} />
      <Image src={FLOWER_LEFT} alt="" width={420} height={620} unoptimized data-pdf-overlay-image="true" style={invitationFlowerLeftStyle} />
      <div style={invitationContentStyle}>
        <p style={{ ...smallStyle, color: config.accent }}>S radosťou vás pozývame</p>
        <div style={namesWrapStyle}>
          <h3 style={{ ...nameStyle, fontFamily: config.nameFontFamily }}>{data.firstPartner}</h3>
          <i data-pdf-text-overlay="true" style={{ ...ampersandStyle, color: config.accent, fontFamily: config.nameFontFamily }}>&amp;</i>
          <h3 style={{ ...nameStyle, fontFamily: config.nameFontFamily }}>{data.secondPartner}</h3>
        </div>
        <div style={{ ...dividerStyle, background: config.accent }} />
        <p style={dateStyle}>{data.displayDate}</p>
        <p style={detailStyle}>{data.timeLine}<br />{data.ceremonyVenue}<br />{data.ceremonyCity}</p>
        <p style={{ ...closingStyle, color: config.accent }}>Tešíme sa na spoločný deň</p>
      </div>
    </article>
  )
})

export const ChloeQrCardPrintTemplate = forwardRef(function ChloeQrCardPrintTemplate({ data, config, qrDataUrl, recipient = null }, ref) {
  return (
    <article ref={ref} style={{ ...qrCardStyle, color: config.ink, fontFamily: config.fontFamily }} aria-label="Chloe QR kartička">
      <div style={qrWashStyle} />
      <div style={qrRuleStyle} />
      <p style={{ ...smallStyle, color: config.accent }}>Všetko o našej svadbe</p>
      <h3 style={{ ...qrNamesStyle, fontFamily: config.nameFontFamily }}>{data.firstPartner} <i data-pdf-text-overlay="true" style={{ ...qrAmpersandStyle, color: config.accent, fontFamily: config.nameFontFamily }}>&amp;</i> {data.secondPartner}</h3>
      <div style={{ ...qrDividerStyle, background: config.accent }} />
      {qrDataUrl ? (
        <div style={{ zIndex: 1, padding: "10px", background: "#fff" }}><Image src={qrDataUrl} alt="QR kód svadobného webu" width={176} height={176} unoptimized data-pdf-required-image="true" style={qrImageStyle} /></div>
      ) : <div style={qrPlaceholderStyle}>QR</div>}
      <p style={{ ...qrTextStyle, ...(recipient ? personalizedQrTextStyle : {}) }}>
        {recipient ? <>{recipient.salutation || recipient.recipient_label},<br />všetky informácie o svadbe nájdete po naskenovaní QR kódu.</> : <>Naskenujte QR kód<br />a potvrďte svoju účasť.</>}
      </p>
      <p style={{ ...recipientStyle, color: config.accent }}>{recipient?.recipient_label || ""}</p>
      <p style={urlStyle}>{data.websiteDisplayUrl}</p>
    </article>
  )
})

export function getChloeStationeryConfig(project = {}) {
  const customization = getDesignCustomization("chloe", project)
  return {
    ink: customization.color.hex,
    accent: "#526565",
    fontFamily: customization.font.value === "editorial" ? "'Chloe Print Editorial',Georgia,serif" : "'Chloe Print Serif',Georgia,serif",
    nameFontFamily: "'Chloe Print Script',cursive",
    fontVariant: customization.font.value,
  }
}

const sectionStyle = { display: "grid", gap: "22px" }
const introStyle = { display: "grid", gap: "8px" }
const eyebrowStyle = { margin: 0, fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase" }
const titleStyle = { margin: 0, fontSize: "clamp(30px,5vw,44px)", fontWeight: 400 }
const copyStyle = { maxWidth: "660px", margin: 0, fontSize: "16px", lineHeight: 1.7, opacity: .78 }
const stageStyle = { display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(22px,4vw,34px)", flexWrap: "wrap", padding: "clamp(20px,4vw,38px)", background: "#edf3f0" }
const paperBaseStyle = { position: "relative", overflow: "hidden", fontStyle: "normal", background: "#f7f8f4", boxShadow: "0 20px 50px rgba(49,73,72,.14)" }
const invitationStyle = { ...paperBaseStyle, width: "min(392px, 100%)", aspectRatio: "392 / 568" }
const paperWashStyle = { position: "absolute", inset: 0, background: "url('/templates/chloe/watercolor.png') center/cover no-repeat", opacity: .8 }
const invitationRuleStyle = { position: "absolute", inset: "20px", border: "1px solid #cbd8d1", borderRadius: "140px 140px 2px 2px" }
const qrRuleStyle = { position: "absolute", inset: "16px", border: "1px solid #cbd8d1" }
const invitationFlowerLeftStyle = { position: "absolute", left: "-108px", bottom: "-142px", width: "238px", height: "355px", objectFit: "contain", objectPosition: "bottom", opacity: .8, transform: "rotate(-10deg)" }
const invitationContentStyle = { position: "absolute", inset: "42px 38px", zIndex: 1, display: "grid", alignContent: "center", justifyItems: "center", textAlign: "center" }
const smallStyle = { margin: 0, fontFamily: "'Chloe Print Sans',Arial,sans-serif", fontSize: "8px", fontWeight: 500, letterSpacing: ".24em", textTransform: "uppercase" }
const namesWrapStyle = { display: "grid", justifyItems: "center", margin: "42px 0 29px" }
const nameStyle = { margin: 0, fontSize: "82px", fontWeight: 400, letterSpacing: "0", lineHeight: .67 }
const ampersandStyle = { margin: "12px 0 8px", fontSize: "32px", fontStyle: "normal", lineHeight: 1 }
const dividerStyle = { width: "26px", height: "1px", marginBottom: "24px", opacity: .7 }
const dateStyle = { margin: 0, fontSize: "20px", textTransform: "capitalize" }
const detailStyle = { margin: "17px 0 0", fontSize: "14px", lineHeight: 1.55 }
const closingStyle = { margin: "29px 0 0", fontFamily: "'Chloe Print Sans',Arial,sans-serif", fontSize: "8px", letterSpacing: ".18em", textTransform: "uppercase" }
const qrCardStyle = { ...paperBaseStyle, width: "min(300px,100%)", aspectRatio: "300 / 470", display: "grid", alignContent: "center", justifyItems: "center", padding: "32px 30px", textAlign: "center" }
const qrWashStyle = { position: "absolute", inset: 0, background: "url('/templates/chloe/watercolor.png') center/cover no-repeat", opacity: .45 }
const qrNamesStyle = { zIndex: 1, display: "flex", justifyContent: "center", alignItems: "baseline", gap: "6px", whiteSpace: "nowrap", margin: "17px 0 10px", fontSize: "39px", fontWeight: 400, lineHeight: 1 }
const qrAmpersandStyle = { fontSize: ".82em", fontStyle: "normal", fontWeight: 400 }
const qrDividerStyle = { zIndex: 1, width: "22px", height: "1px", marginBottom: "18px", opacity: .65 }
const qrImageStyle = { zIndex: 1, width: "176px", height: "176px", display: "block", background: "#fff" }
const qrPlaceholderStyle = { zIndex: 1, display: "grid", width: "176px", height: "176px", placeItems: "center", background: "#fff" }
const qrTextStyle = { zIndex: 1, margin: "17px 0 5px", fontSize: "14px", lineHeight: 1.38 }
const personalizedQrTextStyle = { maxWidth: "224px", fontSize: "12px" }
const recipientStyle = { zIndex: 1, minHeight: "15px", margin: "2px 0 5px", fontSize: "13px", fontStyle: "normal" }
const urlStyle = { zIndex: 1, maxWidth: "228px", margin: 0, overflow: "hidden", fontFamily: "'Chloe Print Sans',Arial,sans-serif", fontSize: "7px", opacity: .55, textOverflow: "ellipsis", whiteSpace: "nowrap" }
const actionsStyle = { display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }
const errorStyle = { margin: 0, color: "#9a4d3e", fontSize: "12px", textAlign: "center" }

// Explicit faces avoid nondeterministic font discovery in repeated SVG captures.
export async function getChloePrintFontCSS() {
  const faces = [["Chloe Print Serif", "cormorant-regular.woff2"], ["Chloe Print Sans", "inter-regular.woff2"], ["Chloe Print Editorial", "playfair-regular.woff2"], ["Chloe Print Script", "ms-madi-regular.woff2"]]
  return (await Promise.all(faces.map(async ([family, file]) => {
    const response = await fetch(`/templates/chloe/${file}`)
    if (!response.ok) throw new Error("Tlačové písmo sa nepodarilo načítať.")
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      response.blob().then(blob => reader.readAsDataURL(blob), reject)
    })
    return `@font-face { font-family: '${family}'; font-style: normal; font-weight: 400; src: url("${data}") format('woff2'); }`
  }))).join("\n")
}
