"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import supabase from "../../lib/supabase"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [passwordConfirmation, setPasswordConfirmation] = useState("")
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    async function checkSession() {
      const { data } = await supabase.auth.getSession()

      if (active) {
        setHasRecoverySession(Boolean(data.session))
        setCheckingSession(false)
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return

      if (event === "PASSWORD_RECOVERY" || session) {
        setHasRecoverySession(true)
        setCheckingSession(false)
      }
    })

    checkSession()

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  async function handlePasswordUpdate(event) {
    event.preventDefault()
    setError("")
    setMessage("")

    if (password.length < 8) {
      setError("Nové heslo musí mať aspoň 8 znakov.")
      return
    }

    if (password !== passwordConfirmation) {
      setError("Zadané heslá sa nezhodujú.")
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError("Heslo sa nepodarilo uložiť. Resetovací odkaz mohol vypršať.")
      setSaving(false)
      return
    }

    await supabase.auth.signOut()
    setPassword("")
    setPasswordConfirmation("")
    setMessage("Heslo bolo úspešne zmenené. Teraz sa môžete prihlásiť novým heslom.")
    setSaving(false)
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={eyebrowStyle}>YesDay</p>
        <h1 style={titleStyle}>Nastavenie nového hesla</h1>

        {checkingSession ? <p style={infoStyle}>Overujem resetovací odkaz...</p> : null}

        {!checkingSession && !hasRecoverySession && !message ? (
          <div>
            <p style={errorStyle}>Resetovací odkaz je neplatný alebo už vypršal.</p>
            <Link href="/login" style={linkStyle}>Požiadať o nový odkaz</Link>
          </div>
        ) : null}

        {hasRecoverySession && !message ? (
          <form onSubmit={handlePasswordUpdate}>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Nové heslo</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                autoComplete="new-password"
                style={inputStyle}
                required
              />
            </label>

            <label style={labelStyle}>
              <span style={labelTextStyle}>Zopakujte nové heslo</span>
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                minLength={8}
                autoComplete="new-password"
                style={inputStyle}
                required
              />
            </label>

            <button type="submit" disabled={saving} style={buttonStyle}>
              {saving ? "Ukladám heslo..." : "Nastaviť nové heslo"}
            </button>
          </form>
        ) : null}

        {message ? (
          <div>
            <p style={successStyle}>{message}</p>
            <Link href="/login" style={linkStyle}>Prejsť na prihlásenie</Link>
          </div>
        ) : null}

        {error ? <p style={errorStyle}>{error}</p> : null}
      </section>
    </main>
  )
}

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  background: "#f6efe6",
  fontFamily: "Georgia, Times New Roman, serif",
}

const cardStyle = {
  width: "100%",
  maxWidth: "480px",
  padding: "42px",
  borderRadius: "28px",
  background: "rgba(255, 250, 244, 0.94)",
  boxShadow: "0 20px 60px rgba(106, 82, 58, 0.12)",
}

const eyebrowStyle = {
  margin: 0,
  fontSize: "12px",
  letterSpacing: "0.28em",
  textTransform: "uppercase",
  color: "#9b7c62",
}

const titleStyle = {
  margin: "14px 0 28px",
  fontSize: "40px",
  fontWeight: "normal",
  color: "#4f4035",
}

const labelStyle = {
  display: "block",
  marginBottom: "20px",
}

const labelTextStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#6f5b4b",
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px",
  borderRadius: "16px",
  border: "1px solid rgba(138,111,84,0.22)",
  background: "#fffaf5",
  fontSize: "16px",
  color: "#4f4035",
  fontFamily: "inherit",
}

const buttonStyle = {
  width: "100%",
  padding: "15px",
  borderRadius: "999px",
  border: "none",
  background: "#5f4838",
  color: "white",
  fontSize: "16px",
  cursor: "pointer",
}

const infoStyle = {
  color: "#6f5b4b",
}

const successStyle = {
  lineHeight: 1.6,
  color: "green",
}

const errorStyle = {
  lineHeight: 1.6,
  color: "#a13d32",
}

const linkStyle = {
  display: "inline-block",
  marginTop: "10px",
  color: "#5f4838",
  fontWeight: 600,
}
