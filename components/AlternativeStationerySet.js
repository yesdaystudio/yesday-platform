"use client"

import { forwardRef, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { getDianaStationeryData } from "../lib/dianaStationeryData"
import { downloadStationeryPdf } from "../lib/dianaStationeryPdf"
import { getDesignCustomization } from "../lib/designCustomization"

const CONFIG = {
  botanique: { name: "Botanique", ink: "#26362b", accent: "#75836b", paper: "#f2efe5", ornament: "/templates/botanique/olive-sprig.png" },
  penelope: { name: "Penelope", ink: "#5a3f45", accent: "#b7868f", paper: "#fbf3f1", ornament: "/templates/penelope/sweet-pea.png" },
}

export default function AlternativeStationerySet({ variant, project, weddingWebsiteUrl, qrDataUrl, qrError, websiteDisplayUrl }) {
  const customization = getDesignCustomization(variant, project)
  const config = { ...(CONFIG[variant] || CONFIG.botanique), ink: customization.color.hex, fontFamily: customization.font.family, fontVariant: customization.font.value }
  const invitationRef = useRef(null)
  const qrRef = useRef(null)
  const [exporting, setExporting] = useState("")
  const [exportError, setExportError] = useState("")
  const data = useMemo(() => ({ ...getDianaStationeryData(project, weddingWebsiteUrl), websiteDisplayUrl }), [project, weddingWebsiteUrl, websiteDisplayUrl])

  async function download(kind) {
    setExportError("")
    if (kind === "qr" && !qrDataUrl) {
      setExportError("QR kód sa ešte pripravuje. Skúste to o chvíľu znova.")
      return
    }
    setExporting(kind)
    try {
      await downloadStationeryPdf(kind === "invitation" ? invitationRef.current : qrRef.current, {
        filename: `${variant}-${kind === "invitation" ? "pozvanka" : "qr-karticka"}-${project?.slug || "svadba"}.pdf`,
        title: `${kind === "invitation" ? "Svadobná pozvánka" : "QR kartička"} ${config.name}`,
        requireImage: kind === "qr",
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
        <p style={{ ...eyebrowStyle, color: config.accent }}>{config.name} stationery set</p>
        <h2 style={{ ...titleStyle, color: config.ink, fontFamily: config.fontFamily }}>Pozvánka a QR kartička</h2>
        <p style={{ ...copyStyle, color: config.ink }}>Pozvánka, kartička aj web používajú rovnaké písmo, farby a vizuálny motív.</p>
      </div>
      <div style={{ ...stageStyle, background: config.paper }}>
        <Invitation ref={invitationRef} data={data} config={config} variant={variant} />
        <QrCard ref={qrRef} data={data} config={config} variant={variant} qrDataUrl={qrDataUrl} />
      </div>
      {qrError || exportError ? <p role="alert" style={errorStyle}>{qrError || exportError}</p> : null}
      <div style={actionsStyle}>
        <button type="button" disabled={Boolean(exporting)} onClick={() => download("invitation")}>{exporting === "invitation" ? "Pripravujem PDF..." : "Stiahnuť pozvánku"}</button>
        <button type="button" disabled={Boolean(exporting) || !weddingWebsiteUrl || !qrDataUrl} onClick={() => download("qr")}>{exporting === "qr" ? "Pripravujem PDF..." : !qrDataUrl && weddingWebsiteUrl ? "Pripravujem QR kód..." : "Stiahnuť QR kartičku"}</button>
      </div>
    </section>
  )
}

const Invitation = forwardRef(function Invitation({ data, config, variant }, ref) {
  return (
    <article ref={ref} style={{ ...cardStyle, color: config.ink, background: config.paper, fontFamily: config.fontFamily }} aria-label={`${config.name} pozvánka`}>
      <div style={{ ...frameStyle, borderColor: config.accent }} />
      <Image src={config.ornament} alt="" width={180} height={180} unoptimized style={{ ...ornamentStyle, ...(variant === "penelope" ? penelopeOrnamentStyle : botaniqueOrnamentStyle) }} />
      <div style={invitationContentStyle}>
        <p style={{ ...smallStyle, color: config.accent }}>S radosťou vás pozývame</p>
        <div style={{ ...namePlateStyle, color: config.paper, background: config.ink }}>
          <h3 style={{ ...namesStyle, ...(config.fontVariant === "editorial" ? editorialNamesStyle : {}) }}>{data.firstPartner}<i>&amp;</i>{data.secondPartner}</h3>
        </div>
        <p style={dateStyle}>{data.displayDate}</p>
        <p style={detailStyle}>{data.timeLine}<br />{data.ceremonyVenue}<br />{data.ceremonyCity}</p>
      </div>
    </article>
  )
})

const QrCard = forwardRef(function QrCard({ data, config, variant, qrDataUrl }, ref) {
  return (
    <article ref={ref} style={{ ...qrCardStyle, color: config.ink, background: config.paper, fontFamily: config.fontFamily }} aria-label={`${config.name} QR kartička`}>
      <Image src={config.ornament} alt="" width={90} height={90} unoptimized style={{ ...qrOrnamentStyle, ...(variant === "penelope" ? qrPenelopeOrnamentStyle : qrBotaniqueOrnamentStyle) }} />
      <p style={{ ...smallStyle, color: config.accent }}>Všetko o našej svadbe</p>
      <div style={{ ...qrNamePlateStyle, color: config.paper, background: config.ink }}><h3 style={qrNamesStyle}>{data.firstPartner} <i>&amp;</i> {data.secondPartner}</h3></div>
      {qrDataUrl ? <Image src={qrDataUrl} alt="QR kód svadobného webu" width={126} height={126} unoptimized data-pdf-required-image="true" style={qrImageStyle} /> : <div style={qrPlaceholderStyle}>QR</div>}
      <p style={qrTextStyle}>Naskenujte QR kód<br />a potvrďte svoju účasť.</p>
      <p style={{ ...urlStyle, color: config.accent }}>{data.websiteDisplayUrl}</p>
    </article>
  )
})

const sectionStyle = { display: "grid", gap: "22px" }
const introStyle = { display: "grid", gap: "8px" }
const eyebrowStyle = { margin: 0, fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase" }
const titleStyle = { margin: 0, fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(30px,5vw,44px)", fontWeight: 400 }
const copyStyle = { maxWidth: "660px", margin: 0, fontSize: "16px", lineHeight: 1.7, opacity: .78 }
const stageStyle = { display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(22px,4vw,34px)", flexWrap: "wrap", padding: "clamp(20px,4vw,34px)" }
const cardStyle = { position: "relative", width: "392px", height: "568px", overflow: "hidden", boxShadow: "0 18px 45px rgba(40,30,24,.16)", fontFamily: "'Cormorant Garamond',Georgia,serif" }
const frameStyle = { position: "absolute", inset: "15px", pointerEvents: "none", border: "1px solid", opacity: .45 }
const ornamentStyle = { position: "absolute", zIndex: 1, objectFit: "contain", pointerEvents: "none", opacity: .72 }
const botaniqueOrnamentStyle = { top: "18px", right: "18px", width: "116px", height: "76px", transform: "rotate(4deg)" }
const penelopeOrnamentStyle = { top: "18px", right: "25px", width: "76px", height: "104px", transform: "rotate(9deg)" }
const invitationContentStyle = { position: "absolute", inset: "30px", display: "grid", alignContent: "center", justifyItems: "center", padding: "26px 18px", textAlign: "center" }
const smallStyle = { margin: 0, fontFamily: "Inter,Arial,sans-serif", fontSize: "8px", fontWeight: 600, letterSpacing: ".22em", textTransform: "uppercase" }
const namePlateStyle = { display: "grid", width: "calc(100% + 66px)", minHeight: "172px", margin: "28px 0 30px", padding: "22px", placeItems: "center" }
const namesStyle = { display: "grid", margin: 0, fontSize: "50px", fontWeight: 400, lineHeight: .72 }
const editorialNamesStyle = { lineHeight: .88, rowGap: "4px" }
const dateStyle = { margin: 0, fontSize: "21px", textTransform: "capitalize" }
const detailStyle = { margin: "16px 0 0", fontSize: "14px", lineHeight: 1.55 }
const qrCardStyle = { ...cardStyle, width: "300px", height: "420px", display: "grid", alignContent: "center", justifyItems: "center", padding: "28px", textAlign: "center" }
const qrOrnamentStyle = { position: "absolute", zIndex: 1, objectFit: "contain", pointerEvents: "none", opacity: .64 }
const qrBotaniqueOrnamentStyle = { top: "10px", right: "12px", width: "74px", height: "50px" }
const qrPenelopeOrnamentStyle = { top: "8px", right: "16px", width: "46px", height: "68px", transform: "rotate(8deg)" }
const qrNamePlateStyle = { width: "calc(100% + 24px)", margin: "15px 0 18px", padding: "13px 10px" }
const qrNamesStyle = { margin: 0, fontSize: "27px", fontWeight: 400 }
const qrImageStyle = { width: "126px", height: "126px", padding: "7px", background: "white" }
const qrPlaceholderStyle = { display: "grid", width: "126px", height: "126px", placeItems: "center", background: "white" }
const qrTextStyle = { margin: "16px 0 8px", fontSize: "14px", lineHeight: 1.45 }
const urlStyle = { maxWidth: "230px", margin: 0, overflow: "hidden", fontFamily: "Inter,Arial,sans-serif", fontSize: "8px", textOverflow: "ellipsis", whiteSpace: "nowrap" }
const actionsStyle = { display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }
const errorStyle = { margin: 0, color: "#9a4d3e", fontSize: "12px", textAlign: "center" }
