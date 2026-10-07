'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '../lib/supabase'

export default function ClientAccommodation({ slug: slugProp }) {
  const params = useParams()
  const slug = slugProp || params?.slug
  const router = useRouter()

  const [project, setProject] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [savingEmailStatusId, setSavingEmailStatusId] = useState(null)
  const [status, setStatus] = useState('')

  const packageType = String(project?.package_type || 'signature').toLowerCase().trim()
  const canManageAccommodation = packageType === 'signature' || packageType === 'atelier'

  useEffect(() => {
    async function loadAccommodationRows() {
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {
        router.push('/login')
        return
      }

      const userId = sessionData.session.user.id
      setAccessDenied(false)

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .single()

      if (projectError || !projectData) {
        console.error(projectError)
        setLoading(false)
        return
      }

      if (projectData.owner_user_id !== userId) {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      setProject(projectData)

      const cleanPackage = String(projectData.package_type || 'signature').toLowerCase().trim()
      const isAllowed = cleanPackage === 'signature' || cleanPackage === 'atelier'

      if (!isAllowed) {
        setRows([])
        setLoading(false)
        return
      }

      const { data: responseData, error: responseError } = await supabase
        .from('rsvp_responses')
        .select('*')
        .eq('project_id', projectData.id)
        .eq('needs_accommodation', true)
        .order('created_at', { ascending: false })

      if (responseError) {
        console.error(responseError)
        setLoading(false)
        return
      }

      setRows(
        (responseData || []).map((row) => ({
          ...row,
          assignedHotel: row.accommodation_hotel || row.assigned_hotel || row.hotel_name || '',
          roomNumber: row.accommodation_room || row.room_number || row.assigned_room || '',
          internalNote: row.accommodation_internal_note || row.internal_note || row.accommodation_note || '',
          emailSentAt: row.accommodation_email_sent_at || null,
        }))
      )

      setLoading(false)
    }

    if (slug) loadAccommodationRows()
  }, [slug, router])

  function updateField(id, field, value) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    )
  }

  async function saveRow(row) {
    setStatus('')
    setSavingId(row.id)

    const payload = {
      accommodation_hotel: row.assignedHotel || null,
      accommodation_room: row.roomNumber || null,
      accommodation_internal_note: row.internalNote || null,
    }

    const { error } = await supabase
      .from('rsvp_responses')
      .update(payload)
      .eq('id', row.id)

    if (error) {
      console.error('Accommodation save error:', error)
      setStatus(`Nepodarilo sa uložiť záznam: ${error.message}`)
      setSavingId(null)
      return
    }

    setStatus('Ubytovanie bolo uložené.')
    setSavingId(null)
  }

  async function updateEmailStatus(row, sent) {
    setStatus('')
    setSavingEmailStatusId(row.id)

    const emailSentAt = sent ? new Date().toISOString() : null
    const { error } = await supabase
      .from('rsvp_responses')
      .update({ accommodation_email_sent_at: emailSentAt })
      .eq('id', row.id)

    if (error) {
      console.error('Accommodation email status save error:', error)
      setStatus('Stav e-mailu sa nepodarilo uložiť.')
      setSavingEmailStatusId(null)
      return
    }

    setRows((current) =>
      current.map((item) => (
        item.id === row.id ? { ...item, emailSentAt } : item
      ))
    )
    setStatus(sent ? 'E-mail bol označený ako odoslaný.' : 'E-mail bol označený ako neodoslaný.')
    setSavingEmailStatusId(null)
  }

  if (loading) {
    return <main style={{ padding: 16 }}>Načítavam ubytovanie...</main>
  }

  if (accessDenied) {
    return <main style={{ padding: 16 }}>Access denied</main>
  }

  if (!canManageAccommodation) {
    return <p style={emptyStyle}>Ubytovanie je dostupné len pre balíky Signature a Atelier.</p>
  }

  return (
    <section style={wrapperStyle}>
      {status ? <p style={statusStyle}>{status}</p> : null}

      {rows.length === 0 ? (
        <p style={emptyStyle}>Nikto zatiaľ nepožiadal o ubytovanie.</p>
      ) : (
        rows.map((row) => (
          <article key={row.id} style={cardStyle}>
            <div style={headStyle}>
              <div style={headRowStyle}>
                <h3 style={nameStyle}>{displayValue(row.guest_name)}</h3>
                <span style={emailStatusStyle(Boolean(row.emailSentAt))}>
                  {row.emailSentAt
                    ? `Hosťovi zaslané · ${formatEmailDate(row.emailSentAt)}`
                    : 'Hosťovi zatiaľ nezaslané'}
                </span>
              </div>
              <span style={countStyle}>
                Dospelí: {displayValue(row.adults_count)} | Deti: {displayValue(row.children_count)}
              </span>
            </div>

            <label style={labelStyle}>
              <span style={labelTextStyle}>Assigned hotel</span>
              <input
                value={row.assignedHotel}
                onChange={(event) => updateField(row.id, 'assignedHotel', event.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelTextStyle}>Room number</span>
              <input
                value={row.roomNumber}
                onChange={(event) => updateField(row.id, 'roomNumber', event.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelTextStyle}>Internal note</span>
              <textarea
                value={row.internalNote}
                onChange={(event) => updateField(row.id, 'internalNote', event.target.value)}
                rows={3}
                style={textareaStyle}
              />
            </label>

            <div style={actionsStyle}>
              <button
                type='button'
                onClick={() => saveRow(row)}
                disabled={savingId === row.id}
                style={saveButtonStyle}
              >
                {savingId === row.id ? 'Ukladám...' : 'Uložiť'}
              </button>

              {row.contact_email ? (
                <>
                  <a
                    href={buildAccommodationEmailHref(row, project)}
                    style={emailButtonStyle}
                  >
                    Odoslať e-mail
                  </a>
                  <button
                    type='button'
                    onClick={() => updateEmailStatus(row, !row.emailSentAt)}
                    disabled={savingEmailStatusId === row.id}
                    style={statusButtonStyle}
                  >
                    {savingEmailStatusId === row.id
                      ? 'Ukladám stav...'
                      : row.emailSentAt
                        ? 'Označiť ako neodoslané'
                        : 'Označiť ako odoslané'}
                  </button>
                </>
              ) : (
                <button
                  type='button'
                  disabled
                  title='Hosť pri RSVP neuviedol e-mailovú adresu.'
                  style={{ ...emailButtonStyle, ...disabledButtonStyle }}
                >
                  E-mail nie je k dispozícii
                </button>
              )}
            </div>
          </article>
        ))
      )}
    </section>
  )
}

function displayValue(value) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string' && !value.trim()) return '—'
  return value
}

function buildAccommodationEmailHref(row, project) {
  const email = String(row.contact_email || '').trim()
  const coupleName = String(project?.couple_display_name || '').trim()
  const guestName = String(row.guest_name || '').trim()
  const subject = coupleName
    ? `Informácie k ubytovaniu – ${coupleName}`
    : 'Informácie k svadobnému ubytovaniu'
  const greeting = guestName ? `Dobrý deň, ${guestName},` : 'Dobrý deň,'
  const body = [
    greeting,
    '',
    'posielame vám informácie k ubytovaniu na našu svadbu:',
    '',
    `Hotel: ${row.assignedHotel || 'bude doplnený'}`,
    `Izba: ${row.roomNumber || 'bude doplnená'}`,
    row.internalNote ? `Poznámka: ${row.internalNote}` : '',
    '',
    'S pozdravom',
    coupleName || 'Nevesta a ženích',
  ].filter((line, index, lines) => line || lines[index - 1] !== '').join('\n')

  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function formatEmailDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const wrapperStyle = {
  display: 'grid',
  gap: '12px',
}

const statusStyle = {
  margin: 0,
  color: '#6f5b4b',
}

const emptyStyle = {
  margin: 0,
  color: '#6f5b4b',
}

const cardStyle = {
  border: '1px solid rgba(176, 139, 105, 0.18)',
  borderRadius: 0,
  background: 'rgba(255, 251, 246, 0.9)',
  padding: '14px',
  display: 'grid',
  gap: '10px',
}

const headStyle = {
  display: 'grid',
  gap: '6px',
}

const headRowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '12px',
  flexWrap: 'wrap',
}

const nameStyle = {
  margin: 0,
  fontSize: '20px',
  fontWeight: 'normal',
  color: '#3f3128',
}

const countStyle = {
  color: '#6f5b4b',
  fontSize: '14px',
}

const emailStatusStyle = (sent) => ({
  padding: '5px 8px',
  border: sent
    ? '1px solid rgba(58, 128, 79, 0.28)'
    : '1px solid rgba(176, 139, 105, 0.28)',
  borderRadius: 0,
  background: sent ? 'rgba(58, 128, 79, 0.1)' : 'rgba(176, 139, 105, 0.08)',
  color: sent ? '#2f5c3d' : '#7b624f',
  fontSize: '12px',
  whiteSpace: 'nowrap',
})

const labelStyle = {
  display: 'grid',
  gap: '6px',
}

const labelTextStyle = {
  fontSize: '12px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#8a6f54',
}

const inputStyle = {
  width: '100%',
  border: '1px solid rgba(176, 139, 105, 0.28)',
  borderRadius: 0,
  background: '#fffaf5',
  padding: '10px 12px',
  color: '#4f4035',
  fontFamily: 'inherit',
  fontSize: '14px',
}

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
}

const saveButtonStyle = {
  width: 'fit-content',
  padding: '9px 14px',
  borderRadius: 0,
  border: 'none',
  background: '#5f4838',
  color: '#fffaf5',
  cursor: 'pointer',
}

const actionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap',
}

const emailButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'fit-content',
  padding: '8px 13px',
  border: '1px solid #5f4838',
  borderRadius: 0,
  background: 'transparent',
  color: '#5f4838',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '13px',
  lineHeight: 1.4,
  textDecoration: 'none',
}

const disabledButtonStyle = {
  opacity: 0.45,
  cursor: 'not-allowed',
}

const statusButtonStyle = {
  ...emailButtonStyle,
  borderColor: 'rgba(95, 72, 56, 0.28)',
  color: '#6f5b4b',
}
