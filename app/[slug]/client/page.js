"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import ClientEditor from "../../../components/ClientEditor"
import ClientOverview from "../../../components/ClientOverview"
import ClientDashboard from "../../../components/ClientDashboard"
import ClientAccommodation from "../../../components/ClientAccommodation"
import DianaStationerySet from "../../../components/DianaStationerySet"
import AlternativeStationerySet from "../../../components/AlternativeStationerySet"
import QRCode from "qrcode"
import supabase from "../../../lib/supabase"
import styles from "./client-zone.module.css"

const TABS = {
  OVERVIEW: "Prehľad",
  EDITOR: "Editor",
  DASHBOARD: "Hostia",
  ACCOMMODATION: "Ubytovanie",
  QR_CODE: "Pozvánka + QR",
}

function getBaseUrl() {
  const configuredBaseUrl = String(process.env.NEXT_PUBLIC_SITE_URL || "").trim()

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "")
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "")
  }

  return ""
}

export default function ClientZonePage() {
  const params = useParams()
  const slug = params?.slug
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW)
  const [packageType, setPackageType] = useState("signature")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [qrError, setQrError] = useState("")
  const [project, setProject] = useState(null)
  const [overviewData, setOverviewData] = useState({ content: null, schedule: [] })
  const baseUrl = getBaseUrl()
  const weddingWebsiteUrl = slug && baseUrl ? `${baseUrl}/${slug}` : ""
  const showAccommodationTab = packageType === "signature" || packageType === "atelier"

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  useEffect(() => {
    async function checkSession() {
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {
        router.push("/login")
        return
      }

      const userId = sessionData.session.user.id

      if (slug) {
        const { data: projectData, error } = await supabase
          .from("projects")
          .select("*")
          .eq("slug", slug)
          .single()

        if (error) {
          console.error("Package type load error:", error)
          setAccessDenied(true)
        } else if (projectData?.owner_user_id !== userId) {
          setAccessDenied(true)
        } else {
          setProject(projectData)
          setPackageType(String(projectData?.package_type || "signature").toLowerCase().trim())
          setOverviewData(await loadOverviewData(projectData.id))
        }
      }

      setLoading(false)
    }

    checkSession()
  }, [router, slug])

  useEffect(() => {
    let isMounted = true

    async function generateQrCode() {
      if (!weddingWebsiteUrl) {
        setQrDataUrl("")
        setQrError("")
        return
      }

      try {
        const dataUrl = await QRCode.toDataURL(weddingWebsiteUrl, {
          width: 320,
          margin: 2,
        })

        if (!isMounted) return
        setQrDataUrl(dataUrl)
        setQrError("")
      } catch (error) {
        if (!isMounted) return
        console.error("QR generation error:", error)
        setQrDataUrl("")
        setQrError("QR kód sa nepodarilo vygenerovať.")
      }
    }

    generateQrCode()

    return () => {
      isMounted = false
    }
  }, [weddingWebsiteUrl])

  async function handleProjectSaved(updatedProject) {
    setProject(updatedProject)
    if (updatedProject?.id) {
      setOverviewData(await loadOverviewData(updatedProject.id))
    }
  }

  function rememberOnboardingStep(key) {
    if (!slug) return

    try {
      const storageKey = `yesday:onboarding:${slug}`
      const current = JSON.parse(window.localStorage.getItem(storageKey) || "{}")
      window.localStorage.setItem(storageKey, JSON.stringify({ ...current, [key]: true }))
    } catch {}
  }

  function openStationeryTab() {
    rememberOnboardingStep("stationery")
    setActiveTab(TABS.QR_CODE)
  }

  if (loading) {
    return <main style={pageStyle}>Načítavam klientsku zónu...</main>
  }

  if (accessDenied) {
    return <main style={pageStyle}>Access denied</main>
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.header}>
          <div>
            <p style={eyebrowStyle}>Klientska zóna</p>
            <h1 style={titleStyle}>Vaša svadba v YesDay</h1>
          </div>

          <div className={styles.headerActions}>
            {weddingWebsiteUrl ? (
              <a href={weddingWebsiteUrl} target="_blank" rel="noopener noreferrer" style={guestWebsiteLinkStyle}>
                Zobraziť web pre hostí
              </a>
            ) : null}
            <button type="button" onClick={handleLogout} style={logoutButtonStyle}>
              Odhlásiť sa
            </button>
          </div>
        </div>

        <div className={styles.tabs}>
          <TabButton
            label={TABS.OVERVIEW}
            isActive={activeTab === TABS.OVERVIEW}
            onClick={() => setActiveTab(TABS.OVERVIEW)}
          />
          <TabButton
            label={TABS.EDITOR}
            isActive={activeTab === TABS.EDITOR}
            onClick={() => setActiveTab(TABS.EDITOR)}
          />
          <TabButton
            label={TABS.DASHBOARD}
            isActive={activeTab === TABS.DASHBOARD}
            onClick={() => setActiveTab(TABS.DASHBOARD)}
          />
          <TabButton
            label={TABS.QR_CODE}
            isActive={activeTab === TABS.QR_CODE}
            onClick={openStationeryTab}
          />
          {showAccommodationTab ? (
            <TabButton
              label={TABS.ACCOMMODATION}
              isActive={activeTab === TABS.ACCOMMODATION}
              onClick={() => setActiveTab(TABS.ACCOMMODATION)}
            />
          ) : null}
        </div>

        <section className={styles.content}>
          {activeTab === TABS.OVERVIEW && (
            <ClientOverview
              slug={slug}
              project={project}
              content={overviewData.content}
              schedule={overviewData.schedule}
              weddingWebsiteUrl={weddingWebsiteUrl}
              qrReady={Boolean(qrDataUrl)}
              onOpenEditor={() => setActiveTab(TABS.EDITOR)}
              onOpenStationery={openStationeryTab}
            />
          )}

          {activeTab === TABS.EDITOR && (
            <ClientEditor slug={slug} onProjectSaved={handleProjectSaved} embedded />
          )}

          {activeTab === TABS.DASHBOARD && (
            <ClientDashboard slug={slug} />
          )}

          {activeTab === TABS.ACCOMMODATION && showAccommodationTab ? (
            <ClientAccommodation slug={slug} />
          ) : null}

          {activeTab === TABS.QR_CODE && (
            <section style={qrSectionStyle}>
              {project?.design_family === "botanique" || project?.design_family === "penelope" ? (
                <AlternativeStationerySet
                  variant={project.design_family}
                  project={project}
                  weddingWebsiteUrl={weddingWebsiteUrl}
                  qrDataUrl={qrDataUrl}
                  qrError={qrError}
                />
              ) : (
                <DianaStationerySet
                  project={project}
                  weddingWebsiteUrl={weddingWebsiteUrl}
                  qrDataUrl={qrDataUrl}
                  qrError={qrError}
                />
              )}
            </section>
          )}
        </section>
      </section>
    </main>
  )
}

async function loadOverviewData(projectId) {
  if (!projectId) return { content: null, schedule: [] }

  const [contentResult, scheduleResult] = await Promise.all([
    supabase
      .from("website_content")
      .select("welcome_text, story_text, menu_intro_text")
      .eq("project_id", projectId)
      .maybeSingle(),
    supabase
      .from("schedule_items")
      .select("item_time, item_title")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true }),
  ])

  return {
    content: contentResult.data || null,
    schedule: scheduleResult.data || [],
  }
}

function TabButton({ label, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...tabButtonStyle,
        ...(isActive ? activeTabButtonStyle : {}),
      }}
    >
      {label}
    </button>
  )
}

const pageStyle = {
  minHeight: "100vh",
  padding: "24px",
  backgroundColor: "#f6efe6",
  backgroundImage: "linear-gradient(180deg, #efe4d6 0%, #f6efe6 22%, #fbf7f2 100%)",
  color: "#4f4035",
  fontFamily: "Georgia, Times New Roman, serif",
  display: "flex",
  justifyContent: "center",
}

const eyebrowStyle = {
  margin: 0,
  fontSize: "12px",
  letterSpacing: "0.32em",
  textTransform: "uppercase",
  color: "#9b7c62",
}

const titleStyle = {
  margin: "14px 0 24px",
  fontSize: "clamp(28px, 5vw, 42px)",
  fontWeight: "normal",
  color: "#3f3128",
}

const guestWebsiteLinkStyle = {
  border: "1px solid #5f4838",
  background: "#5f4838",
  color: "#fffaf5",
  padding: "10px 15px",
  fontSize: "14px",
  fontFamily: "inherit",
  textDecoration: "none",
}

const logoutButtonStyle = {
  appearance: "none",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "rgba(176, 139, 105, 0.28)",
  borderRadius: 0,
  background: "#fffaf5",
  color: "#5f4838",
  padding: "9px 14px",
  fontSize: "14px",
  cursor: "pointer",
  fontFamily: "inherit",
}

const tabButtonStyle = {
  appearance: "none",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "rgba(176, 139, 105, 0.28)",
  background: "#fffaf5",
  color: "#5f4838",
  borderRadius: 0,
  padding: "10px 16px",
  fontSize: "15px",
  cursor: "pointer",
  fontFamily: "inherit",
}

const activeTabButtonStyle = {
  background: "#5f4838",
  color: "#fffaf5",
  borderColor: "#5f4838",
}

const qrSectionStyle = {
  display: "grid",
  gap: "18px",
}
