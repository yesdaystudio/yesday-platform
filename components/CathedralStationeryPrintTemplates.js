"use client"
import { forwardRef } from "react"
import Image from "next/image"

function Background({ kind = "invitation" }) {
  const sources = { invitation: "/templates/cathedral/invitation-frame.webp", reception: "/templates/cathedral/reception-bottom-v4.webp", qr: "/templates/cathedral/qr-top-v4.webp" }
  return <Image src={sources[kind]} alt="" width={kind === "reception" ? 1536 : 1024} height={kind === "reception" ? 1024 : 1536} unoptimized data-pdf-background-image="true" style={{ position: "absolute", inset: 0, height: "100%", width: "100%", pointerEvents: "none" }} />
}
function Names({ data, config, small = false }) {
  const longest = Math.max(data.firstPartner.length, data.secondPartner.length, 1)
  const size = Math.min(small ? 12 : 11, 92 / Math.max(longest * .8, 6))
  return <h3 style={{ margin: 0, fontFamily: config.fontVariant === "editorial" ? "'Cathedral Print Modern',cursive" : "'Cathedral Print Script',cursive", fontWeight: 400, fontSize: `${size}cqw`, lineHeight: 1, display: "grid", justifyItems: "center", gap: "1.6cqw", overflowWrap: "anywhere", width: "100%" }}><span>{data.firstPartner}</span><i data-pdf-text-overlay="true" style={{ fontFamily: "'Cathedral Print Serif',Georgia,serif", fontStyle: "italic", fontSize: ".5em", fontWeight: 400, lineHeight: .8 }}>&amp;</i><span>{data.secondPartner}</span></h3>
}
export const CathedralInvitation = forwardRef(function CathedralInvitation({ data, config }, ref) {
  return <article ref={ref} aria-label="Cathedral pozvánka" style={{ ...paper, width: "min(392px,100%)", aspectRatio: "2 / 3", color: config.ink, fontFamily: "'Cathedral Print Serif',Georgia,serif" }}>
    <Background />
    <p style={{ ...block, top: "29.3%", left: "20%", right: "20%", fontSize: "3.4cqw", letterSpacing: ".05em", fontStyle: "italic" }}>Spoločne s našimi rodinami</p>
    <div style={{ ...block, top: "35.2%", left: "21%", right: "21%" }}><Names data={data} config={config} /></div>
    <p style={{ ...block, top: "57.3%", left: "20%", right: "20%", fontSize: "3.45cqw", lineHeight: 1.45, fontStyle: "italic" }}>Vás s radosťou pozývame<br />na oslavu nášho svadobného dňa.</p>
    <p style={{ ...block, top: "70.2%", left: "20%", right: "20%", fontSize: "4.3cqw", letterSpacing: ".055em", textTransform: "uppercase" }}>{data.displayDate}</p>
    <p style={{ ...block, top: "74.2%", left: "20%", right: "20%", fontSize: "4cqw", letterSpacing: ".08em" }}>O {data.timeLine.split(" · ").pop()}</p>
    <p style={{ ...block, top: "78.8%", left: "21%", right: "21%", fontSize: "3.7cqw", lineHeight: 1.3, fontStyle: "italic" }}>{data.ceremonyVenue}<br />{data.ceremonyCity}</p>
  </article>
})
export const CathedralReceptionCard = forwardRef(function CathedralReceptionCard({ data, config }, ref) {
  const reception = data.reception || {}
  return <article ref={ref} aria-label="Cathedral kartička k svadobnému stolu" style={{ ...paper, width: "min(392px,100%)", color: config.ink, fontFamily: "'Cathedral Print Serif',Georgia,serif" }}>
    <Background kind="reception" />
    <div style={{ position: "relative", zIndex: 1, padding: "9cqw 14cqw 28cqw", textAlign: "center" }}>
      <p style={{ margin: "0 0 2.5cqw", fontFamily: config.fontVariant === "editorial" ? "'Cathedral Print Modern',cursive" : "'Cathedral Print Script',cursive", fontSize: "8.5cqw", lineHeight: 1.1 }}>Svadobná hostina</p>
      <p style={{ margin: "0 0 3.5cqw", fontSize: "3.5cqw", lineHeight: 1.4, fontStyle: "italic" }}>S radosťou Vás pozývame<br />k svadobnému stolu.</p>
      {reception.name ? <p style={{ margin: 0, fontSize: reception.name.length > 45 ? "4cqw" : "4.8cqw", lineHeight: 1.2, overflowWrap: "anywhere" }}>{reception.name}</p> : null}
      {reception.address ? <p style={{ margin: "1.3cqw 0 0", fontSize: "3.2cqw", lineHeight: 1.3, overflowWrap: "anywhere" }}>{reception.address}</p> : null}
      {reception.date || reception.time ? <p style={{ margin: "2.5cqw 0 0", fontSize: "3.1cqw", letterSpacing: ".035em" }}>{[reception.date, reception.time ? `o ${reception.time}` : ''].filter(Boolean).join(' · ')}</p> : null}
    </div>
  </article>
})
export const CathedralQrCard = forwardRef(function CathedralQrCard({ data, config, qrDataUrl, recipient }, ref) {
  const combinedLength = data.firstPartner.length + data.secondPartner.length + 3
  return <article ref={ref} aria-label="Cathedral QR kartička" style={{ ...paper, width: "min(320px,100%)", aspectRatio: recipient ? "2 / 3.2" : "2 / 3", color: config.ink, fontFamily: "'Cathedral Print Serif',Georgia,serif" }}>
    <Background kind="qr" />
    <p style={{ ...block, top: "30%", left: "19%", right: "19%", fontSize: "3.6cqw", fontStyle: "italic", letterSpacing: ".05em" }}>Svadobný web</p>
    <h3 style={{ ...block, top: "34.5%", left: "17%", right: "17%", fontFamily: config.fontVariant === "editorial" ? "'Cathedral Print Modern',cursive" : "'Cathedral Print Script',cursive", fontWeight: 400, fontSize: `${Math.max(4, Math.min(9,130 / combinedLength))}cqw`, lineHeight: 1.25, overflowWrap: "anywhere" }}>{data.firstPartner}{data.secondPartner ? <> <i data-pdf-text-overlay="true" style={{ display: "inline-block", fontFamily: "'Cathedral Print Serif',Georgia,serif", fontStyle: "italic", fontSize: ".65em", fontWeight: 400 }}>&amp;</i> {data.secondPartner}</> : null}</h3>
    <div style={{ position: "absolute", zIndex: 1, top: "45%", left: "50%", transform: "translateX(-50%)", padding: "2.5cqw", width: "52cqw", background: "#fff" }}>{qrDataUrl ? <Image src={qrDataUrl} alt="QR kód svadobného webu" width={166} height={166} unoptimized data-pdf-required-image="true" style={{ display: "block", width: "100%", height: "auto" }} /> : <div style={{ width: "100%", aspectRatio: 1, display: "grid", placeItems: "center" }}>QR</div>}</div>
    <p style={{ ...block, top: recipient ? "81%" : "82.8%", left: "19%", right: "19%", fontSize: recipient ? "3.3cqw" : "3.6cqw", lineHeight: 1.35, fontStyle: "italic", overflowWrap: "anywhere" }}>{recipient ? <>{recipient.recipient_label || recipient.salutation}<br />Naskenujte kód a potvrďte účasť.</> : <>Informácie o svadbe a potvrdenie účasti<br />nájdete po naskenovaní kódu.</>}</p>
    <p style={{ ...block, top: "94%", left: "12%", right: "12%", fontSize: "2.5cqw", lineHeight: 1.1, overflowWrap: "anywhere" }}>{data.websiteDisplayUrl}</p>
  </article>
})
const paper = { position: "relative", containerType: "inline-size", overflow: "hidden", backgroundColor: "#faf7f0", boxShadow: "0 15px 42px #42658a18" }
const block = { position: "absolute", zIndex: 1, margin: 0, textAlign: "center" }

export async function getCathedralPrintFontCSS() {
 const faces = [
  ['Cathedral Print Script','/templates/cathedral/great-vibes-regular.woff2','normal'],
  ['Cathedral Print Modern','/templates/chloe/ms-madi-regular.woff2','normal'],
  ['Cathedral Print Serif','/templates/chloe/cormorant-regular.woff2','normal'],
  ['Cathedral Print Serif','/templates/cathedral/cormorant-italic.woff2','italic'],
 ];
 return (await Promise.all(faces.map(async ([family,path,style])=>{
  const response=await fetch(path); if(!response.ok)throw new Error('Tlačové písmo sa nepodarilo načítať.');
  const blob=await response.blob();const url=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob)});
  return `@font-face { font-family: '${family}'; font-style: ${style}; font-weight: 400; src: url("${url}") format('woff2'); }`;
 }))).join('\n');
}
