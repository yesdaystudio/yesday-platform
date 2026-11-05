"use client"

import { forwardRef } from "react"
import Image from "next/image"

const EMBROIDERY = "/templates/veno/embroidery.svg"
const LACE = "/templates/veno/lace.svg"
const PAPER = "/templates/provence/linen-paper-texture.jpg"

function Lace({ style }) {
  return <span aria-hidden="true" style={{ ...laceFrame, ...style }}>{Array.from({ length: 12 }, (_, index) => <Image key={index} src={LACE} alt="" width={120} height={160} unoptimized data-pdf-overlay-image="true" style={{ display: "block", width: "100%", height: "auto" }} />)}</span>
}
function Embroidery({ style }) {
  return <Image src={EMBROIDERY} alt="" width={600} height={960} unoptimized data-pdf-overlay-image="true" style={{ ...embroidery, ...style }} />
}
function Names({ data, config, compact = false }) {
  return <h3 style={{ ...names, color: config.ink, fontSize: compact ? "29px" : "55px", ...(compact ? { display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "7px", lineHeight: 1.15 } : {}) }}><span>{data.firstPartner}</span><i data-pdf-text-overlay="true" style={{ fontFamily: "inherit", fontSize: ".5em", fontWeight: 400, lineHeight: 1, margin: compact ? 0 : "7px 0" }}>&amp;</i><span>{data.secondPartner}</span></h3>
}

export const VenoInvitation = forwardRef(function VenoInvitation({ data, config }, ref) {
  return <article ref={ref} aria-label="Veno pozvánka" style={{ ...paper, width: "min(392px,100%)", aspectRatio: "392 / 568", color: config.ink, fontFamily: config.fontFamily }}>
    <Lace />
    <span aria-hidden="true" style={stitchedLine} />
    <Embroidery style={{ right: "-44px", bottom: "-78px", width: "220px", height: "352px" }} />
    <div style={invitationContent}>
      <p style={eyebrow}>S radosťou vás pozývame</p>
      <Names data={data} config={config} />
      <p style={{ ...body, whiteSpace: "pre-line", margin: "0 0 25px" }}>{data.invitationText}</p>
      <span style={{ width: "30px", borderTop: "1px solid", opacity: .5 }} aria-hidden="true" />
      <p style={{ margin: "19px 0 0", fontSize: "20px" }}>{data.displayDate}</p>
      <p style={{ ...body, margin: "12px 0 0", maxWidth: "230px" }}>{data.timeLine}<br />{data.ceremonyVenue}<br />{data.ceremonyCity}</p>
    </div>
  </article>
})

export const VenoReceptionCard = forwardRef(function VenoReceptionCard({ data, config }, ref) {
  return <article ref={ref} aria-label="Veno kartička k svadobnému stolu" style={{ ...paper, width: "min(360px,100%)", aspectRatio: "360 / 190", color: config.ink, fontFamily: config.fontFamily }}>
    <Lace style={{ right: "auto", left: "8px", width: "25px", opacity: .8 }} />
    <Embroidery style={{ right: "-21px", bottom: "-38px", width: "108px", height: "173px" }} />
    <div style={{ position: "absolute", zIndex: 2, inset: "27px 75px 24px 47px", display: "grid", alignContent: "center", justifyItems: "start" }}>
      <p style={eyebrow}>Pri spoločnom stole</p>
      <p style={{ margin: "14px 0 16px", fontSize: "25px", lineHeight: 1.12 }}>S radosťou Vás pozývame<br />k svadobnému stolu.</p>
      <p style={{ margin: 0, fontSize: "13px" }}>{data.displayDate}</p>
    </div>
  </article>
})

export const VenoQrCard = forwardRef(function VenoQrCard({ data, config, qrDataUrl, recipient = null }, ref) {
  return <article ref={ref} aria-label="Veno QR kartička" style={{ ...paper, width: "min(300px,100%)", aspectRatio: "300 / 470", color: config.ink, fontFamily: config.fontFamily }}>
    <Lace style={{ width: "28px", right: "5px", opacity: .8 }} />
    <Embroidery style={{ right: "2px", bottom: "-36px", width: "92px", height: "147px" }} />
    <div style={{ position: "absolute", zIndex: 2, inset: "34px 44px 43px 29px", display: "grid", alignContent: "center", justifyItems: "start" }}>
      <p style={eyebrow}>Všetko o našej svadbe</p>
      <Names data={data} config={config} compact />
      <div style={{ padding: "8px", background: "#fff", margin: "20px 0 16px" }}>
        {qrDataUrl ? <Image src={qrDataUrl} alt="QR kód svadobného webu" width={134} height={134} unoptimized data-pdf-required-image="true" style={{ display: "block", width: "134px", height: "134px", background: "#fff" }} /> : <div style={{ display: "grid", width: "134px", height: "134px", placeItems: "center", background: "#fff" }}>QR</div>}
      </div>
      <p style={{ ...body, maxWidth: "210px", fontSize: "12px", margin: "0 0 10px" }}>{recipient ? <>{recipient.salutation || recipient.recipient_label},<br />všetky informácie o svadbe nájdete po naskenovaní QR kódu.</> : <>Naskenujte QR kód<br />a potvrďte svoju účasť.</>}</p>
      <p style={{ margin: 0, maxWidth: "200px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontFamily: "Inter,Arial,sans-serif", fontSize: "8px" }}>{data.websiteDisplayUrl}</p>
    </div>
  </article>
})

const paper = { position: "relative", overflow: "hidden", backgroundColor: "#f7f2e8", backgroundImage: `linear-gradient(#f7f2e8c9,#f7f2e8c9),url(${PAPER})`, backgroundSize: "cover", boxShadow: "0 16px 40px rgba(66,44,33,.13)" }
const laceFrame = { position: "absolute", zIndex: 1, top: 0, bottom: 0, right: "9px", width: "39px", overflow: "hidden", pointerEvents: "none" }
const stitchedLine = { position: "absolute", top: "28px", left: "22px", bottom: "28px", borderLeft: "1px dashed #71343f40", pointerEvents: "none" }
const embroidery = { position: "absolute", zIndex: 1, objectFit: "contain", pointerEvents: "none" }
const invitationContent = { position: "absolute", zIndex: 2, inset: "45px 65px 50px 42px", display: "grid", alignContent: "center", justifyItems: "start", textAlign: "left" }
const eyebrow = { margin: 0, fontFamily: "Inter,Arial,sans-serif", fontSize: "7px", fontWeight: 500, letterSpacing: ".19em", textTransform: "uppercase" }
const names = { display: "grid", justifyItems: "start", maxWidth: "100%", margin: "30px 0 26px", fontFamily: "inherit", fontWeight: 400, lineHeight: .95, letterSpacing: "-.025em", overflowWrap: "anywhere" }
const body = { fontSize: "13px", lineHeight: 1.55 }
