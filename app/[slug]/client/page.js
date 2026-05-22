"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import ClientEditor from "../../../components/ClientEditor"
import ClientDashboard from "../../../components/ClientDashboard"
import ClientGuests from "../../../components/ClientGuests"
import ClientAccommodation from "../../../components/ClientAccommodation"
import QRCode from "qrcode"
import supabase from "../../../lib/supabase"

const TABS = {
  EDITOR: "Editor",
  DASHBOARD: "Dashboard",
  GUESTS: "Hostia",
  ACCOMMODATION: "Ubytovanie",
  QR_CODE: "QR kód",
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
  const [activeTab, setActiveTab] = useState(TABS.EDITOR)
  const [packageType, setPackageType] = useState("signature")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [qrError, setQrError] = useState("")
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
          .select("package_type, owner_user_id")
          .eq("slug", slug)
          .single()

        if (error) {
          console.error("Package type load error:", error)
          setAccessDenied(true)
        } else if (projectData?.owner_user_id !== userId) {
          setAccessDenied(true)
        } else {
          setPackageType(String(projectData?.package_type || "signature").toLowerCase().trim())
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

  if (loading) {
    return <main style={pageStyle}>Načítavam klientsku zónu...</main>
  }

  if (accessDenied) {
    return <main style={pageStyle}>Access denied</main>
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <div style={headerRowStyle}>
          <div>
            <p style={eyebrowStyle}>Klientska zóna</p>
            <h1 style={titleStyle}>Správa svadobného webu</h1>
          </div>

          <button type="button" onClick={handleLogout} style={logoutButtonStyle}>
            Odhlásiť sa
          </button>
        </div>

        <div style={tabsRowStyle}>
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
            onClick={() => setActiveTab(TABS.QR_CODE)}
          />
          <TabButton
            label={TABS.GUESTS}
            isActive={activeTab === TABS.GUESTS}
            onClick={() => setActiveTab(TABS.GUESTS)}
          />
          {showAccommodationTab ? (
            <TabButton
              label={TABS.ACCOMMODATION}
              isActive={activeTab === TABS.ACCOMMODATION}
              onClick={() => setActiveTab(TABS.ACCOMMODATION)}
            />
          ) : null}
        </div>

        <section style={contentStyle}>
          {activeTab === TABS.EDITOR && (
            <ClientEditor slug={slug} />
          )}

          {activeTab === TABS.DASHBOARD && (
            <ClientDashboard slug={slug} />
          )}

          {activeTab === TABS.GUESTS && (
            <ClientGuests slug={slug} />
          )}

          {activeTab === TABS.ACCOMMODATION && showAccommodationTab ? (
            <ClientAccommodation slug={slug} />
          ) : null}

          {activeTab === TABS.QR_CODE && (
            <section style={qrSectionStyle}>
              <p style={textStyle}>Slug projektu: {slug || "-"}</p>
              <p style={textStyle}>Svadobný web: {weddingWebsiteUrl || "-"}</p>
              <p style={textStyle}>Tu bude QR kód na svadobný web.</p>

              {qrDataUrl ? (
                <Image
                  src={qrDataUrl}
                  alt="QR kód na svadobný web"
                  width={220}
                  height={220}
                  unoptimized
                  style={qrImageStyle}
                />
              ) : null}

              {qrError ? <p style={textStyle}>{qrError}</p> : null}

              {qrDataUrl ? (
                <a
                  href={qrDataUrl}
                  download={`svadobny-web-${slug || "qr"}.png`}
                  style={downloadButtonStyle}
                >
                  Stiahnuť QR kód
                </a>
              ) : null}
            </section>
          )}
        </section>
      </section>
    </main>
  )
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

const cardStyle = {
  width: "100%",
  maxWidth: "860px",
  marginTop: "28px",
  borderRadius: "28px",
  background: "rgba(255, 250, 244, 0.9)",
  border: "1px solid rgba(138, 111, 84, 0.15)",
  boxShadow: "0 20px 60px rgba(106, 82, 58, 0.12)",
  padding: "34px 22px 28px",
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

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  flexWrap: "wrap",
}

const logoutButtonStyle = {
  appearance: "none",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "rgba(176, 139, 105, 0.28)",
  borderRadius: "999px",
  background: "#fffaf5",
  color: "#5f4838",
  padding: "9px 14px",
  fontSize: "14px",
  cursor: "pointer",
  fontFamily: "inherit",
}

const tabsRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
}

const tabButtonStyle = {
  appearance: "none",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "rgba(176, 139, 105, 0.28)",
  background: "#fffaf5",
  color: "#5f4838",
  borderRadius: "999px",
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

const contentStyle = {
  marginTop: "18px",
  borderRadius: "18px",
  background: "rgba(255, 251, 246, 0.9)",
  border: "1px solid rgba(176, 139, 105, 0.16)",
  padding: "24px",
  minHeight: "180px",
}

const textStyle = {
  margin: 0,
  fontSize: "18px",
  lineHeight: 1.7,
  color: "#6f5b4b",
}

const qrSectionStyle = {
  display: "grid",
  gap: "8px",
}

const qrImageStyle = {
  width: "220px",
  height: "220px",
  padding: "10px",
  background: "#fff",
  border: "1px solid rgba(176, 139, 105, 0.22)",
  borderRadius: "12px",
}

const downloadButtonStyle = {
  display: "inline-block",
  width: "fit-content",
  marginTop: "8px",
  padding: "10px 16px",
  borderRadius: "999px",
  background: "#5f4838",
  color: "#fffaf5",
  textDecoration: "none",
  fontSize: "14px",
}
