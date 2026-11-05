"use client"
import { forwardRef } from "react"
import Image from "next/image"

const WASH = "/templates/riviera/stationery-blue-wash.webp"

function WatercolorBackground() {
  return <Image src={WASH} alt="" width={1040} height={1512} unoptimized data-pdf-background-image="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", pointerEvents: "none" }} />
}

function Names({ data, compact = false }) {
  const longestName = Math.max(data.firstPartner.length, data.secondPartner.length, 1)
  const fontSize = compact ? Math.min(35, Math.max(24, 460 / (data.firstPartner.length + data.secondPartner.length + 3))) : Math.min(82, Math.max(44, 740 / longestName))
  return (
    <h3 style={{ margin: compact ? "20px 0" : 0, display: compact ? "flex" : "grid", flexWrap: "wrap", justifyContent: "center", alignItems: compact ? "baseline" : undefined, gap: compact ? "7px" : 0, justifyItems: "center", maxWidth: "100%", fontFamily: "'Riviera Print Script',cursive", fontSize: `${fontSize}px`, fontStyle: "normal", fontWeight: 400, lineHeight: 1.02, letterSpacing: 0, overflowWrap: "anywhere" }}>
      <span>{data.firstPartner}</span>
      <i data-pdf-text-overlay="true" style={{ margin: compact ? 0 : "1px 0 3px", fontFamily: "'Riviera Print Script',cursive", fontWeight: 400, fontStyle: "normal", fontSize: compact ? ".75em" : "30px", lineHeight: 1 }}>&amp;</i>
      <span>{data.secondPartner}</span>
    </h3>
  )
}

export const RivieraInvitation = forwardRef(function RivieraInvitation({ data, config }, ref) {
  return (
    <article ref={ref} aria-label="Riviera pozvánka" style={{ ...paper, width: "min(392px,100%)", aspectRatio: "392 / 568", color: config.ink, fontFamily: config.fontVariant === "editorial" ? "'Riviera Print Editorial',Georgia,serif" : "'Riviera Print Serif',Georgia,serif" }}>
      <WatercolorBackground />
      <div style={{ position: "absolute", inset: "65px 28px auto", height: "241px", display: "grid", alignContent: "center", justifyItems: "center", textAlign: "center" }}>
        <Names data={data} />
      </div>
      <div style={{ position: "absolute", inset: "366px 32px 25px", display: "grid", alignContent: "center", justifyItems: "center", textAlign: "center" }}>
        <p style={{ ...body, margin: "0 0 14px", whiteSpace: "pre-line" }}>{data.invitationText}</p>
        <p style={{ margin: 0, fontSize: "20px", lineHeight: 1.2 }}>{data.displayDate}</p>
        <p style={{ margin: "9px 0 0", maxWidth: "270px", fontSize: "11px", lineHeight: 1.5 }}>{data.timeLine}<br />{data.ceremonyVenue}<br />{data.ceremonyCity}</p>
      </div>
    </article>
  )
})

export const RivieraReceptionCard = forwardRef(function RivieraReceptionCard({ data, config }, ref) {
  return (
    <article ref={ref} aria-label="Riviera kartička k svadobnému stolu" style={{ ...paper, width: "min(360px,100%)", aspectRatio: "360 / 190", color: config.ink, fontFamily: config.fontVariant === "editorial" ? "'Riviera Print Editorial',Georgia,serif" : "'Riviera Print Serif',Georgia,serif" }}>
      <WatercolorBackground />
      <div style={{ position: "absolute", inset: "32px 26px 24px", display: "grid", alignContent: "center", justifyItems: "center", textAlign: "center" }}>
        <p style={{ margin: "0 0 19px", fontSize: "28px", lineHeight: 1.12, fontStyle: "normal" }}>S radosťou Vás pozývame<br />k svadobnému stolu.</p>
        <p style={{ margin: 0, fontSize: "14px", letterSpacing: ".025em" }}>{data.displayDate}</p>
      </div>
    </article>
  )
})

export const RivieraQrCard = forwardRef(function RivieraQrCard({ data, config, qrDataUrl, recipient = null }, ref) {
  return (
    <article ref={ref} aria-label="Riviera QR kartička" style={{ ...paper, width: "min(300px,100%)", aspectRatio: "300 / 470", color: config.ink, fontFamily: config.fontVariant === "editorial" ? "'Riviera Print Editorial',Georgia,serif" : "'Riviera Print Serif',Georgia,serif" }}>
      <WatercolorBackground />
      <div style={{ position: "absolute", inset: "30px 26px 35px", display: "grid", alignContent: "center", justifyItems: "center", textAlign: "center" }}>
        <p style={eyebrow}>Všetko o našej svadbe</p>
        <Names data={data} compact />
        <div style={{ padding: "9px", background: "#fff" }}>
          {qrDataUrl ? <Image src={qrDataUrl} alt="QR kód svadobného webu" width={130} height={130} unoptimized data-pdf-required-image="true" style={{ display: "block", width: "130px", height: "130px", background: "#fff" }} /> : <div style={{ display: "grid", width: "130px", height: "130px", placeItems: "center", background: "#fff" }}>QR</div>}
        </div>
        <p style={{ ...body, maxWidth: "220px", fontSize: "12px", margin: "19px 0 10px" }}>{recipient ? <>{recipient.salutation || recipient.recipient_label},<br />všetky informácie o svadbe nájdete po naskenovaní QR kódu.</> : <>Naskenujte QR kód<br />a potvrďte svoju účasť.</>}</p>
        <p style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0, fontFamily: "'Riviera Print Sans',Arial,sans-serif", fontSize: "8px" }}>{data.websiteDisplayUrl}</p>
      </div>
    </article>
  )
})

const paper = { position: "relative", overflow: "hidden", backgroundColor: "#fff", boxShadow: "0 16px 40px rgba(28,59,82,.13)" }
const eyebrow = { margin: 0, fontFamily: "'Riviera Print Sans',Arial,sans-serif", fontSize: "7px", fontWeight: 500, letterSpacing: ".19em", textTransform: "uppercase" }
const body = { fontSize: "12.5px", lineHeight: 1.5 }

export async function getRivieraPrintFontCSS() {
  const faces = [["Riviera Print Serif", "cormorant-regular.woff2"], ["Riviera Print Editorial", "playfair-regular.woff2"], ["Riviera Print Sans", "inter-regular.woff2"], ["Riviera Print Script", "ms-madi-regular.woff2"]]
  return (await Promise.all(faces.map(async ([family, file]) => {
    const response = await fetch(`/templates/chloe/${file}`)
    if (!response.ok) throw new Error("Tlačové písmo sa nepodarilo načítať.")
    const blob = await response.blob()
    const url = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    return `@font-face { font-family: '${family}'; font-style: normal; font-weight: 400; src: url("${url}") format('woff2'); }`
  }))).join("\n")
}
