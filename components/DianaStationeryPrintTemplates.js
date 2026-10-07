"use client"

import { forwardRef } from "react"
import Image from "next/image"

const dianaSerifFontFamily = "'Cormorant Garamond', Georgia, 'Times New Roman', serif"

export const DianaInvitationPrintTemplate = forwardRef(function DianaInvitationPrintTemplate(
  { data, scale = 1 },
  ref
) {
  return (
    <article
      ref={ref}
      style={{
        ...invitationCardStyle,
        width: `${392 * scale}px`,
        height: `${568 * scale}px`,
        padding: `${34 * scale}px ${38 * scale}px ${34 * scale}px`,
      }}
      aria-label="Diana pozvánka"
    >
      <div style={invitationCompositionStyle}>
        <DianaMonogram data={data} style={invitationMonogramStyle} />

        <p style={invitationIntroStyle}>{data.invitationText}</p>

        <div style={invitationNamesWrapStyle}>
          <p style={invitationNameStyle}>{String(data.firstPartner || "Diana").toUpperCase()}</p>
          {data.secondPartner ? <p style={invitationAmpersandStyle}>a</p> : null}
          {data.secondPartner ? (
            <p style={invitationNameStyle}>{String(data.secondPartner).toUpperCase()}</p>
          ) : null}
        </div>

        <div style={invitationDividerStyle} aria-hidden="true" />

        <div style={invitationDateStyle}>
          <p style={invitationLineStyle}>{data.displayDate}</p>
          <p style={invitationSmallLineStyle}>{data.timeLine}</p>
        </div>

        <div style={invitationVenueStyle}>
          <p style={invitationLineStyle}>{data.ceremonyVenue}</p>
          <p style={invitationSmallLineStyle}>{data.ceremonyCity}</p>
        </div>

        <div style={invitationReceptionStyle}>
          <p style={invitationSmallLineStyle}>{data.receptionIntro}</p>
          <p style={invitationSmallLineStyle}>{data.receptionVenue}</p>
        </div>
      </div>

      <div style={invitationBottomStyle}>
        <p style={invitationBottomTextStyle}>{data.detailsText}</p>
        <OliveBranch />
      </div>
    </article>
  )
})

export const DianaQrCardPrintTemplate = forwardRef(function DianaQrCardPrintTemplate(
  { data, qrDataUrl },
  ref
) {
  return (
    <article ref={ref} style={qrCardStyle} aria-label="Diana QR kartička">
      <div style={qrTopStyle}>
        <p style={qrEyebrowStyle}>{data.qrTitle}</p>
        <p style={qrInstructionStyle}>{data.qrInstruction}</p>
      </div>

      <div style={qrFrameStyle}>
        {qrDataUrl ? (
          <Image
            src={qrDataUrl}
            alt="QR kód na svadobný web"
            width={170}
            height={170}
            unoptimized
            style={qrImageStyle}
          />
        ) : (
          <div style={qrPlaceholderStyle} aria-label="Ukážkový QR placeholder">
            {Array.from({ length: 25 }).map((_, index) => (
              <span
                key={index}
                style={{
                  ...qrPlaceholderDotStyle,
                  opacity: [0, 1, 5, 6, 8, 12, 16, 18, 19, 23, 24].includes(index) ? 1 : 0.2,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div style={qrBottomStyle}>
        <p style={qrTextStyle}>{data.qrText}</p>
        <DianaMonogram data={data} />
        <p style={qrUrlStyle}>{data.weddingWebsiteUrl || "URL svadobného webu bude doplnená"}</p>
      </div>
    </article>
  )
})

function DianaMonogram({ data, style }) {
  return (
    <div style={{ ...monogramStyle, ...style }} aria-label={data.initials}>
      <span style={monogramLetterStyle}>{String(data.firstPartner || "D").charAt(0)}</span>
      <span style={monogramRuleStyle} aria-hidden="true" />
      <span style={monogramLetterStyle}>{String(data.secondPartner || "A").charAt(0)}</span>
    </div>
  )
}

function OliveBranch() {
  return (
    <svg
      width="42"
      height="22"
      viewBox="0 0 42 22"
      fill="none"
      aria-hidden="true"
      style={oliveBranchStyle}
    >
      <path
        d="M3 19C13.5 12.7 24.5 7.7 39 3.5"
        stroke="currentColor"
        strokeWidth="0.48"
        strokeLinecap="round"
      />
      <path
        d="M12.8 13.5C10.6 12.4 9.2 12.5 7.6 13.8C9.7 15 11.2 14.8 12.8 13.5Z"
        stroke="currentColor"
        strokeWidth="0.42"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.2 9.8C18.1 8.5 16.7 8.4 14.9 9.5C16.9 10.9 18.4 11 20.2 9.8Z"
        stroke="currentColor"
        strokeWidth="0.42"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M28.2 7C26.3 5.6 24.9 5.3 23 6.2C24.8 7.7 26.3 8 28.2 7Z"
        stroke="currentColor"
        strokeWidth="0.42"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M35.2 5C33.6 3.7 32.3 3.3 30.3 4C32 5.5 33.4 5.8 35.2 5Z"
        stroke="currentColor"
        strokeWidth="0.42"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const deepBrown = "#3c3128"
const invitationTaupe = "#9a8770"

const cardSurfaceStyle = {
  background:
    "radial-gradient(circle at 52% 38%, rgba(255,255,255,0.52), rgba(255,255,255,0) 30%), linear-gradient(160deg, rgba(255,252,246,0.995) 0%, rgba(250,245,236,0.995) 58%, rgba(244,235,221,0.995) 100%)",
  boxShadow: "0 24px 46px rgba(62, 44, 29, 0.22), 0 1px 0 rgba(255,255,255,0.92) inset",
  color: deepBrown,
}

const invitationCardStyle = {
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
  boxSizing: "border-box",
  aspectRatio: "5 / 7.25",
  background: "#fbf5ea",
  color: invitationTaupe,
  display: "grid",
  gridTemplateRows: "auto auto",
  alignContent: "start",
  fontFamily: dianaSerifFontFamily,
  textAlign: "center",
}

const invitationCompositionStyle = {
  alignSelf: "start",
  display: "grid",
  justifyItems: "center",
  gap: 0,
  paddingTop: 0,
}

const monogramStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  color: "#a18d75",
}

const invitationMonogramStyle = {
  marginBottom: "23px",
}

const monogramLetterStyle = {
  margin: 0,
  fontSize: "13px",
  fontWeight: 400,
  lineHeight: 1,
  letterSpacing: "0.12em",
}

const monogramRuleStyle = {
  width: "1px",
  height: "31px",
  display: "block",
  flexShrink: 0,
  background: "currentColor",
  opacity: 0.52,
}

const invitationIntroStyle = {
  maxWidth: "278px",
  margin: 0,
  whiteSpace: "pre-line",
  fontSize: "11.4px",
  lineHeight: 1.42,
  letterSpacing: "0.025em",
  color: "rgba(126, 108, 88, 0.62)",
}

const invitationNamesWrapStyle = {
  display: "grid",
  justifyItems: "center",
  gap: "13px",
  margin: "24px 0 0",
}

const invitationNameStyle = {
  margin: 0,
  fontSize: "62px",
  fontWeight: 400,
  lineHeight: 0.9,
  letterSpacing: "0.045em",
  color: "#8f7b64",
  whiteSpace: "nowrap",
}

const invitationAmpersandStyle = {
  margin: "2px 0",
  fontSize: "17px",
  fontStyle: "italic",
  lineHeight: 1.1,
  letterSpacing: "0.01em",
  color: "rgba(143, 123, 100, 0.62)",
}

const invitationDividerStyle = {
  width: "76px",
  height: "1px",
  marginTop: "18px",
  background: "rgba(151, 130, 105, 0.42)",
  transform: "scaleY(0.42)",
}

const invitationDateStyle = {
  display: "grid",
  gap: "4px",
  marginTop: "18px",
}

const invitationLineStyle = {
  margin: 0,
  fontSize: "12.6px",
  lineHeight: 1.3,
  letterSpacing: "0.035em",
  color: "rgba(112, 96, 78, 0.64)",
}

const invitationSmallLineStyle = {
  margin: 0,
  fontSize: "10.9px",
  lineHeight: 1.34,
  letterSpacing: "0.03em",
  color: "rgba(126, 108, 88, 0.58)",
}

const invitationVenueStyle = {
  display: "grid",
  gap: "3px",
  marginTop: "16px",
}

const invitationReceptionStyle = {
  display: "grid",
  gap: "2px",
  marginTop: "12px",
}

const invitationBottomStyle = {
  position: "relative",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  minHeight: "34px",
  marginTop: "14px",
}

const invitationBottomTextStyle = {
  maxWidth: "242px",
  margin: 0,
  whiteSpace: "pre-line",
  fontSize: "10px",
  lineHeight: 1.36,
  letterSpacing: "0.03em",
  color: "rgba(126, 108, 88, 0.5)",
}

const oliveBranchStyle = {
  position: "absolute",
  right: "1px",
  bottom: "1px",
  color: "rgba(151, 130, 105, 0.22)",
}

const qrCardStyle = {
  boxSizing: "border-box",
  width: "min(100%, 238px)",
  aspectRatio: "4 / 5",
  minHeight: "298px",
  marginTop: 0,
  padding: "24px 24px 18px",
  ...cardSurfaceStyle,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between",
  textAlign: "center",
  fontFamily: dianaSerifFontFamily,
}

const qrTopStyle = {
  display: "grid",
  width: "100%",
  gap: "6px",
}

const qrEyebrowStyle = {
  margin: 0,
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  color: "rgba(65, 53, 43, 0.82)",
}

const qrInstructionStyle = {
  margin: 0,
  fontSize: "14px",
  fontStyle: "italic",
  letterSpacing: "0.08em",
  color: "rgba(65, 53, 43, 0.78)",
}

const qrFrameStyle = {
  width: "124px",
  height: "124px",
  padding: "7px",
  border: "1px solid rgba(142, 118, 79, 0.62)",
  background: "#fffdf8",
  display: "grid",
  placeItems: "center",
}

const qrImageStyle = {
  width: "110px",
  height: "110px",
}

const qrPlaceholderStyle = {
  width: "94px",
  height: "94px",
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: "5px",
}

const qrPlaceholderDotStyle = {
  background: deepBrown,
}

const qrBottomStyle = {
  display: "grid",
  justifyItems: "center",
  gap: "6px",
}

const qrTextStyle = {
  maxWidth: "180px",
  margin: 0,
  fontSize: "10px",
  lineHeight: 1.55,
  letterSpacing: "0.17em",
  textTransform: "uppercase",
  color: "rgba(65, 53, 43, 0.72)",
}

const qrUrlStyle = {
  maxWidth: "100%",
  margin: 0,
  fontSize: "9px",
  lineHeight: 1.35,
  letterSpacing: "0.06em",
  color: "rgba(127, 106, 88, 0.72)",
  overflowWrap: "anywhere",
}
