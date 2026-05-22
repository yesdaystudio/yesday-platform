"use client"

import { useState } from "react"
import supabase from "../../lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function handleLogin(event) {
    event.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Prihlásenie zlyhalo. Skontrolujte údaje.")
    } else {
      const userId = authData?.user?.id

      if (!userId) {
        setError("Prihlásenie prebehlo, ale nepodarilo sa načítať účet.")
        setLoading(false)
        return
      }

      const { data: ownedProjects, error: projectError } = await supabase
        .from("projects")
        .select("slug")
        .eq("owner_user_id", userId)
        .limit(1)

      if (projectError) {
        setError("Prihlásenie prebehlo, ale nepodarilo sa načítať projekt.")
        setLoading(false)
        return
      }

      const ownedProject = ownedProjects?.[0]

      if (!ownedProject?.slug) {
        setMessage("Prihlásenie úspešné, ale k účtu zatiaľ nie je priradený žiadny projekt.")
        setLoading(false)
        return
      }

      setMessage("Prihlásenie úspešné.")
      window.location.href = `/${ownedProject.slug}/client`
    }

    setLoading(false)
  }

  return (
    <main style={pageStyle}>
      <form onSubmit={handleLogin} style={cardStyle}>
        <p style={eyebrowStyle}>YesDay</p>
        <h1 style={titleStyle}>Klientske prihlásenie</h1>

        <label style={labelStyle}>
          <span style={labelTextStyle}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
        </label>

        <label style={labelStyle}>
          <span style={labelTextStyle}>Heslo</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
        </label>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Prihlasujem..." : "Prihlásiť sa"}
        </button>

        {message ? <p style={successStyle}>{message}</p> : null}
        {error ? <p style={errorStyle}>{error}</p> : null}
      </form>
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

const successStyle = {
  marginTop: "18px",
  color: "green",
}

const errorStyle = {
  marginTop: "18px",
  color: "red",
}