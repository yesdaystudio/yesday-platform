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
  })
}

async function downloadComponentPdf(node, { filename, title }) {
  if (!node) {
    throw new Error("Náhľad pre PDF export nie je pripravený.")
  }

  await waitForRenderedAssets(node)

  const bounds = node.getBoundingClientRect()
  const width = Math.ceil(bounds.width)
  const height = Math.ceil(bounds.height)
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
  pdf.save(filename)
}

async function waitForRenderedAssets(node) {
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

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}
