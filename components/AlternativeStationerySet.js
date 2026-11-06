"use client"

import { forwardRef, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { RivieraInvitation, RivieraReceptionCard, RivieraQrCard, getRivieraPrintFontCSS } from "./RivieraStationeryPrintTemplates"
import { VenoInvitation, VenoReceptionCard, VenoQrCard } from "./VenoStationeryPrintTemplates"
import { getDianaStationeryData } from "../lib/dianaStationeryData"
import { downloadStationeryPdf } from "../lib/dianaStationeryPdf"
import { getDesignCustomization } from "../lib/designCustomization"

export const ALTERNATIVE_STATIONERY_CONFIG = {
  riviera: { name: "Riviera", ink: "#254f78", accent: "#b59843", paper: "#faf7ee", ornament: "/templates/riviera/lemon-branch.png" },
  veno: { name: "Veno", ink: "#71343f", accent: "#927950", paper: "#f5f0e6", ornament: "/templates/veno/embroidery.svg" },
  botanique: { name: "Botanique", ink: "#26362b", accent: "#75836b", paper: "#ffffff", ornament: "/templates/botanique/foliage-top-v3.png" },
  penelope: { name: "Penelope", ink: "#5a3f45", accent: "#b7868f", paper: "#fbf3f1", ornament: "/templates/penelope/redesign/sweet-pea-top.webp" },
  fleurie: { name: "Fleurie", ink: "#6e444b", accent: "#c69699", paper: "#fbf3ee", ornament: "/templates/fleurie/floral-divider.png" },
  provence: { name: "Provence", ink: "#68546c", accent: "#a79bb7", paper: "#f3eee4", ornament: "/templates/provence/lavender-olive-stems.png" },
  lavande: { name: "Lavande", ink: "#554861", accent: "#8d7b9d", paper: "#f3eee5", ornament: "/templates/lavande/hero-lavender-meadow-v2.png" },
}

const PENELOPE_BACKGROUND = "/templates/penelope/redesign/hero-watercolor.webp"
const PENELOPE_FLOWER_TOP = "/templates/penelope/redesign/sweet-pea-top.webp"
const PENELOPE_FLOWER_BOTTOM = "/templates/penelope/redesign/sweet-pea-bottom.webp"
const FLEURIE_HERO_MEADOW = "/templates/fleurie/meadow-hero.png"
const FLEURIE_INVITATION_POPPY = "/templates/fleurie/invitation-poppy.png"
const FLEURIE_INVITATION_BOUQUET = "/templates/fleurie/invitation-bouquet.png"
const FLEURIE_INVITATION_FRAME = "/templates/fleurie/invitation-frame.png"
const FLEURIE_QR_YELLOW_FLOWERS = "/templates/fleurie/qr-yellow-yarrow.png"
const PROVENCE_LAVENDER = "/templates/provence/lavender-olive-stems.png"
const PROVENCE_PAPER = "/templates/provence/linen-paper-texture.jpg"
const LAVANDE_BOTANICAL = "/templates/lavande/hero-lavender-corners.png"

export default function AlternativeStationerySet({ variant, project, weddingWebsiteUrl, qrDataUrl, qrError, websiteDisplayUrl }) {
  const config = getAlternativeStationeryConfig(variant, project)
  const invitationRef = useRef(null)
  const qrRef = useRef(null)
  const receptionRef = useRef(null)
  const [exporting, setExporting] = useState("")
  const [exportError, setExportError] = useState("")
  const [fleurieInvitationVariant, setFleurieInvitationVariant] = useState("asymmetric")
  const data = useMemo(() => ({ ...getDianaStationeryData(project, weddingWebsiteUrl), websiteDisplayUrl }), [project, weddingWebsiteUrl, websiteDisplayUrl])

  async function download(kind) {
    setExportError("")
    if (kind === "qr" && !qrDataUrl) {
      setExportError("QR kód sa ešte pripravuje. Skúste to o chvíľu znova.")
      return
    }
    setExporting(kind)
    try {
      const node = kind === "invitation" ? invitationRef.current : kind === "reception" ? receptionRef.current : qrRef.current
      const invitationSuffix = variant === "fleurie" ? (fleurieInvitationVariant === "frame" ? "pozvanka-lucny-ramik" : "pozvanka-asymetricka") : "pozvanka"
      const filenameKind = kind === "invitation" ? invitationSuffix : kind === "reception" ? "svadobny-stol" : "qr-karticka"
      const titleKind = kind === "invitation" ? "Svadobná pozvánka" : kind === "reception" ? "Kartička k svadobnému stolu" : "QR kartička"
      await downloadStationeryPdf(node, {
        filename: `${variant}-${filenameKind}-${project?.slug || "svadba"}.pdf`,
        title: `${titleKind} ${config.name}`,
        requireImage: kind === "qr",
        ...(variant === "riviera" ? { fontEmbedCSS: await getRivieraPrintFontCSS() } : {}),
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
        <h2 style={{ ...titleStyle, color: config.ink, fontFamily: config.fontFamily }}>Pozvánka a svadobné kartičky</h2>
        <p style={{ ...copyStyle, color: config.ink }}>Pozvánka, QR kartička, kartička k svadobnému stolu aj web používajú rovnaké písmo, farby a vizuálny motív.</p>
      </div>
      {variant === "fleurie" ? (
        <div style={fleurieVariantPickerStyle} aria-labelledby="fleurie-invitation-picker-title">
          <div style={fleurieVariantHeadingStyle}>
            <p style={fleurieVariantEyebrowStyle}>Pozvánka · 2 dizajnové varianty</p>
            <h3 id="fleurie-invitation-picker-title" style={fleurieVariantTitleStyle}>Vyberte si vzhľad pozvánky</h3>
            <p style={fleurieVariantCopyStyle}>Oba varianty sú súčasťou šablóny Fleurie. Pred stiahnutím ich môžete ľubovoľne prepínať.</p>
          </div>
          <div role="radiogroup" aria-label="Vzhľad pozvánky" style={fleurieVariantCardsStyle}>
            <FleurieVariantOption
              value="asymmetric"
              title="Asymetrické kvety"
              selected={fleurieInvitationVariant === "asymmetric"}
              onSelect={setFleurieInvitationVariant}
            />
            <FleurieVariantOption
              value="frame"
              title="Kvetinový rámik"
              selected={fleurieInvitationVariant === "frame"}
              onSelect={setFleurieInvitationVariant}
            />
          </div>
        </div>
      ) : null}
      <div style={{ ...stageStyle, background: config.paper }}>
        <Invitation ref={invitationRef} data={data} config={config} variant={variant} invitationVariant={fleurieInvitationVariant} />
        <AlternativeReceptionCardPrintTemplate ref={receptionRef} data={data} config={config} variant={variant} />
        <AlternativeQrCardPrintTemplate ref={qrRef} data={data} config={config} variant={variant} qrDataUrl={qrDataUrl} />
      </div>
      {qrError || exportError ? <p role="alert" style={errorStyle}>{qrError || exportError}</p> : null}
      <div style={actionsStyle}>
        <button type="button" disabled={Boolean(exporting)} onClick={() => download("invitation")}>{exporting === "invitation" ? "Pripravujem PDF..." : "Stiahnuť pozvánku"}</button>
        <button type="button" disabled={Boolean(exporting)} onClick={() => download("reception")}>{exporting === "reception" ? "Pripravujem PDF..." : "Stiahnuť kartičku k stolu"}</button>
        <button type="button" disabled={Boolean(exporting) || !weddingWebsiteUrl || !qrDataUrl} onClick={() => download("qr")}>{exporting === "qr" ? "Pripravujem PDF..." : !qrDataUrl && weddingWebsiteUrl ? "Pripravujem QR kód..." : "Stiahnuť QR kartičku"}</button>
      </div>
    </section>
  )
}

function FleurieVariantOption({ value, title, selected, onSelect }) {
  const isFrame = value === "frame"

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(value)}
      style={{ ...fleurieVariantCardStyle, ...(selected ? fleurieVariantCardActiveStyle : {}) }}
    >
      <span style={fleurieVariantThumbnailStyle} aria-hidden="true">
        {isFrame ? (
          <Image src={FLEURIE_INVITATION_FRAME} alt="" width={1060} height={1484} unoptimized style={fleurieVariantFrameThumbnailStyle} />
        ) : (
          <>
            <Image src={FLEURIE_INVITATION_POPPY} alt="" width={1536} height={1024} unoptimized style={fleurieVariantPoppyThumbnailStyle} />
            <Image src={FLEURIE_INVITATION_BOUQUET} alt="" width={1289} height={1220} unoptimized style={fleurieVariantBouquetThumbnailStyle} />
            <span style={fleurieVariantThumbnailNamesStyle}>Ema<br /><i>&amp;</i><br />Juraj</span>
          </>
        )}
      </span>
      <span style={fleurieVariantCardCopyStyle}>
        <strong style={fleurieVariantCardTitleStyle}>{title}</strong>
        <span style={{ ...fleurieVariantCardStatusStyle, ...(selected ? fleurieVariantCardStatusActiveStyle : {}) }}>
          {selected ? <><span aria-hidden="true">✓</span> Vybrané</> : "Vybrať"}
        </span>
      </span>
    </button>
  )
}

function LavandeBotanicalDetail({ size }) {
  const reception = size === "reception"
  return (
    <span aria-hidden="true" style={{ ...lavandeInvitationBotanicalFrameStyle, width: reception ? "100px" : "78px", height: reception ? "145px" : "105px", background: "none" }}>
      <Image src="/templates/lavande/hero-olive-corner.png" alt="" width={1672} height={941} unoptimized data-pdf-overlay-image="true" style={{ ...lavandeInvitationOliveStyle, width: reception ? "340px" : "270px", height: reception ? "191px" : "152px", bottom: "-12px", right: "-12px", opacity: .8 }} />
      <Image src={LAVANDE_BOTANICAL} alt="" width={1672} height={941} unoptimized data-pdf-overlay-image="true" style={{ ...lavandeInvitationMeadowStyle, width: reception ? "380px" : "300px", height: reception ? "214px" : "169px", bottom: "-8px", right: "-15px", opacity: .85 }} />
    </span>
  )
}

const Invitation = forwardRef(function Invitation({ data, config, variant, invitationVariant = "asymmetric" }, ref) {
  if (variant === "riviera") return <RivieraInvitation ref={ref} data={data} config={config} />
  if (variant === "veno") return <VenoInvitation ref={ref} data={data} config={config} />
  if (variant === "lavande") {
    return (
      <article ref={ref} style={{ ...cardStyle, ...lavandeInvitationStyle, color: config.ink, fontFamily: config.fontFamily }} aria-label="Lavande pozvánka">
        <span style={lavandeInvitationWashStyle} aria-hidden="true" />
        <span style={lavandeInvitationBotanicalFrameStyle} aria-hidden="true">
          <Image src="/templates/lavande/hero-olive-corner.png" alt="" width={1672} height={941} unoptimized data-pdf-overlay-image="true" style={lavandeInvitationOliveStyle} />
          <Image src={LAVANDE_BOTANICAL} alt="" width={1672} height={941} unoptimized data-pdf-overlay-image="true" style={lavandeInvitationMeadowStyle} />
        </span>
        <div style={lavandeInvitationContentStyle}>
          <p style={{ ...smallStyle, color: config.accent }}>Budeme sa brať</p>
          <h3 style={lavandeInvitationNamesStyle}>
            <span>{data.firstPartner}</span>
            <i data-pdf-text-overlay="true" style={{ ...lavandeInvitationAmpersandStyle, color: config.accent }}>&amp;</i>
            <span>{data.secondPartner}</span>
          </h3>
          <p style={lavandeInvitationTextStyle}>{data.invitationText}</p>
          <span style={{ ...lavandeInvitationDividerStyle, background: config.accent }} aria-hidden="true" />
          <p style={lavandeInvitationDateStyle}>{data.displayDate}</p>
          <p style={lavandeInvitationDetailStyle}>{data.timeLine}<br />{data.ceremonyVenue}<br />{data.ceremonyCity}</p>
        </div>
      </article>
    )
  }

  if (variant === "provence") {
    return (
      <article ref={ref} style={{ ...cardStyle, ...provenceInvitationStyle, color: config.ink, backgroundColor: config.paper, backgroundImage: `url(${PROVENCE_PAPER})`, fontFamily: config.fontFamily }} aria-label="Provence pozvánka">
        <Image src={PROVENCE_LAVENDER} alt="" width={1024} height={1536} unoptimized data-pdf-overlay-image="true" style={provenceInvitationBotanicalStyle} />
        <span style={{ ...provenceInvitationCornerLineStyle, borderColor: config.accent }} aria-hidden="true" />
        <p style={{ ...provenceInvitationVerticalDateStyle, color: config.accent }}>{data.displayDate}</p>
        <div style={provenceInvitationContentStyle}>
          <p style={{ ...smallStyle, color: config.accent }}>S radosťou vás pozývame</p>
          <h3 style={provenceInvitationNamesStyle}>
            <span>{data.firstPartner}</span>
            <i data-pdf-text-overlay="true" style={{ ...provenceInvitationAmpersandStyle, color: config.accent }}>&amp;</i>
            <span>{data.secondPartner}</span>
          </h3>
          <span style={{ ...provenceInvitationDividerStyle, background: config.accent }} aria-hidden="true" />
          <p style={provenceInvitationDetailStyle}>{data.timeLine}<br />{data.ceremonyVenue}<br />{data.ceremonyCity}</p>
          <p style={{ ...provenceInvitationClosingStyle, color: config.accent }}>Un jour en Provence</p>
        </div>
      </article>
    )
  }

  if (variant === "fleurie") {
    if (invitationVariant === "frame") {
      return (
        <article ref={ref} style={{ ...cardStyle, ...fleurieInvitationStyle, color: config.ink, background: config.paper, fontFamily: config.fontFamily }} aria-label="Fleurie pozvánka s lúčnym rámikom">
          <Image src={FLEURIE_INVITATION_FRAME} alt="" width={1060} height={1484} unoptimized data-pdf-overlay-image="true" style={fleurieInvitationFrameStyle} />
          <div style={fleurieFrameContentStyle}>
            <p style={{ ...fleurieFrameInitialsStyle, color: config.accent }}>{data.initials}</p>
            <p style={{ ...smallStyle, ...fleurieFrameInvitationStyle, color: config.accent }}>S radosťou vás pozývame na našu svadbu</p>
            <h3 style={fleurieFrameNamesStyle}>
              <span>{data.firstPartner}</span>
              <i data-pdf-text-overlay="true" style={{ ...fleurieFrameAmpersandStyle, color: config.accent }}>&amp;</i>
              <span>{data.secondPartner}</span>
            </h3>
            <span style={{ ...fleurieFrameDividerStyle, background: config.accent }} />
            <p style={fleurieFrameDateStyle}>{data.displayDate}</p>
            <p style={fleurieFrameDetailStyle}>{data.timeLine}<br />{data.ceremonyVenue}<br />{data.ceremonyCity}</p>
          </div>
        </article>
      )
    }

    return (
      <article ref={ref} style={{ ...cardStyle, ...fleurieInvitationStyle, color: config.ink, background: config.paper, fontFamily: config.fontFamily }} aria-label="Fleurie pozvánka">
        <Image src={FLEURIE_INVITATION_POPPY} alt="" width={1536} height={1024} unoptimized data-pdf-overlay-image="true" style={fleurieInvitationPoppyStyle} />
        <Image src={FLEURIE_INVITATION_BOUQUET} alt="" width={1289} height={1220} unoptimized data-pdf-overlay-image="true" style={fleurieInvitationBouquetStyle} />
        <div style={fleurieInvitationContentStyle}>
          <p style={{ ...smallStyle, color: config.accent }}>Save the date</p>
          <h3 style={fleurieNamesStyle}>
            <span>{data.firstPartner}</span>
            <i data-pdf-text-overlay="true" style={{ ...fleurieAmpersandStyle, color: config.accent }}>&amp;</i>
            <span>{data.secondPartner}</span>
          </h3>
          <div style={fleurieInvitationDetailsStyle}>
            <span style={{ ...fleurieDividerLineStyle, background: config.accent }} />
            <p style={fleurieDateStyle}>{data.displayDate}</p>
            <p style={fleurieDetailStyle}>{data.timeLine}<br />{data.ceremonyVenue}<br />{data.ceremonyCity}</p>
          </div>
        </div>
      </article>
    )
  }

  if (variant === "penelope") {
    return (
      <article ref={ref} style={{ ...cardStyle, ...penelopeInvitationStyle, color: config.ink, backgroundColor: config.paper, backgroundImage: `url(${PENELOPE_BACKGROUND})`, fontFamily: config.fontFamily }} aria-label={`${config.name} pozvánka`}>
        <PenelopeOpenFrame color={config.accent} />
        <Image src={PENELOPE_FLOWER_TOP} alt="" width={1400} height={933} unoptimized data-pdf-overlay-image="true" style={penelopeInvitationFlowerTopStyle} />
        <Image src={PENELOPE_FLOWER_BOTTOM} alt="" width={760} height={643} unoptimized data-pdf-overlay-image="true" style={penelopeInvitationFlowerBottomStyle} />
        <div style={penelopeInvitationContentStyle}>
          <p style={{ ...smallStyle, color: config.accent }}>S radosťou vás pozývame</p>
          <h3 style={{ ...penelopeNamesStyle, ...(config.fontVariant === "editorial" ? penelopeEditorialNamesStyle : {}) }}>
            <span>{data.firstPartner}</span>
            <i data-pdf-text-overlay="true" style={{ ...penelopeAmpersandStyle, color: config.accent }}>&amp;</i>
            <span>{data.secondPartner}</span>
          </h3>
          <span style={{ ...penelopeDividerStyle, background: config.accent }} />
          <p style={penelopeDateStyle}>{data.displayDate}</p>
          <p style={penelopeDetailStyle}>{data.timeLine}<br />{data.ceremonyVenue}<br />{data.ceremonyCity}</p>
          <p style={{ ...penelopeClosingStyle, color: config.accent }}>Tešíme sa na spoločný deň</p>
        </div>
      </article>
    )
  }

  if (variant === "botanique") {
    return (
      <article ref={ref} style={{ ...cardStyle, isolation: "isolate", background: "#fff", color: config.ink, fontFamily: config.fontFamily }} aria-label="Botanique pozvánka">
        <BotaniqueFoliage />
        <div style={botaniqueInvitationContentStyle}>
          <p style={{ ...smallStyle, maxWidth: "180px", lineHeight: 1.9, color: config.accent }}>S radosťou vás pozývame<br />na našu svadbu</p>
          <h3 style={{ ...botaniqueInvitationNamesStyle, fontFamily: config.fontFamily }}>
            <span>{data.firstPartner}</span>
            <i data-pdf-text-overlay="true" style={botaniqueInvitationJoinerStyle}>a</i>
            <span>{data.secondPartner}</span>
          </h3>
          <p style={botaniqueInvitationDateStyle}>{data.displayDate}</p>
          <span style={botaniqueFineRuleStyle} aria-hidden="true" />
          <p style={botaniqueInvitationDetailsStyle}>{data.timeLine}<br />{data.ceremonyVenue}<br />{data.ceremonyCity}</p>
          <p style={{ ...smallStyle, marginTop: "18px", maxWidth: "190px", lineHeight: 1.8, fontSize: "7px", color: config.accent }}>Tešíme sa, že náš deň<br />oslávite s nami</p>
        </div>
      </article>
    )
  }

  return (
    <article ref={ref} style={{ ...cardStyle, color: config.ink, background: config.paper, fontFamily: config.fontFamily }} aria-label={`${config.name} pozvánka`}>
      <div style={{ ...frameStyle, borderColor: config.accent }} />
      <Image src={config.ornament} alt="" width={180} height={180} unoptimized data-pdf-overlay-image="true" style={{ ...ornamentStyle, ...(variant === "penelope" ? penelopeOrnamentStyle : botaniqueOrnamentStyle) }} />
      <div style={invitationContentStyle}>
        <p style={{ ...smallStyle, color: config.accent }}>S radosťou vás pozývame</p>
        <div style={{ ...namePlateStyle, color: config.paper, background: config.ink }}>
          <h3 style={{ ...namesStyle, ...(config.fontVariant === "editorial" ? editorialNamesStyle : {}) }}>{data.firstPartner}<i data-pdf-text-overlay="true" style={{ ...ampersandStyle, ...invitationAmpersandStyle, fontFamily: config.fontFamily }}>&amp;</i>{data.secondPartner}</h3>
        </div>
        <p style={dateStyle}>{data.displayDate}</p>
        <p style={detailStyle}>{data.timeLine}<br />{data.ceremonyVenue}<br />{data.ceremonyCity}</p>
      </div>
    </article>
  )
})

export const AlternativeReceptionCardPrintTemplate = forwardRef(function AlternativeReceptionCardPrintTemplate({ data, config, variant }, ref) {
  if (variant === "riviera") return <RivieraReceptionCard ref={ref} data={data} config={config} />
  if (variant === "veno") return <VenoReceptionCard ref={ref} data={data} config={config} />
  if (variant === "lavande") {
    return (
      <article ref={ref} style={{ ...receptionCardStyle, ...lavandeReceptionCardStyle, fontFamily: config.fontFamily }} aria-label="Lavande kartička k svadobnému stolu">
        <span style={lavandeReceptionMedallionStyle} aria-hidden="true" />
        <LavandeBotanicalDetail size="reception" />
        <div style={lavandeReceptionContentStyle}>
          <p style={{ ...smallStyle, color: "#8d7b9d" }}>Pri spoločnom stole</p>
          <p style={lavandeReceptionTextStyle}>S radosťou Vás pozývame<br />k svadobnému stolu.</p>
          <span style={{ ...lavandeReceptionDividerStyle, background: "#8d7b9d" }} aria-hidden="true" />
          <p style={receptionDateStyle}>{data.displayDate}</p>
        </div>
      </article>
    )
  }

  if (variant === "provence") {
    return (
      <article ref={ref} style={{ ...receptionCardStyle, ...provenceReceptionCardStyle, color: config.ink, backgroundColor: config.paper, backgroundImage: `url(${PROVENCE_PAPER})`, fontFamily: config.fontFamily }} aria-label="Provence kartička k svadobnému stolu">
        <div style={provenceReceptionBandStyle}>
          <p style={provenceReceptionBandTextStyle}>À table</p>
        </div>
        <div style={provenceReceptionContentStyle}>
          <p style={{ ...smallStyle, color: config.accent }}>Svadobná hostina</p>
          <p style={provenceReceptionTextStyle}>S radosťou Vás pozývame<br />k svadobnému stolu.</p>
          <span style={{ ...provenceReceptionDividerStyle, background: config.accent }} aria-hidden="true" />
          <p style={receptionDateStyle}>{data.displayDate}</p>
        </div>
      </article>
    )
  }

  if (variant === "fleurie") {
    return (
      <article ref={ref} style={{ ...receptionCardStyle, ...fleurieReceptionCardStyle, color: config.ink, background: config.paper, fontFamily: config.fontFamily }} aria-label="Fleurie kartička k svadobnému stolu">
        <Image src={FLEURIE_HERO_MEADOW} alt="" width={1922} height={818} unoptimized data-pdf-overlay-image="true" style={fleurieReceptionMeadowStyle} />
        <div style={{ ...receptionContentStyle, ...fleurieReceptionContentStyle }}>
          <p style={{ ...smallStyle, color: config.accent }}>Svadobná hostina</p>
          <p style={fleurieReceptionTextStyle}>S radosťou Vás pozývame<br />k svadobnému stolu.</p>
        </div>
      </article>
    )
  }

  if (variant === "penelope") {
    return (
      <article ref={ref} style={{ ...receptionCardStyle, ...penelopeReceptionCardStyle, color: config.ink, backgroundColor: config.paper, backgroundImage: `url(${PENELOPE_BACKGROUND})`, fontFamily: config.fontFamily }} aria-label="Penelope kartička k svadobnému stolu">
        <PenelopeOpenFrame color={config.accent} compact />
        <Image src={PENELOPE_FLOWER_TOP} alt="" width={1400} height={933} unoptimized data-pdf-overlay-image="true" style={penelopeReceptionFlowerTopStyle} />
        <Image src={PENELOPE_FLOWER_BOTTOM} alt="" width={760} height={643} unoptimized data-pdf-overlay-image="true" style={penelopeReceptionFlowerBottomStyle} />
        <div style={{ ...receptionContentStyle, ...penelopeReceptionContentStyle }}>
          <p style={{ ...smallStyle, color: config.accent }}>Svadobná hostina</p>
          <p style={penelopeReceptionTextStyle}>S radosťou Vás pozývame<br />k svadobnému stolu.</p>
          <p style={{ ...receptionNamesStyle, ...penelopeReceptionNamesStyle }}>{data.firstPartner} <i data-pdf-text-overlay="true" style={{ ...receptionAmpersandStyle, color: config.accent }}>&amp;</i> {data.secondPartner}</p>
          <p style={receptionDateStyle}>{data.displayDate}</p>
        </div>
      </article>
    )
  }

  return (
    <article ref={ref} style={{ ...receptionCardStyle, isolation: "isolate", color: config.ink, background: config.paper, fontFamily: config.fontFamily }} aria-label="Botanique kartička k svadobnému stolu">
      <BotaniqueFoliage compact />
      <div style={receptionContentStyle}>
        <p style={{ ...smallStyle, color: config.accent }}>Svadobná hostina</p>
        <p style={botaniqueReceptionTextStyle}>S radosťou Vás pozývame<br />k svadobnému stolu.</p>
        <span style={{ ...receptionDividerStyle, background: config.accent }} />
        <p style={receptionNamesStyle}>{data.firstPartner} <i style={receptionAmpersandStyle}>&amp;</i> {data.secondPartner}</p>
        <p style={receptionDateStyle}>{data.displayDate}</p>
      </div>
    </article>
  )
})

export const AlternativeQrCardPrintTemplate = forwardRef(function AlternativeQrCardPrintTemplate({ data, config, variant, qrDataUrl, recipient = null }, ref) {
  if (variant === "riviera") return <RivieraQrCard ref={ref} data={data} config={config} qrDataUrl={qrDataUrl} recipient={recipient} />
  if (variant === "veno") return <VenoQrCard ref={ref} data={data} config={config} qrDataUrl={qrDataUrl} recipient={recipient} />
  if (variant === "lavande") {
    return (
      <article ref={ref} style={{ ...qrCardStyle, ...lavandeQrCardStyle, color: config.ink, fontFamily: config.fontFamily }} aria-label="Lavande QR kartička">
        <span style={lavandeQrPanelStyle} aria-hidden="true" />
        <LavandeBotanicalDetail size="qr" />
        <div style={lavandeQrContentStyle}>
          <p style={{ ...smallStyle, color: config.accent }}>Všetko o našej svadbe</p>
          <h3 style={lavandeQrNamesStyle}>
            <span>{data.firstPartner}</span>
            <i data-pdf-text-overlay="true" style={{ ...lavandeQrAmpersandStyle, color: config.accent }}>&amp;</i>
            <span>{data.secondPartner}</span>
          </h3>
          <span style={{ ...lavandeQrDividerStyle, background: config.accent }} aria-hidden="true" />
          <div style={lavandeQrImageFrameStyle}>
            {qrDataUrl ? <Image src={qrDataUrl} alt="QR kód svadobného webu" width={126} height={126} unoptimized data-pdf-required-image="true" style={qrImageStyle} /> : <div style={qrPlaceholderStyle}>QR</div>}
          </div>
          <p style={{ ...qrTextStyle, ...lavandeQrTextStyle, ...(recipient ? personalizedQrTextStyle : {}) }}>
            {recipient ? <>{recipient.salutation || recipient.recipient_label},<br />všetky informácie o svadbe nájdete po naskenovaní QR kódu.</> : <>Naskenujte QR kód<br />a potvrďte svoju účasť.</>}
          </p>
          <p style={{ ...urlStyle, color: config.accent }}>{data.websiteDisplayUrl}</p>
        </div>
      </article>
    )
  }

  if (variant === "provence") {
    return (
      <article ref={ref} style={{ ...qrCardStyle, ...provenceQrCardStyle, color: config.ink, backgroundColor: config.paper, backgroundImage: `url(${PROVENCE_PAPER})`, fontFamily: config.fontFamily }} aria-label="Provence QR kartička">
        <Image src={PROVENCE_LAVENDER} alt="" width={1024} height={1536} unoptimized data-pdf-overlay-image="true" style={provenceQrLavenderStyle} />
        <div style={provenceQrContentStyle}>
          <p style={{ ...smallStyle, color: config.accent }}>Všetko o našej svadbe</p>
          <h3 style={provenceQrNamesStyle}>{data.firstPartner} <i data-pdf-text-overlay="true" style={{ ...provenceQrAmpersandStyle, color: config.accent }}>&amp;</i> {data.secondPartner}</h3>
          <span style={{ ...provenceQrDividerStyle, background: config.accent }} aria-hidden="true" />
          <div style={provenceQrImageFrameStyle}>
            {qrDataUrl ? <Image src={qrDataUrl} alt="QR kód svadobného webu" width={126} height={126} unoptimized data-pdf-required-image="true" style={qrImageStyle} /> : <div style={qrPlaceholderStyle}>QR</div>}
          </div>
          <p style={{ ...qrTextStyle, ...provenceQrTextStyle, ...(recipient ? personalizedQrTextStyle : {}) }}>
            {recipient ? <>{recipient.salutation || recipient.recipient_label},<br />všetky informácie o svadbe nájdete po naskenovaní QR kódu.</> : <>Naskenujte QR kód<br />a potvrďte svoju účasť.</>}
          </p>
          <p style={{ ...urlStyle, color: config.accent }}>{data.websiteDisplayUrl}</p>
        </div>
      </article>
    )
  }

  if (variant === "fleurie") {
    return (
      <article ref={ref} style={{ ...qrCardStyle, ...fleurieQrCardStyle, color: config.ink, background: config.paper, fontFamily: config.fontFamily }} aria-label="Fleurie QR kartička">
        <Image src={FLEURIE_QR_YELLOW_FLOWERS} alt="" width={2172} height={724} unoptimized data-pdf-overlay-image="true" style={fleurieQrYellowFlowersStyle} />
        <div style={fleurieQrContentStyle}>
          <p style={{ ...smallStyle, color: config.accent }}>Všetko o našej svadbe</p>
          <h3 style={fleurieQrNamesStyle}>{data.firstPartner} <i data-pdf-text-overlay="true" style={{ ...fleurieQrAmpersandStyle, color: config.accent }}>&amp;</i> {data.secondPartner}</h3>
          <span style={{ ...fleurieQrDividerStyle, background: config.accent }} aria-hidden="true" />
          <div style={fleurieQrImageFrameStyle}>
            {qrDataUrl ? <Image src={qrDataUrl} alt="QR kód svadobného webu" width={126} height={126} unoptimized data-pdf-required-image="true" style={qrImageStyle} /> : <div style={qrPlaceholderStyle}>QR</div>}
          </div>
          <p style={{ ...qrTextStyle, ...fleurieQrTextStyle, ...(recipient ? personalizedQrTextStyle : {}) }}>
            {recipient ? <>{recipient.salutation || recipient.recipient_label},<br />všetky informácie o svadbe nájdete po naskenovaní QR kódu.</> : <>Naskenujte QR kód<br />a potvrďte svoju účasť.</>}
          </p>
          <p style={{ ...urlStyle, color: config.accent }}>{data.websiteDisplayUrl}</p>
        </div>
      </article>
    )
  }

  if (variant === "penelope") {
    return (
      <article ref={ref} style={{ ...qrCardStyle, ...penelopeQrCardStyle, color: config.ink, backgroundColor: config.paper, backgroundImage: `url(${PENELOPE_BACKGROUND})`, fontFamily: config.fontFamily }} aria-label={`${config.name} QR kartička`}>
        <PenelopeOpenFrame color={config.accent} compact />
        <Image src={PENELOPE_FLOWER_TOP} alt="" width={1400} height={933} unoptimized data-pdf-overlay-image="true" style={penelopeQrFlowerTopStyle} />
        <Image src={PENELOPE_FLOWER_BOTTOM} alt="" width={760} height={643} unoptimized data-pdf-overlay-image="true" style={penelopeQrFlowerBottomStyle} />
        <div style={penelopeQrContentStyle}>
          <p style={{ ...smallStyle, color: config.accent }}>Všetko o našej svadbe</p>
          <h3 style={penelopeQrNamesStyle}>
            <span>{data.firstPartner}</span>
            <i data-pdf-text-overlay="true" style={{ ...penelopeQrAmpersandStyle, color: config.accent }}>&amp;</i>
            <span>{data.secondPartner}</span>
          </h3>
          <span style={{ ...penelopeQrDividerStyle, background: config.accent }} />
          <div style={penelopeQrImageFrameStyle}>
            {qrDataUrl ? <Image src={qrDataUrl} alt="QR kód svadobného webu" width={126} height={126} unoptimized data-pdf-required-image="true" style={qrImageStyle} /> : <div style={qrPlaceholderStyle}>QR</div>}
          </div>
          <p style={{ ...qrTextStyle, ...penelopeQrTextStyle, ...(recipient ? personalizedQrTextStyle : {}) }}>
            {recipient ? <>{recipient.salutation || recipient.recipient_label},<br />všetky informácie o svadbe nájdete po naskenovaní QR kódu.</> : <>Naskenujte QR kód<br />a potvrďte svoju účasť.</>}
          </p>
          <p style={{ ...urlStyle, color: config.accent }}>{data.websiteDisplayUrl}</p>
        </div>
      </article>
    )
  }

  return (
    <article ref={ref} style={{ ...qrCardStyle, color: config.ink, background: config.paper, fontFamily: config.fontFamily }} aria-label={`${config.name} QR kartička`}>
      <BotaniqueFoliage compact />
      <p style={{ ...smallStyle, color: config.accent }}>Všetko o našej svadbe</p>
      <div style={{ ...qrNamePlateStyle, position: "relative", zIndex: 2, color: config.ink, background: "transparent" }}><h3 style={qrNamesStyle}>{data.firstPartner} <i data-pdf-text-overlay="true" style={{ ...ampersandStyle, fontFamily: config.fontFamily }}>&amp;</i> {data.secondPartner}</h3></div>
      {qrDataUrl ? <Image src={qrDataUrl} alt="QR kód svadobného webu" width={126} height={126} unoptimized data-pdf-required-image="true" style={qrImageStyle} /> : <div style={qrPlaceholderStyle}>QR</div>}
      <p style={{ ...qrTextStyle, ...(recipient ? personalizedQrTextStyle : {}) }}>
        {recipient ? <>{recipient.salutation || recipient.recipient_label},<br />všetky informácie o svadbe nájdete po naskenovaní QR kódu.</> : <>Naskenujte QR kód<br />a potvrďte svoju účasť.</>}
      </p>
      <p style={{ ...urlStyle, color: config.accent }}>{data.websiteDisplayUrl}</p>
    </article>
  )
})

export function getAlternativeStationeryConfig(variant, project) {
  const customization = getDesignCustomization(variant, project)
  return {
    ...(ALTERNATIVE_STATIONERY_CONFIG[variant] || ALTERNATIVE_STATIONERY_CONFIG.botanique),
    ink: customization.color.hex,
    fontFamily: customization.font.family,
    fontVariant: customization.font.value,
  }
}

function PenelopeOpenFrame({ color, compact = false }) {
  const topWidth = compact ? "62%" : "66%"
  const bottomWidth = compact ? "66%" : "68%"
  const sideHeight = compact ? "75%" : "74%"

  return (
    <div style={compact ? penelopeQrFrameStyle : penelopeFrameStyle} aria-hidden="true">
      <span style={{ ...penelopeFrameLineStyle, top: 0, left: 0, width: topWidth, height: "1px", background: color }} />
      <span style={{ ...penelopeFrameLineStyle, right: 0, bottom: 0, width: "1px", height: sideHeight, background: color }} />
      <span style={{ ...penelopeFrameLineStyle, right: 0, bottom: 0, width: bottomWidth, height: "1px", background: color }} />
      <span style={{ ...penelopeFrameLineStyle, top: 0, left: 0, width: "1px", height: sideHeight, background: color }} />
    </div>
  )
}

const sectionStyle = { display: "grid", gap: "22px" }
const introStyle = { display: "grid", gap: "8px" }
const eyebrowStyle = { margin: 0, fontSize: "11px", letterSpacing: ".28em", textTransform: "uppercase" }
const titleStyle = { margin: 0, fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(30px,5vw,44px)", fontWeight: 400 }
const copyStyle = { maxWidth: "660px", margin: 0, fontSize: "16px", lineHeight: 1.7, opacity: .78 }
const stageStyle = { display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(22px,4vw,34px)", flexWrap: "wrap", padding: "clamp(20px,4vw,34px)" }
const cardStyle = { position: "relative", width: "min(392px, 100%)", aspectRatio: "392 / 568", overflow: "hidden", boxShadow: "0 18px 45px rgba(40,30,24,.16)", fontFamily: "'Cormorant Garamond',Georgia,serif" }
const frameStyle = { position: "absolute", inset: "15px", pointerEvents: "none", border: "1px solid", opacity: .45 }
const ornamentStyle = { position: "absolute", zIndex: 1, objectFit: "contain", pointerEvents: "none", opacity: .72 }
const botaniqueOrnamentStyle = { top: "18px", right: "18px", width: "116px", height: "76px", transform: "rotate(4deg)" }
const penelopeOrnamentStyle = { top: "18px", right: "25px", width: "76px", height: "104px", transform: "rotate(9deg)" }
const invitationContentStyle = { position: "absolute", inset: "30px", display: "grid", alignContent: "center", justifyItems: "center", padding: "26px 18px", textAlign: "center" }
const smallStyle = { margin: 0, fontFamily: "Inter,Arial,sans-serif", fontSize: "8px", fontWeight: 600, letterSpacing: ".22em", textTransform: "uppercase" }
const namePlateStyle = { display: "grid", width: "calc(100% + 66px)", minHeight: "172px", margin: "28px 0 30px", padding: "22px", placeItems: "center" }
const namesStyle = { display: "grid", margin: 0, fontSize: "50px", fontWeight: 400, lineHeight: .72 }
const editorialNamesStyle = { lineHeight: .88, rowGap: "4px" }
const ampersandStyle = { fontStyle: "italic", fontWeight: 400 }
const invitationAmpersandStyle = { margin: "8px 0 9px", fontSize: ".56em", lineHeight: 1 }
const dateStyle = { margin: 0, fontSize: "21px", textTransform: "capitalize" }
const detailStyle = { margin: "16px 0 0", fontSize: "14px", lineHeight: 1.55 }
const qrCardStyle = { ...cardStyle, isolation: "isolate", width: "min(300px, 100%)", aspectRatio: "300 / 420", display: "grid", alignContent: "center", justifyItems: "center", padding: "28px", textAlign: "center" }
const qrOrnamentStyle = { position: "absolute", zIndex: 1, objectFit: "contain", pointerEvents: "none", opacity: .64 }
const qrBotaniqueOrnamentStyle = { top: "10px", right: "12px", width: "74px", height: "50px" }
const qrPenelopeOrnamentStyle = { top: "8px", right: "16px", width: "46px", height: "68px", transform: "rotate(8deg)" }
const qrNamePlateStyle = { width: "calc(100% + 24px)", margin: "15px 0 18px", padding: "13px 10px" }
const qrNamesStyle = { margin: 0, fontSize: "27px", fontWeight: 400 }
const qrImageStyle = { width: "126px", height: "126px", padding: "7px", background: "white" }
const qrPlaceholderStyle = { display: "grid", width: "126px", height: "126px", placeItems: "center", background: "white" }
const qrTextStyle = { margin: "16px 0 8px", fontSize: "14px", lineHeight: 1.45 }
const personalizedQrTextStyle = { maxWidth: "220px", margin: "13px 0 7px", fontSize: "12px", lineHeight: 1.35 }
const urlStyle = { maxWidth: "230px", margin: 0, overflow: "hidden", fontFamily: "Inter,Arial,sans-serif", fontSize: "8px", textOverflow: "ellipsis", whiteSpace: "nowrap" }
const actionsStyle = { display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }
const errorStyle = { margin: 0, color: "#9a4d3e", fontSize: "12px", textAlign: "center" }
const fleurieVariantPickerStyle = { display: "grid", gap: "18px", padding: "clamp(20px,3vw,28px)", border: "1px solid rgba(110,68,75,.16)", background: "#fffaf7" }
const fleurieVariantHeadingStyle = { display: "grid", gap: "6px", maxWidth: "720px" }
const fleurieVariantEyebrowStyle = { margin: 0, color: "#c69699", fontFamily: "Inter,Arial,sans-serif", fontSize: "9px", fontWeight: 600, letterSpacing: ".17em", textTransform: "uppercase" }
const fleurieVariantTitleStyle = { margin: 0, color: "#6e444b", fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(25px,3.5vw,34px)", fontWeight: 400 }
const fleurieVariantCopyStyle = { maxWidth: "650px", margin: 0, color: "#7d6868", fontFamily: "Inter,Arial,sans-serif", fontSize: "13px", lineHeight: 1.6 }
const fleurieVariantCardsStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: "14px" }
const fleurieVariantCardStyle = { display: "grid", gridTemplateColumns: "82px minmax(0,1fr)", minHeight: "126px", padding: "12px", alignItems: "center", gap: "16px", border: "1px solid rgba(110,68,75,.2)", borderRadius: 0, color: "#6e444b", background: "rgba(255,255,255,.62)", boxShadow: "0 8px 24px rgba(110,68,75,.04)", textAlign: "left", cursor: "pointer" }
const fleurieVariantCardActiveStyle = { border: "2px solid #6e444b", padding: "11px", background: "#fff", boxShadow: "0 12px 32px rgba(110,68,75,.12)" }
const fleurieVariantThumbnailStyle = { position: "relative", display: "block", width: "82px", aspectRatio: "3 / 4", overflow: "hidden", background: "linear-gradient(145deg,#fffaf6,#fbf3ee)", boxShadow: "0 5px 15px rgba(72,45,49,.12)" }
const fleurieVariantFrameThumbnailStyle = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }
const fleurieVariantPoppyThumbnailStyle = { position: "absolute", top: "-2%", right: "-8%", width: "76%", height: "42%", objectFit: "contain", objectPosition: "right top" }
const fleurieVariantBouquetThumbnailStyle = { position: "absolute", bottom: "-4%", left: "-8%", width: "70%", height: "56%", objectFit: "contain", objectPosition: "left bottom" }
const fleurieVariantThumbnailNamesStyle = { position: "absolute", top: "27%", left: "12%", color: "#6e444b", fontFamily: "'WindSong',cursive", fontSize: "13px", lineHeight: .68, textAlign: "center" }
const fleurieVariantCardCopyStyle = { display: "grid", gap: "10px", minWidth: 0 }
const fleurieVariantCardTitleStyle = { fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "21px", fontWeight: 500, lineHeight: 1.15 }
const fleurieVariantCardStatusStyle = { display: "inline-flex", width: "fit-content", minHeight: "28px", padding: "0 10px", alignItems: "center", gap: "6px", border: "1px solid rgba(110,68,75,.22)", color: "#7d6868", fontFamily: "Inter,Arial,sans-serif", fontSize: "9px", fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }
const fleurieVariantCardStatusActiveStyle = { borderColor: "#6e444b", color: "#fffaf7", background: "#6e444b" }

const receptionCardStyle = { position: "relative", width: "min(320px,100%)", aspectRatio: "320 / 210", overflow: "hidden", boxShadow: "0 18px 45px rgba(40,30,24,.14)", textAlign: "center" }
const receptionFrameStyle = { position: "absolute", inset: "11px", border: "1px solid", opacity: .38 }
const receptionContentStyle = { position: "absolute", zIndex: 3, inset: "24px 34px", display: "grid", alignContent: "center", justifyItems: "center" }
const receptionDividerStyle = { display: "block", width: "38px", height: "1px", margin: "10px 0 8px", opacity: .55 }
const receptionNamesStyle = { margin: 0, fontSize: "15px", fontWeight: 400, whiteSpace: "nowrap" }
const receptionAmpersandStyle = { padding: "0 3px", fontStyle: "italic", fontWeight: 400 }
const receptionDateStyle = { margin: "4px 0 0", fontSize: "10px", opacity: .64, textTransform: "capitalize" }
const botaniqueReceptionTextStyle = { margin: "14px 0 0", fontSize: "25px", fontWeight: 400, lineHeight: 1.08 }
const botaniqueReceptionOrnamentStyle = { position: "absolute", zIndex: 2, top: "20px", right: "20px", width: "68px", height: "46px", objectFit: "contain", opacity: .58, transform: "rotate(7deg)", pointerEvents: "none" }
const penelopeReceptionCardStyle = { backgroundPosition: "center", backgroundSize: "cover" }
const penelopeReceptionContentStyle = { inset: "22px 22px" }
const penelopeReceptionTextStyle = { margin: "13px 0 0", fontSize: "22px", fontStyle: "italic", fontWeight: 400, lineHeight: 1.08, whiteSpace: "nowrap" }
const penelopeReceptionNamesStyle = { marginTop: "10px" }
const penelopeReceptionFlowerTopStyle = { position: "absolute", zIndex: 2, top: "-46px", right: "-66px", width: "174px", height: "116px", objectFit: "contain", opacity: .73, transform: "rotate(3deg)" }
const penelopeReceptionFlowerBottomStyle = { position: "absolute", zIndex: 2, bottom: "-27px", left: "-12px", width: "105px", height: "89px", objectFit: "contain", opacity: .66, transform: "rotate(-5deg)" }

const penelopeInvitationStyle = { backgroundPosition: "center", backgroundSize: "cover" }
const penelopeFrameStyle = {
  position: "absolute",
  zIndex: 1,
  inset: "17px",
  opacity: .34,
  pointerEvents: "none",
}
const penelopeFrameLineStyle = { position: "absolute", display: "block" }
const penelopeInvitationFlowerTopStyle = { position: "absolute", zIndex: 2, top: "-34px", right: "-98px", width: "260px", height: "173px", objectFit: "contain", transform: "rotate(3deg)", opacity: .78, pointerEvents: "none" }
const penelopeInvitationFlowerBottomStyle = { position: "absolute", zIndex: 2, bottom: "-15px", left: "-6px", width: "168px", height: "142px", objectFit: "contain", transform: "rotate(-4deg)", opacity: .72, pointerEvents: "none" }
const penelopeInvitationContentStyle = { position: "absolute", zIndex: 3, inset: "34px", display: "grid", alignContent: "center", justifyItems: "center", padding: "48px 12px 34px", textAlign: "center" }
const penelopeNamesStyle = { display: "grid", margin: "46px 0 25px", fontSize: "62px", fontStyle: "italic", fontWeight: 400, letterSpacing: "-.04em", lineHeight: .66 }
const penelopeEditorialNamesStyle = { fontSize: "54px", lineHeight: .8 }
const penelopeAmpersandStyle = { margin: "10px 0 11px", fontFamily: "'Great Vibes',cursive", fontSize: ".52em", fontStyle: "normal", fontWeight: 400, lineHeight: 1 }
const penelopeDividerStyle = { display: "block", width: "52px", height: "1px", margin: "0 0 22px", opacity: .58 }
const penelopeDateStyle = { margin: 0, fontSize: "20px", fontStyle: "italic", textTransform: "capitalize", whiteSpace: "nowrap" }
const penelopeDetailStyle = { margin: "16px 0 0", fontSize: "14px", lineHeight: 1.55 }
const penelopeClosingStyle = { margin: "30px 0 0", fontFamily: "Inter,Arial,sans-serif", fontSize: "7px", fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase" }

const penelopeQrCardStyle = { aspectRatio: "300 / 470", backgroundPosition: "center", backgroundSize: "cover", padding: 0 }
const penelopeQrFrameStyle = {
  position: "absolute",
  zIndex: 1,
  inset: "13px",
  opacity: .33,
  pointerEvents: "none",
}
const penelopeQrFlowerTopStyle = { position: "absolute", zIndex: 2, top: "-20px", right: "-68px", width: "176px", height: "117px", objectFit: "contain", transform: "rotate(4deg)", opacity: .72, pointerEvents: "none" }
const penelopeQrFlowerBottomStyle = { position: "absolute", zIndex: 2, bottom: "-12px", left: "-6px", width: "130px", height: "110px", objectFit: "contain", opacity: .66, pointerEvents: "none" }
const penelopeQrContentStyle = { position: "absolute", zIndex: 3, inset: "22px", display: "grid", alignContent: "center", justifyItems: "center", padding: "31px 18px 22px", textAlign: "center" }
const penelopeQrNamesStyle = { display: "grid", margin: "17px 0 11px", fontSize: "31px", fontStyle: "italic", fontWeight: 400, letterSpacing: "-.02em", lineHeight: .72 }
const penelopeQrAmpersandStyle = { margin: "5px 0 6px", fontFamily: "'Great Vibes',cursive", fontSize: ".62em", fontStyle: "normal", fontWeight: 400, lineHeight: 1 }
const penelopeQrDividerStyle = { display: "block", width: "42px", height: "1px", margin: "0 0 13px", opacity: .54 }
const penelopeQrImageFrameStyle = { padding: "8px", border: "1px solid rgba(90,63,69,.12)", background: "rgba(255,255,255,.7)", boxShadow: "0 10px 28px rgba(90,63,69,.08)" }
const penelopeQrTextStyle = { marginTop: "13px", fontSize: "13px" }

const fleurieInvitationStyle = {
  backgroundImage: "radial-gradient(circle at 12% 10%, rgba(214,170,176,.2), transparent 34%), linear-gradient(145deg,#fffaf6,#fbf3ee 62%,#f8eae7)",
}
const fleurieInvitationPoppyStyle = { position: "absolute", zIndex: 1, top: "-1%", right: "-5%", width: "76%", height: "43%", objectFit: "contain", objectPosition: "right top", pointerEvents: "none" }
const fleurieInvitationBouquetStyle = { position: "absolute", zIndex: 1, bottom: "-2%", left: "-4%", width: "63%", height: "53%", objectFit: "contain", objectPosition: "left bottom", pointerEvents: "none" }
const fleurieInvitationContentStyle = { position: "absolute", zIndex: 3, inset: 0, display: "grid", alignContent: "start", justifyItems: "start", padding: "48px 34px", textAlign: "left" }
const fleurieNamesStyle = { display: "grid", width: "68%", margin: "54px 0 0", fontFamily: "'WindSong',cursive", fontSize: "64px", fontWeight: 400, letterSpacing: "-.025em", lineHeight: .68 }
const fleurieAmpersandStyle = { margin: "10px 0 12px .7em", fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: ".35em", fontStyle: "normal", fontWeight: 400, lineHeight: 1 }
const fleurieInvitationDetailsStyle = { position: "absolute", right: "30px", bottom: "82px", display: "grid", width: "172px", justifyItems: "end", textAlign: "right" }
const fleurieDividerLineStyle = { display: "block", width: "38px", height: "1px", margin: "0 0 14px", opacity: .65 }
const fleurieDateStyle = { margin: 0, fontSize: "17px", letterSpacing: ".04em", textTransform: "capitalize" }
const fleurieDetailStyle = { maxWidth: "172px", margin: "12px 0 0", fontSize: "11px", lineHeight: 1.45 }
const fleurieInvitationFrameStyle = { position: "absolute", zIndex: 1, inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", opacity: .86 }
const fleurieFrameContentStyle = { position: "absolute", zIndex: 3, inset: "64px 58px", display: "grid", alignContent: "center", justifyItems: "center", textAlign: "center" }
const fleurieFrameInitialsStyle = { margin: "0 0 30px", fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "18px", letterSpacing: ".45em", textTransform: "uppercase" }
const fleurieFrameInvitationStyle = { maxWidth: "190px", lineHeight: 1.65 }
const fleurieFrameNamesStyle = { display: "grid", margin: "24px 0 18px", fontFamily: "'WindSong',cursive", fontSize: "48px", fontWeight: 400, lineHeight: .68 }
const fleurieFrameAmpersandStyle = { margin: "8px 0 10px", fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: ".38em", fontStyle: "normal", lineHeight: 1 }
const fleurieFrameDividerStyle = { display: "block", width: "36px", height: "1px", marginBottom: "15px", opacity: .58 }
const fleurieFrameDateStyle = { margin: 0, fontSize: "16px", letterSpacing: ".05em", textTransform: "capitalize" }
const fleurieFrameDetailStyle = { maxWidth: "190px", margin: "12px 0 0", fontSize: "11px", lineHeight: 1.45 }

const fleurieReceptionCardStyle = { backgroundImage: "linear-gradient(145deg,#fffaf6,#fbf3ee)" }
const fleurieReceptionMeadowStyle = { position: "absolute", zIndex: 1, right: 0, bottom: 0, left: 0, width: "100%", height: "48%", objectFit: "cover", objectPosition: "center bottom", pointerEvents: "none", opacity: .74 }
const fleurieReceptionContentStyle = { zIndex: 3, inset: "20px 30px", alignContent: "start", paddingTop: "12px" }
const fleurieReceptionTextStyle = { margin: "12px 0 0", fontSize: "22px", fontStyle: "italic", fontWeight: 400, lineHeight: 1.08, whiteSpace: "nowrap" }

const fleurieQrCardStyle = { aspectRatio: "300 / 470", padding: 0, backgroundImage: "linear-gradient(145deg,#fffaf6,#fbf3ee)" }
const fleurieQrYellowFlowersStyle = { position: "absolute", zIndex: 1, right: "25%", bottom: "20px", left: "25%", width: "50%", height: "82px", objectFit: "contain", objectPosition: "center bottom", pointerEvents: "none", opacity: .76 }
const fleurieQrContentStyle = { position: "absolute", zIndex: 3, inset: "18px", display: "grid", alignContent: "start", justifyItems: "center", padding: "11px 8px 0", textAlign: "center" }
const fleurieQrNamesStyle = { margin: "10px 0 0", fontFamily: "'WindSong',cursive", fontSize: "28px", fontWeight: 400, lineHeight: 1, whiteSpace: "nowrap" }
const fleurieQrAmpersandStyle = { padding: "0 3px", fontFamily: "inherit", fontSize: ".72em", fontStyle: "normal" }
const fleurieQrDividerStyle = { display: "block", width: "42px", height: "1px", margin: "9px 0 12px", opacity: .58 }
const fleurieQrImageFrameStyle = { padding: "7px", border: "1px solid rgba(110,68,75,.1)", background: "rgba(255,255,255,.94)", boxShadow: "0 9px 26px rgba(110,68,75,.05)" }
const fleurieQrTextStyle = { maxWidth: "220px", marginTop: "13px", padding: "3px 7px", background: "rgba(251,243,238,.9)", fontSize: "12px" }

const lavandeInvitationStyle = { background: "#f8f6f0" }
const lavandeInvitationWashStyle = { position: "absolute", top: "-130px", right: "-130px", width: "340px", height: "290px", borderRadius: "42% 58% 64% 36%", background: "radial-gradient(ellipse at 60% 35%,rgba(166,151,181,.19),rgba(166,151,181,.07) 55%,transparent 73%)", transform: "rotate(-24deg)", pointerEvents: "none" }
const lavandeInvitationBotanicalFrameStyle = { position: "absolute", zIndex: 1, right: 0, bottom: 0, width: "190px", height: "240px", overflow: "hidden", pointerEvents: "none", background: "radial-gradient(ellipse at 100% 100%,rgba(166,151,181,.16),transparent 72%)" }
const lavandeInvitationOliveStyle = { position: "absolute", bottom: "-26px", right: "-20px", width: "580px", maxWidth: "none", height: "326px", objectFit: "contain", transform: "rotate(180deg)", opacity: .86, pointerEvents: "none" }
const lavandeInvitationMeadowStyle = { position: "absolute", bottom: "-12px", right: "-28px", width: "680px", maxWidth: "none", height: "383px", objectFit: "contain", opacity: .92, pointerEvents: "none" }
const lavandeInvitationContentStyle = { position: "absolute", zIndex: 2, inset: "56px 46px 68px", display: "grid", alignContent: "center", justifyItems: "start", textAlign: "left" }
const lavandeInvitationNamesStyle = { display: "grid", justifyItems: "start", maxWidth: "100%", overflowWrap: "anywhere", margin: "36px 0 28px", fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "56px", fontStyle: "normal", fontWeight: 400, letterSpacing: "-.025em", lineHeight: .98 }
const lavandeInvitationAmpersandStyle = { margin: "5px 0", fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: ".52em", fontStyle: "normal", fontWeight: 400, lineHeight: 1 }
const lavandeInvitationTextStyle = { margin: "0 0 24px", whiteSpace: "pre-line", fontSize: "14px", lineHeight: 1.6 }
const lavandeInvitationDividerStyle = { display: "block", width: "36px", height: "1px", marginBottom: "16px", opacity: .5 }
const lavandeInvitationDateStyle = { margin: 0, fontSize: "19px", letterSpacing: ".01em", textTransform: "capitalize" }
const lavandeInvitationDetailStyle = { maxWidth: "245px", margin: "12px 0 0", fontSize: "12px", lineHeight: 1.6 }

const lavandeReceptionCardStyle = { aspectRatio: "360 / 190", width: "min(360px,100%)", color: "#554861", background: "#f8f6f0", textAlign: "left" }
const lavandeReceptionMedallionStyle = { position: "absolute", top: "-80px", right: "-95px", width: "220px", height: "240px", background: "radial-gradient(ellipse,rgba(166,151,181,.15),transparent 70%)", transform: "rotate(-20deg)" }
const lavandeReceptionContentStyle = { position: "absolute", zIndex: 2, inset: "28px 34px", display: "grid", alignContent: "center", justifyItems: "start" }
const lavandeReceptionTextStyle = { margin: "15px 0 0", fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "24px", fontStyle: "normal", fontWeight: 400, lineHeight: 1.2 }
const lavandeReceptionDividerStyle = { display: "block", width: "36px", height: "1px", margin: "14px 0 5px", opacity: .5 }

const lavandeQrCardStyle = { aspectRatio: "300 / 470", padding: 0, background: "#f8f6f0", textAlign: "left" }
const lavandeQrPanelStyle = { position: "absolute", inset: 0, background: "radial-gradient(ellipse at 110% -10%,rgba(166,151,181,.17),transparent 48%)", pointerEvents: "none" }
const lavandeQrContentStyle = { position: "absolute", zIndex: 2, inset: "40px 34px", display: "grid", alignContent: "center", justifyItems: "start" }
const lavandeQrNamesStyle = { display: "flex", flexWrap: "wrap", maxWidth: "100%", margin: "22px 0 0", alignItems: "baseline", gap: "6px", fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "29px", fontStyle: "normal", fontWeight: 400, letterSpacing: "-.025em", lineHeight: 1.15, overflowWrap: "anywhere" }
const lavandeQrAmpersandStyle = { padding: 0, fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: ".82em", fontStyle: "normal", lineHeight: 1 }
const lavandeQrDividerStyle = { display: "block", width: "36px", height: "1px", margin: "18px 0", opacity: .5 }
const lavandeQrImageFrameStyle = { padding: "9px", background: "#fff" }
const lavandeQrTextStyle = { maxWidth: "220px", marginTop: "16px", fontSize: "12px" }

const provenceInvitationStyle = { backgroundPosition: "center", backgroundSize: "cover" }
const provenceInvitationBotanicalStyle = { position: "absolute", zIndex: 1, bottom: "-7%", left: "-22%", width: "62%", height: "65%", objectFit: "contain", objectPosition: "left bottom", filter: "saturate(.76)", opacity: .8, transform: "rotate(-7deg)", pointerEvents: "none" }
const provenceInvitationCornerLineStyle = { position: "absolute", zIndex: 2, top: "28px", left: "27px", width: "42px", height: "92px", borderTop: "1px solid", borderLeft: "1px solid", opacity: .52 }
const provenceInvitationVerticalDateStyle = { position: "absolute", zIndex: 3, top: "40px", left: "34px", margin: 0, fontFamily: "Inter,Arial,sans-serif", fontSize: "7px", fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", writingMode: "vertical-rl" }
const provenceInvitationContentStyle = { position: "absolute", zIndex: 2, inset: 0, display: "grid", alignContent: "center", justifyItems: "start", padding: "52px 24px 44px 142px", textAlign: "left" }
const provenceInvitationNamesStyle = { display: "grid", margin: "38px 0 28px", fontFamily: "'Playfair Display',Georgia,serif", fontSize: "50px", fontStyle: "italic", fontWeight: 400, letterSpacing: "-.055em", lineHeight: .78 }
const provenceInvitationAmpersandStyle = { margin: "8px 0 9px .45em", fontFamily: "'Ms Madi',cursive", fontSize: ".6em", fontStyle: "normal", fontWeight: 400, lineHeight: 1 }
const provenceInvitationDividerStyle = { display: "block", width: "46px", height: "1px", marginBottom: "18px", opacity: .74 }
const provenceInvitationDetailStyle = { maxWidth: "190px", margin: 0, fontSize: "13px", lineHeight: 1.62 }
const provenceInvitationClosingStyle = { margin: "34px 0 0", fontFamily: "'Ms Madi',cursive", fontSize: "22px", lineHeight: 1 }

const provenceReceptionCardStyle = { aspectRatio: "360 / 170", width: "min(360px,100%)", backgroundPosition: "center", backgroundSize: "cover", textAlign: "left" }
const provenceReceptionBandStyle = { position: "absolute", inset: "0 auto 0 0", display: "grid", width: "36%", placeItems: "center", color: "#f3eee4", background: "#68546c" }
const provenceReceptionBandTextStyle = { margin: 0, fontFamily: "'Ms Madi',cursive", fontSize: "34px", transform: "rotate(-7deg)" }
const provenceReceptionContentStyle = { position: "absolute", inset: "20px 22px 20px 42%", display: "grid", alignContent: "center", justifyItems: "start" }
const provenceReceptionTextStyle = { margin: "10px 0 0", fontFamily: "'Playfair Display',Georgia,serif", fontSize: "20px", fontStyle: "italic", fontWeight: 400, lineHeight: 1.12 }
const provenceReceptionDividerStyle = { display: "block", width: "34px", height: "1px", margin: "13px 0 5px", opacity: .6 }

const provenceQrCardStyle = { aspectRatio: "300 / 470", padding: 0, backgroundPosition: "center", backgroundSize: "cover", textAlign: "left" }
const provenceQrLavenderStyle = { position: "absolute", zIndex: 1, bottom: "-30px", left: "-108px", width: "210px", height: "315px", objectFit: "contain", opacity: .74, transform: "rotate(-9deg)", pointerEvents: "none" }
const provenceQrContentStyle = { position: "absolute", zIndex: 2, inset: "28px 24px 24px 78px", display: "grid", alignContent: "start", justifyItems: "start" }
const provenceQrNamesStyle = { maxWidth: "180px", margin: "18px 0 0", fontFamily: "'Playfair Display',Georgia,serif", fontSize: "24px", fontStyle: "italic", fontWeight: 400, letterSpacing: "-.03em", lineHeight: 1.05 }
const provenceQrAmpersandStyle = { padding: "0 4px", fontFamily: "'Ms Madi',cursive", fontSize: "1.05em", fontStyle: "normal" }
const provenceQrDividerStyle = { display: "block", width: "38px", height: "1px", margin: "13px 0 16px", opacity: .65 }
const provenceQrImageFrameStyle = { padding: "7px", border: "1px solid rgba(104,84,108,.16)", background: "rgba(255,255,255,.94)", boxShadow: "0 10px 26px rgba(63,57,56,.06)" }
const provenceQrTextStyle = { maxWidth: "178px", marginTop: "14px", fontSize: "12px", lineHeight: 1.4, textAlign: "left" }

function BotaniqueFoliage({ compact = false }) {
  const common = { position: "absolute", pointerEvents: "none", objectFit: "contain", zIndex: -1, opacity: .74 }
  return <>
    <Image src="/templates/botanique/foliage-top-v3.png" alt="" width={1024} height={1536} unoptimized data-pdf-overlay-image="true" style={{ ...common, top: "2%", left: "2%", width: compact ? "42%" : "52%", height: compact ? "63%" : "70%", objectPosition: "left top" }} />
    <Image src="/templates/botanique/foliage-bottom-v3.png" alt="" width={1296} height={1184} unoptimized data-pdf-overlay-image="true" style={{ ...common, right: "2%", bottom: "2%", width: compact ? "53%" : "65%", height: compact ? "63%" : "60%", objectPosition: "right bottom" }} />
  </>
}
const botaniqueInvitationContentStyle = { position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%", padding: "102px 65px 78px", textAlign: "center" }
const botaniqueInvitationNamesStyle = { display: "grid", justifyItems: "center", width: "100%", gap: "8px", margin: "24px 0 20px", fontSize: "clamp(25px, 4vw, 38px)", fontWeight: 400, lineHeight: 1.12, textTransform: "uppercase", overflowWrap: "anywhere" }
const botaniqueInvitationJoinerStyle = { fontFamily: "'Great Vibes', cursive", fontSize: "29px", fontWeight: 400, fontStyle: "normal", textTransform: "none", lineHeight: 1.2 }
const botaniqueInvitationDateStyle = { margin: 0, fontSize: "17px", letterSpacing: ".05em", lineHeight: 1.5 }
const botaniqueFineRuleStyle = { width: "1px", height: "26px", background: "#a8b29d", margin: "17px 0" }
const botaniqueInvitationDetailsStyle = { margin: 0, maxWidth: "210px", fontSize: "12px", lineHeight: 1.9, overflowWrap: "anywhere" }
