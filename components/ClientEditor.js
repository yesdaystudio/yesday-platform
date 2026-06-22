"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import supabase from "../lib/supabase"
import { sortScheduleItemsChronologically } from "../lib/schedule"

export default function ClientEditor({ slug: slugProp }) {
  const params = useParams()
  const slug = slugProp || params?.slug
  const router = useRouter()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [receptionVenueName, setReceptionVenueName] = useState("")
  const [receptionVenueAddress, setReceptionVenueAddress] = useState("")

  const [projectForm, setProjectForm] = useState({
    couple_display_name: "",
    wedding_date: "",
    ceremony_time: "",
    reception_time: "",
    venue_name: "",
    venue_address: "",
  })

  const [contentForm, setContentForm] = useState({
    welcome_text: "",
    story_text: "",
    menu_intro_text: "",
    dresscode_text: "",
    accommodation_text: "",
    transport_text: "",
    faq_text: "",
  })

  const [scheduleForm, setScheduleForm] = useState([])

  useEffect(() => {
    async function loadData() {
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {
        router.push("/login")
        return
      }

      const userId = sessionData.session.user.id

      setLoading(true)
      setError("")
      setAccessDenied(false)

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .single()

      if (projectError || !projectData) {
        setError("Projekt sa nepodarilo načítať.")
        setLoading(false)
        return
      }

      if (projectData.owner_user_id !== userId) {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      setProject(projectData)

      setProjectForm({
        couple_display_name: projectData.couple_display_name || "",
        wedding_date: projectData.wedding_date || "",
        ceremony_time: projectData.ceremony_time
          ? String(projectData.ceremony_time).slice(0, 5)
          : "",
        reception_time: projectData.reception_time
          ? String(projectData.reception_time).slice(0, 5)
          : "",
        venue_name: projectData.venue_name || "",
        venue_address: projectData.venue_address || "",
      })

      setReceptionVenueName(projectData.reception_venue_name || "")
      setReceptionVenueAddress(projectData.reception_venue_address || "")

      const { data: contentData } = await supabase
        .from("website_content")
        .select("*")
        .eq("project_id", projectData.id)
        .maybeSingle()

      if (contentData) {
        setContentForm({
          welcome_text: contentData.welcome_text || "",
          story_text: contentData.story_text || "",
          menu_intro_text: contentData.menu_intro_text || "",
          dresscode_text: contentData.dresscode_text || "",
          accommodation_text: contentData.accommodation_text || "",
          transport_text: contentData.transport_text || "",
          faq_text: contentData.faq_text || "",
        })
      }

      const { data: scheduleData } = await supabase
        .from("schedule_items")
        .select("*")
        .eq("project_id", projectData.id)
        .order("sort_order", { ascending: true })

      setScheduleForm(
        sortScheduleItemsChronologically(scheduleData?.map((item) => ({
          item_time: item.item_time || "",
          item_title: item.item_title || "",
          item_description: item.item_description || "",
        })) || [])
      )

      setLoading(false)
    }

    if (slug) loadData()
  }, [slug, router])

  function handleProjectChange(event) {
    const { name, value } = event.target
    setProjectForm((current) => ({ ...current, [name]: value }))
  }

  function handleContentChange(event) {
    const { name, value } = event.target
    setContentForm((current) => ({ ...current, [name]: value }))
  }

  function handleScheduleChange(index, field, value) {
    setScheduleForm((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  function addScheduleItem() {
    setScheduleForm((current) => [
      ...current,
      {
        item_time: "",
        item_title: "",
        item_description: "",
      },
    ])
  }

  function removeScheduleItem(index) {
    setScheduleForm((current) => current.filter((_, i) => i !== index))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setMessage("")
    setError("")

    const projectPayload = {
      couple_display_name: projectForm.couple_display_name,
      wedding_date: projectForm.wedding_date || null,
      ceremony_time: projectForm.ceremony_time
        ? `${projectForm.ceremony_time}:00`
        : null,
      reception_time: projectForm.reception_time
        ? `${projectForm.reception_time}:00`
        : null,
      venue_name: projectForm.venue_name,
      venue_address: projectForm.venue_address,
      reception_venue_name: receptionVenueName,
      reception_venue_address: receptionVenueAddress,
    }

    console.error("PROJECT DATA CREATED AT", "ClientEditor.handleSubmit -> const projectPayload")
    console.error("PROJECT FORM VALUES", {
      couple_display_name: projectForm.couple_display_name,
      wedding_date: projectForm.wedding_date,
      ceremony_time: projectForm.ceremony_time,
      reception_time: projectForm.reception_time,
      venue_name: projectForm.venue_name,
      venue_address: projectForm.venue_address,
      receptionVenueName,
      receptionVenueAddress,
    })
    console.error("PROJECT DATA BEFORE UPDATE", projectPayload)
    console.error("PROJECT SAVE PAYLOAD", projectPayload)
    console.error("PROJECT SAVE TARGET", {
      projectId: project?.id,
      projectSlug: project?.slug,
      routeSlug: slug,
    })

    const { data: projectData, error } = await supabase
      .from("projects")
      .update(projectPayload)
      .eq("id", project.id)

    if (error) {
      console.error("PROJECT SAVE ERROR MESSAGE", error?.message)
      console.error("PROJECT SAVE ERROR DETAILS", error?.details)
      console.error("PROJECT SAVE ERROR HINT", error?.hint)
      console.error("PROJECT SAVE ERROR CODE", error?.code)
      console.error("PROJECT SAVE PAYLOAD JSON", JSON.stringify(projectData, null, 2))
      setError("Základné údaje sa nepodarilo uložiť.")
      setSaving(false)
      return
    }

    const { data: existingContent } = await supabase
      .from("website_content")
      .select("id")
      .eq("project_id", project.id)
      .maybeSingle()

    const contentPayload = {
      project_id: project.id,
      ...contentForm,
    }

    const contentResult = existingContent
      ? await supabase
          .from("website_content")
          .update(contentPayload)
          .eq("project_id", project.id)
      : await supabase.from("website_content").insert(contentPayload)

    if (contentResult.error) {
      setError("Textový obsah sa nepodarilo uložiť.")
      setSaving(false)
      return
    }

    await supabase
      .from("schedule_items")
      .delete()
      .eq("project_id", project.id)

    const chronologicalScheduleForm = sortScheduleItemsChronologically(scheduleForm)

    if (chronologicalScheduleForm.length > 0) {
      const schedulePayload = chronologicalScheduleForm.map((item, index) => ({
        project_id: project.id,
        sort_order: index + 1,
        item_time: item.item_time,
        item_title: item.item_title,
        item_description: item.item_description,
      }))

      const { error: scheduleError } = await supabase
        .from("schedule_items")
        .insert(schedulePayload)

      if (scheduleError) {
        setError("Harmonogram sa nepodarilo uložiť.")
        setSaving(false)
        return
      }
    }

    setScheduleForm(chronologicalScheduleForm)
    setMessage("Zmeny boli uložené.")
    setSaving(false)
  }

  if (loading) {
    return <main style={pageStyle}>Načítavam editor...</main>
  }

  if (accessDenied) {
    return <main style={pageStyle}>Access denied</main>
  }

  if (error && !project) {
    return <main style={pageStyle}>{error}</main>
  }

  return (
    <main style={pageStyle}>
      <form onSubmit={handleSubmit} style={cardStyle}>
        <p style={eyebrowStyle}>Klientska zóna</p>
        <h1 style={titleStyle}>Upraviť svadobný web</h1>

        <h2 style={subtitleStyle}>Základné údaje</h2>

        <InputField label="Mená páru" name="couple_display_name" value={projectForm.couple_display_name} onChange={handleProjectChange} />
        <InputField label="Dátum svadby" name="wedding_date" type="date" value={projectForm.wedding_date} onChange={handleProjectChange} />
        <InputField label="Čas obradu" name="ceremony_time" type="time" value={projectForm.ceremony_time} onChange={handleProjectChange} />
        <InputField label="Čas oslavy" name="reception_time" type="time" value={projectForm.reception_time} onChange={handleProjectChange} />
        <InputField label="Miesto obradu" name="venue_name" value={projectForm.venue_name} onChange={handleProjectChange} />
        <InputField label="Adresa obradu" name="venue_address" value={projectForm.venue_address} onChange={handleProjectChange} />
        <InputField label="Miesto oslavy" value={receptionVenueName} onChange={(event) => setReceptionVenueName(event.target.value)} />
        <InputField label="Adresa oslavy" value={receptionVenueAddress} onChange={(event) => setReceptionVenueAddress(event.target.value)} />

        <h2 style={subtitleStyle}>Texty na webe</h2>

        <TextField label="Úvodný text" name="welcome_text" value={contentForm.welcome_text} onChange={handleContentChange} />
        <TextField label="Náš príbeh" name="story_text" value={contentForm.story_text} onChange={handleContentChange} />
        <TextField
          label="Svadobné menu"
          helperText="Napíšte menu, ktoré sa bude podávať na svadbe."
          name="menu_intro_text"
          value={contentForm.menu_intro_text}
          onChange={handleContentChange}
        />
        <TextField label="Dress code" name="dresscode_text" value={contentForm.dresscode_text} onChange={handleContentChange} />
        <TextField label="Ubytovanie" name="accommodation_text" value={contentForm.accommodation_text} onChange={handleContentChange} />
        <TextField label="Doprava a parkovanie" name="transport_text" value={contentForm.transport_text} onChange={handleContentChange} />
        <TextField label="FAQ" name="faq_text" value={contentForm.faq_text} onChange={handleContentChange} />

        <h2 style={subtitleStyle}>Harmonogram</h2>

        {scheduleForm.map((item, index) => (
          <div key={index} style={scheduleCardStyle}>
            <InputField
              label="Čas"
              type="time"
              value={item.item_time}
              onChange={(e) =>
                handleScheduleChange(index, "item_time", e.target.value)
              }
            />

            <InputField
              label="Názov"
              value={item.item_title}
              onChange={(e) =>
                handleScheduleChange(index, "item_title", e.target.value)
              }
            />

            <TextField
              label="Popis"
              value={item.item_description}
              onChange={(e) =>
                handleScheduleChange(index, "item_description", e.target.value)
              }
            />

            <button
              type="button"
              onClick={() => removeScheduleItem(index)}
              style={removeButtonStyle}
            >
              Odstrániť
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addScheduleItem}
          style={secondaryButtonStyle}
        >
          + Pridať bod programu
        </button>

        <br />
        <br />

        <button type="submit" disabled={saving} style={buttonStyle}>
          {saving ? "Ukladám..." : "Uložiť zmeny"}
        </button>

        {message ? <p style={successStyle}>{message}</p> : null}
        {error ? <p style={errorStyle}>{error}</p> : null}
      </form>
    </main>
  )
}

function InputField({ label, name, type = "text", value, onChange }) {
  return (
    <label style={labelStyle}>
      <span style={labelTextStyle}>{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        style={inputStyle}
      />
    </label>
  )
}

function TextField({ label, helperText, name, value, onChange }) {
  return (
    <label style={labelStyle}>
      <span style={labelTextStyle}>{label}</span>
      {helperText ? <span style={helperTextStyle}>{helperText}</span> : null}
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        style={textareaStyle}
      />
    </label>
  )
}

const pageStyle = {
  minHeight: "100vh",
  padding: "48px 20px",
  background: "#f6efe6",
  color: "#4f4035",
  fontFamily: "Georgia, Times New Roman, serif",
}

const cardStyle = {
  maxWidth: "860px",
  margin: "0 auto",
  padding: "40px",
  borderRadius: "28px",
  background: "rgba(255, 250, 244, 0.92)",
}

const eyebrowStyle = {
  margin: 0,
  fontSize: "12px",
  letterSpacing: "0.28em",
  textTransform: "uppercase",
  color: "#9b7c62",
}

const titleStyle = {
  margin: "16px 0 28px",
  fontSize: "42px",
  fontWeight: "normal",
}

const subtitleStyle = {
  margin: "34px 0 18px",
  fontSize: "26px",
  fontWeight: "normal",
}

const labelStyle = {
  display: "block",
  marginBottom: "22px",
}

const labelTextStyle = {
  display: "block",
  marginBottom: "8px",
}

const helperTextStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#6f5b4b",
  fontSize: "14px",
}

const inputStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: "16px",
  border: "1px solid rgba(138,111,84,0.22)",
  background: "#fffaf5",
  color: "#4f4035",
  fontFamily: "inherit",
  fontSize: "16px",
}

const textareaStyle = {
  ...inputStyle,
  lineHeight: 1.6,
}

const scheduleCardStyle = {
  padding: "20px",
  borderRadius: "18px",
  background: "#fffaf5",
  marginBottom: "20px",
}

const buttonStyle = {
  padding: "15px 28px",
  borderRadius: "999px",
  border: "none",
  background: "#5f4838",
  color: "white",
  cursor: "pointer",
}

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "#9b7c62",
}

const removeButtonStyle = {
  ...buttonStyle,
  background: "#b95c5c",
}

const successStyle = {
  marginTop: "18px",
  color: "green",
}

const errorStyle = {
  marginTop: "18px",
  color: "red",
}
