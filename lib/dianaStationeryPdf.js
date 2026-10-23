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

async function downloadComponentPdf(node, { filename, title, requireImage = false }) {
  if (!node) {
    throw new Error("Náhľad pre PDF export nie je pripravený.")
  }

  await waitForRenderedAssets(node, { requireImage })

  const bounds = node.getBoundingClientRect()
  const width = Math.ceil(bounds.width)
  const height = Math.ceil(bounds.height)
  const imageOverlays = getPdfImageOverlays(node, bounds)
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

  const pdf = new jsPDF({
    orientation: height >= width ? "portrait" : "landscape",
    unit: "px",
    format: [width, height],
    hotfixes: ["px_scaling_enabled"],
    compress: true,
  })

  pdf.setProperties({ title })
  pdf.addImage(image, "PNG", 0, 0, width, height, undefined, "FAST")
  imageOverlays.forEach((overlay, index) => {
    pdf.addImage(
      overlay.dataUrl,
      "PNG",
      overlay.x,
      overlay.y,
      overlay.width,
      overlay.height,
      `required-image-${index}`,
      "FAST"
    )
  })
  pdf.save(filename)
}

function getPdfOverlayElements(node) {
  return Array.from(node.querySelectorAll('img[data-pdf-required-image="true"], img[data-pdf-overlay-image="true"]'))
}

function getPdfImageOverlays(node, bounds) {
  return getPdfOverlayElements(node).map((image) => {
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
