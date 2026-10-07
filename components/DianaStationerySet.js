"use client"

import { useMemo, useRef, useState } from "react"
import {
  DianaInvitationPrintTemplate,
  DianaQrCardPrintTemplate,
} from "./DianaStationeryPrintTemplates"
import { getDianaStationeryData } from "../lib/dianaStationeryData"
import {
  downloadDianaInvitationPdf,
  downloadDianaQrCardPdf,
} from "../lib/dianaStationeryPdf"

export default function DianaStationerySet({ project, weddingWebsiteUrl, qrDataUrl, qrError }) {
  const [exporting, setExporting] = useState("")
  const invitationRef = useRef(null)
  const qrCardRef = useRef(null)
  const stationeryData = useMemo(
    () => getDianaStationeryData(project, weddingWebsiteUrl),
    [project, weddingWebsiteUrl]
  )

  async function handleInvitationExport() {
    setExporting("invitation")
    try {
      await downloadDianaInvitationPdf(invitationRef.current, project)
    } finally {
      setExporting("")
    }
  }

  async function handleQrExport() {
    setExporting("qr")
    try {
      await downloadDianaQrCardPdf(qrCardRef.current, project)
    } finally {
      setExporting("")
    }
  }

  return (
    <section style={stationerySectionStyle}>
      <div style={stationeryIntroStyle}>
        <p style={stationeryEyebrowStyle}>Diana stationery set</p>
        <h2 style={stationeryTitleStyle}>Pozvánka a QR kartička</h2>
        <p style={stationeryCopyStyle}>
          Toto je jednoduchý náhľad. Finálny výstup tvoria samostatné PDF exporty hlavnej pozvánky
          a QR kartičky.
        </p>
      </div>

      <div style={stationeryStageStyle}>
        <DianaInvitationPrintTemplate ref={invitationRef} data={stationeryData} />
        <div style={qrPreviewWrapStyle}>
          <DianaQrCardPrintTemplate
            ref={qrCardRef}
            data={stationeryData}
            qrDataUrl={qrDataUrl}
          />
          {qrError ? <p style={qrErrorStyle}>{qrError}</p> : null}
        </div>
      </div>

      <div style={downloadActionsStyle}>
        <button
          type="button"
          onClick={handleInvitationExport}
          disabled={exporting === "invitation"}
          style={{
            ...downloadButtonStyle,
            ...(exporting === "invitation" ? disabledDownloadButtonStyle : {}),
          }}
        >
          {exporting === "invitation" ? "Pripravujem PDF..." : "Stiahnuť pozvánku"}
        </button>

        <button
          type="button"
          onClick={handleQrExport}
          disabled={exporting === "qr" || !weddingWebsiteUrl}
          style={{
            ...downloadButtonStyle,
            ...(exporting === "qr" || !weddingWebsiteUrl ? disabledDownloadButtonStyle : {}),
          }}
        >
          {exporting === "qr" ? "Pripravujem PDF..." : "Stiahnuť QR kartičku"}
        </button>
      </div>
    </section>
  )
}

const deepBrown = "#3c3128"

const stationerySectionStyle = {
  display: "grid",
  gap: "22px",
}

const stationeryIntroStyle = {
  display: "grid",
  gap: "8px",
}

const stationeryEyebrowStyle = {
  margin: 0,
  fontSize: "11px",
  letterSpacing: "0.28em",
  textTransform: "uppercase",
  color: "#9b7c62",
}

const stationeryTitleStyle = {
  margin: 0,
  fontSize: "clamp(30px, 5vw, 44px)",
  fontWeight: 400,
  color: deepBrown,
}

const stationeryCopyStyle = {
  maxWidth: "660px",
  margin: 0,
  fontSize: "16px",
  lineHeight: 1.7,
  color: "#6f5b4b",
}

const stationeryStageStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "clamp(22px, 4vw, 34px)",
  flexWrap: "wrap",
  padding: "clamp(20px, 4vw, 32px)",
  background: "#f7f1e8",
}

const qrPreviewWrapStyle = {
  display: "grid",
  justifyItems: "center",
  gap: "10px",
}

const qrErrorStyle = {
  margin: 0,
  fontSize: "12px",
  color: "#9a4d3e",
}

const downloadActionsStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  justifyContent: "center",
}

const downloadButtonStyle = {
  appearance: "none",
  border: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "fit-content",
  padding: "10px 16px",
  borderRadius: 0,
  background: "#5f4838",
  color: "#fffaf5",
  textDecoration: "none",
  fontSize: "14px",
  fontFamily: "inherit",
  cursor: "pointer",
}

const disabledDownloadButtonStyle = {
  opacity: 0.48,
  cursor: "not-allowed",
}
