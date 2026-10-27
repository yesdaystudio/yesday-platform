"use client"

import { getFontEmbedCSS, toPng } from "html-to-image"
import { jsPDF } from "jspdf"

const PDF_PIXEL_RATIO = 3
const PDF_FONTS = [
  { family: "Cormorant Garamond", weight: 400, style: "normal" },
  { family: "Cormorant Garamond", weight: 400, style: "italic" },
  { family: "Cormorant Garamond", weight: 600, style: "normal" },
  { family: "Playfair Display", weight: 400, style: "normal" },
  { family: "Playfair Display", weight: 400, style: "italic" },
  { family: "Inter", weight: 400, style: "normal" },
  { family: "Inter", weight: 600, style: "normal" },
]
const SLOVAK_FONT_SAMPLE =
  "& áäčďéíĺľňóôŕšťúýž ÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ Spoločne pozývame nášho Božského Ježišovho Piešťany uskutoční Podrobnosti účasti"

export async function downloadDianaInvitationPdf(node, project) {
  await downloadComponentPdf(node, {
    filename: `diana-pozvanka-${project?.slug || "svadba"}.pdf`,
    title: "Svadobná pozvánka Diana",
  })
}

export async function downloadDianaQrCardPdf(node, project) {
  await downloadComponentPdf(node, {
    filename: `diana-qr-karticka-${project?.slug || "svadba"}.pdf`,
    title: "QR kartička Diana",
    requireImage: true,
  })
}

export async function downloadStationeryPdf(node, { filename, title, requireImage = false }) {
  await downloadComponentPdf(node, { filename, title, requireImage })
}

export async function downloadStationeryPdfBundle(nodes, { filename, title, requireImage = false }) {
  const validNodes = nodes.filter(Boolean)
  if (!validNodes.length) throw new Error("Náhľady pre PDF export nie sú pripravené.")

  const pages = []
  for (const node of validNodes) {
    pages.push(await captureComponent(node, { requireImage }))
  }

  const first = pages[0]
  const pdf = createPdf(first.width, first.height)
  pdf.setProperties({ title })
  addCapturedPage(pdf, first, 0)

  pages.slice(1).forEach((page, pageIndex) => {
    pdf.addPage([page.width, page.height], page.height >= page.width ? "portrait" : "landscape")
    addCapturedPage(pdf, page, pageIndex + 1)
  })

  pdf.save(filename)
}

async function downloadComponentPdf(node, { filename, title, requireImage = false }) {
  if (!node) {
    throw new Error("Náhľad pre PDF export nie je pripravený.")
  }

  const page = await captureComponent(node, { requireImage })
  const pdf = createPdf(page.width, page.height)

  pdf.setProperties({ title })
  addCapturedPage(pdf, page, 0)
  pdf.save(filename)
}

async function captureComponent(node, { requireImage = false } = {}) {
  await waitForRenderedAssets(node, { requireImage })

  const bounds = node.getBoundingClientRect()
  const width = Math.ceil(bounds.width)
  const height = Math.ceil(bounds.height)
  const imageOverlays = getPdfImageOverlays(node, bounds)
  const textOverlays = getPdfTextOverlays(node, bounds)
  const overlays = [...imageOverlays, ...textOverlays]
  const fontEmbedCSS = await getFontEmbedCSS(node, {
    preferredFontFormat: "woff2",
  })
  const overlayElements = getPdfOverlayElements(node)
  const originalOpacities = overlayElements.map((element) => element.style.opacity)
  overlayElements.forEach((element) => {
    element.style.opacity = "0"
  })

  let image
  try {
    image = await toPng(node, {
      width,
      height,
      pixelRatio: PDF_PIXEL_RATIO,
      skipAutoScale: true,
      cacheBust: true,
      fontEmbedCSS,
    })
  } finally {
    overlayElements.forEach((element, index) => {
      element.style.opacity = originalOpacities[index]
    })
  }

  return { image, overlays, width, height }
}

function createPdf(width, height) {
  return new jsPDF({
    orientation: height >= width ? "portrait" : "landscape",
    unit: "px",
    format: [width, height],
    hotfixes: ["px_scaling_enabled"],
    compress: true,
  })
}

function addCapturedPage(pdf, page, pageIndex) {
  pdf.addImage(page.image, "PNG", 0, 0, page.width, page.height, `page-${pageIndex}`, "FAST")
  page.overlays.forEach((overlay, index) => {
    pdf.addImage(
      overlay.dataUrl,
      "PNG",
      overlay.x,
      overlay.y,
      overlay.width,
      overlay.height,
      `page-${pageIndex}-overlay-${index}`,
      "FAST"
    )
  })
}

function getPdfOverlayElements(node) {
  return Array.from(
    node.querySelectorAll(
      'img[data-pdf-required-image="true"], img[data-pdf-overlay-image="true"], [data-pdf-text-overlay="true"]'
    )
  )
}

function getPdfImageOverlays(node, bounds) {
  return Array.from(
    node.querySelectorAll('img[data-pdf-required-image="true"], img[data-pdf-overlay-image="true"]')
  ).map((image) => {
    const imageBounds = image.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(image)
    const paddingLeft = Number.parseFloat(computedStyle.paddingLeft) || 0
    const paddingRight = Number.parseFloat(computedStyle.paddingRight) || 0
    const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0
    const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0
    const contentWidth = Math.max(1, image.clientWidth - paddingLeft - paddingRight)
    const contentHeight = Math.max(1, image.clientHeight - paddingTop - paddingBottom)
    const transform = computedStyle.transform
    const matrix = transform && transform !== "none" ? new DOMMatrixReadOnly(transform) : null
    const rotation = matrix ? Math.atan2(matrix.b, matrix.a) : 0
    const opacity = Number.parseFloat(computedStyle.opacity)
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.ceil(imageBounds.width * PDF_PIXEL_RATIO))
    canvas.height = Math.max(1, Math.ceil(imageBounds.height * PDF_PIXEL_RATIO))
    const context = canvas.getContext("2d")

    context.scale(PDF_PIXEL_RATIO, PDF_PIXEL_RATIO)
    context.translate(imageBounds.width / 2, imageBounds.height / 2)
    context.rotate(rotation)
    context.globalAlpha = Number.isFinite(opacity) ? opacity : 1

    const fitScale = Math.min(contentWidth / image.naturalWidth, contentHeight / image.naturalHeight)
    const drawWidth = image.naturalWidth * fitScale
    const drawHeight = image.naturalHeight * fitScale
    context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)

    return {
      dataUrl: canvas.toDataURL("image/png"),
      x: imageBounds.left - bounds.left,
      y: imageBounds.top - bounds.top,
      width: imageBounds.width,
      height: imageBounds.height,
    }
  })
}

function getPdfTextOverlays(node, bounds) {
  return Array.from(node.querySelectorAll('[data-pdf-text-overlay="true"]')).map((element) => {
    const elementBounds = element.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(element)
    const fontSize = Number.parseFloat(computedStyle.fontSize)
    const pixelWidth = Math.max(1, Math.ceil(elementBounds.width * PDF_PIXEL_RATIO))
    const pixelHeight = Math.max(1, Math.ceil(elementBounds.height * PDF_PIXEL_RATIO))
    const canvas = document.createElement("canvas")
    canvas.width = pixelWidth
    canvas.height = pixelHeight

    const context = canvas.getContext("2d")
    context.scale(PDF_PIXEL_RATIO, PDF_PIXEL_RATIO)
    context.font = `${computedStyle.fontStyle} ${computedStyle.fontWeight} ${fontSize}px ${computedStyle.fontFamily}`
    context.fillStyle = computedStyle.color
    context.textAlign = "center"
    context.textBaseline = "alphabetic"

    const text = element.textContent || ""
    const metrics = context.measureText(text)
    const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.75
    const descent = metrics.actualBoundingBoxDescent || fontSize * 0.25
    const baseline = (elementBounds.height + ascent - descent) / 2
    context.fillText(text, elementBounds.width / 2, baseline)

    return {
      dataUrl: canvas.toDataURL("image/png"),
      x: elementBounds.left - bounds.left,
      y: elementBounds.top - bounds.top,
      width: elementBounds.width,
      height: elementBounds.height,
    }
  })
}

async function waitForRenderedAssets(node, { requireImage = false } = {}) {
  if (document.fonts?.load) {
    await Promise.all(
      PDF_FONTS.map((font) =>
        document.fonts.load(`${font.style} ${font.weight} 16px "${font.family}"`, SLOVAK_FONT_SAMPLE)
      )
    )
  }

  if (document.fonts?.ready) {
    await document.fonts.ready
  }

  const images = Array.from(node.querySelectorAll("img"))
  await Promise.all(
    images.map(async (image) => {
      if (!image.complete) {
        await new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true })
          image.addEventListener("error", resolve, { once: true })
        })
      }

      if (typeof image.decode === "function") {
        await image.decode().catch(() => {})
      }
    })
  )

  const requiredImages = images.filter((image) => image.dataset.pdfRequiredImage === "true")
  if (requireImage && (requiredImages.length === 0 || requiredImages.some((image) => !image.complete || image.naturalWidth === 0))) {
    throw new Error("QR kód ešte nie je pripravený na export.")
  }

  const overlayImages = images.filter((image) => image.dataset.pdfOverlayImage === "true")
  if (overlayImages.some((image) => !image.complete || image.naturalWidth === 0)) {
    throw new Error("Dekoratívny prvok ešte nie je pripravený na export.")
  }

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}
