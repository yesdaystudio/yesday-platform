"use client"
import { forwardRef } from "react"
import Image from "next/image"

function Background({ kind = "invitation" }) {
  const src = kind === "invitation" ? "/templates/cathedral/invitation-frame.webp" : `/templates/cathedral/${kind}-frame.svg?v=2`
  return <Image src={src} alt="" width={kind === "reception" ? 400 : kind === "qr" ? 300 : 1024} height={kind === "reception" ? 280 : kind === "qr" ? 580 : 1536} unoptimized {...(kind === "invitation" ? { 'data-pdf-background-image': 'true' } : { 'data-pdf-overlay-image': 'true' })} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
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
  return <article ref={ref} aria-label="Cathedral kartička k svadobnému stolu" style={{ ...paper, width: "min(360px,100%)", aspectRatio: "10 / 7", color: config.ink, fontFamily: "'Cathedral Print Serif',Georgia,serif" }}>
    <Background kind="reception" />
    <div style={{ ...block, top: "27%", left: "15%", right: "15%" }}>
      <p style={{ margin: "0 0 4cqw", fontFamily: config.fontVariant === "editorial" ? "'Cathedral Print Modern',cursive" : "'Cathedral Print Script',cursive", fontSize: "8.5cqw" }}>Pri svadobnom stole</p>
      <p style={{ margin: 0, fontSize: "4.4cqw", lineHeight: 1.4 }}>S radosťou Vás pozývame<br />k svadobnému stolu.</p>
      <p style={{ margin: "3cqw 0 0", fontSize: "3.4cqw", lineHeight: 1.35 }}>{data.receptionVenue}</p>
    </div>
  </article>
})
export const CathedralQrCard = forwardRef(function CathedralQrCard({ data, config, qrDataUrl, recipient }, ref) {
  return <article ref={ref} aria-label="Cathedral QR kartička" style={{ ...paper, width: "min(300px,100%)", minHeight: 580, color: config.ink, fontFamily: "'Cathedral Print Serif',Georgia,serif" }}>
    <Background kind="qr" />
    <div style={{ position: "relative", zIndex: 1, padding: "150px 45px 62px", textAlign: "center" }}>
      <Names data={data} config={config} small />
      <div style={{ padding: 9, width: 172, maxWidth: "100%", background: "#fff", margin: "24px auto 17px" }}>{qrDataUrl ? <Image src={qrDataUrl} alt="QR kód svadobného webu" width={154} height={154} unoptimized data-pdf-required-image="true" style={{ display: "block", width: "100%", height: "auto" }} /> : <div style={{ width: "100%", aspectRatio: 1, display: "grid", placeItems: "center" }}>QR</div>}</div>
      <p style={{ fontSize: 13, lineHeight: 1.45, margin: "0 0 10px", fontStyle: "italic" }}>{recipient ? <>{recipient.salutation || recipient.recipient_label},<br />všetky informácie o svadbe a potvrdenie účasti nájdete po naskenovaní QR kódu.</> : <>Všetko o našej svadbe<br />a potvrdenie účasti nájdete<br />po naskenovaní QR kódu.</>}</p>
      <p style={{ margin: 0, fontFamily: "Inter,Arial,sans-serif", fontSize: 8, overflowWrap: "anywhere" }}>{data.websiteDisplayUrl}</p>
    </div>
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
