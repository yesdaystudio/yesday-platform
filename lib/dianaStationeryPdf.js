"use client"

import { getFontEmbedCSS, toPng } from "html-to-image"
import { jsPDF } from "jspdf"

const PDF_PIXEL_RATIO = 3
const DIANA_FONT_FAMILY = "Cormorant Garamond"
const SLOVAK_FONT_SAMPLE =
  "áäčďéíĺľňóôŕšťúýž ÁÄČĎÉÍĹĽŇÓÔŔŠŤÚÝŽ Spoločne pozývame nášho Božského Ježišovho Piešťany uskutoční Podrobnosti účasti"

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
  const requiredImageOverlays = getRequiredImageOverlays(node, bounds)
  const fontEmbedCSS = await getFontEmbedCSS(node, {
    preferredFontFormat: "woff2",
  })
  const image = await toPng(node, {
    width,
    height,
    pixelRatio: PDF_PIXEL_RATIO,
    skipAutoScale: true,
    cacheBust: true,
    fontEmbedCSS,
  })

  const pdf = new jsPDF({
    orientation: height >= width ? "portrait" : "landscape",
    unit: "px",
    format: [width, height],
    hotfixes: ["px_scaling_enabled"],
    compress: true,
  })

  pdf.setProperties({ title })
  pdf.addImage(image, "PNG", 0, 0, width, height, undefined, "FAST")
  requiredImageOverlays.forEach((overlay, index) => {
    pdf.addImage(
      overlay.src,
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

function getRequiredImageOverlays(node, bounds) {
  return Array.from(node.querySelectorAll('img[data-pdf-required-image="true"]')).map((image) => {
    const imageBounds = image.getBoundingClientRect()
    const computedStyle = window.getComputedStyle(image)
    const paddingLeft = Number.parseFloat(computedStyle.paddingLeft) || 0
    const paddingRight = Number.parseFloat(computedStyle.paddingRight) || 0
    const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0
    const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0

    return {
      src: image.currentSrc || image.src,
      x: imageBounds.left - bounds.left + paddingLeft,
      y: imageBounds.top - bounds.top + paddingTop,
      width: imageBounds.width - paddingLeft - paddingRight,
      height: imageBounds.height - paddingTop - paddingBottom,
    }
  })
}

async function waitForRenderedAssets(node, { requireImage = false } = {}) {
  if (document.fonts?.load) {
    await Promise.all([
      document.fonts.load(`400 16px "${DIANA_FONT_FAMILY}"`, SLOVAK_FONT_SAMPLE),
      document.fonts.load(`italic 400 16px "${DIANA_FONT_FAMILY}"`, SLOVAK_FONT_SAMPLE),
      document.fonts.load(`600 16px "${DIANA_FONT_FAMILY}"`, SLOVAK_FONT_SAMPLE),
    ])
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

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}
