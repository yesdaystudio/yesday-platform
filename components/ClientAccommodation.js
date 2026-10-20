'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '../lib/supabase'

export default function ClientAccommodation({ slug: slugProp, demoProject, demoResponses, onDemoResponseUpdate }) {
  const params = useParams()
  const slug = slugProp || params?.slug
  const router = useRouter()

  const [project, setProject] = useState(demoProject || null)
  const [rows, setRows] = useState(() => (demoResponses || []).filter(row => row.needs_accommodation).map(mapAccommodationRow))
  const [loading, setLoading] = useState(!demoProject)
  const [accessDenied, setAccessDenied] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [savingEmailStatusId, setSavingEmailStatusId] = useState(null)
  const [status, setStatus] = useState('')
  const [emailDraft, setEmailDraft] = useState(null)

  const packageType = String(project?.package_type || 'signature').toLowerCase().trim()
  const canManageAccommodation = packageType === 'signature' || packageType === 'atelier'
  const requestedRooms = rows.reduce((sum, row) => sum + getRequestedRoomCount(row), 0)
  const assignedRooms = rows.reduce((sum, row) => sum + (String(row.roomNumber || '').trim() ? getRequestedRoomCount(row) : 0), 0)
  const accommodationGuests = rows.reduce((sum, row) => sum + Math.max(0, Number(row.adults_count || 0)) + Math.max(0, Number(row.children_count || 0)), 0)

  useEffect(() => {
    if (demoProject) return
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
        (responseData || []).map(mapAccommodationRow)
      )

      setLoading(false)
    }

    if (slug) loadAccommodationRows()
  }, [slug, router, demoProject])

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
      accommodation_hotel_address: row.hotelAddress || null,
      accommodation_check_in: row.checkIn || null,
      accommodation_check_out: row.checkOut || null,
      accommodation_guest_note: row.guestNote || null,
      accommodation_internal_note: row.internalNote || null,
    }

    if (demoProject) {
      onDemoResponseUpdate(row.id, payload)
      setStatus('Ubytovanie bolo uložené v ukážke.')
      setSavingId(null)
      return
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
    if (demoProject) {
      onDemoResponseUpdate(row.id, { accommodation_email_sent_at: emailSentAt })
      setRows(current => current.map(item => item.id === row.id ? { ...item, emailSentAt } : item))
      setStatus(sent ? 'V ukážke označené ako odoslané.' : 'V ukážke označené ako neodoslané.')
      setSavingEmailStatusId(null)
      return
    }
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
      <section aria-label="Súhrn potrebných izieb" style={summaryStyle}>
        <div style={summaryLeadStyle}>
          <p style={summaryLabelStyle}>Potrebné izby</p>
          <strong style={summaryValueStyle}>{requestedRooms}</strong>
          <p style={summaryHelpStyle}>Jedna izba na každú RSVP skupinu, ktorá požiadala o ubytovanie.</p>
        </div>
        <div style={summaryMetricStyle}>
          <p style={summaryLabelStyle}>Hostia na ubytovanie</p>
          <strong style={summarySmallValueStyle}>{accommodationGuests}</strong>
        </div>
        <div style={summaryMetricStyle}>
          <p style={summaryLabelStyle}>Izby už priradené</p>
          <strong style={summarySmallValueStyle}>{assignedRooms} / {requestedRooms}</strong>
        </div>
      </section>
      {status ? <p role="status" style={statusStyle}>{status}</p> : null}
      {emailDraft ? (
        <EmailComposer
          draft={emailDraft}
          isDemo={Boolean(demoProject)}
          onChange={setEmailDraft}
          onClose={() => setEmailDraft(null)}
        />
      ) : null}

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

            <div style={fieldsGridStyle}>
              <label style={labelStyle}>
                <span style={labelTextStyle}>Názov ubytovania</span>
                <input
                  value={row.assignedHotel}
                  onChange={(event) => updateField(row.id, 'assignedHotel', event.target.value)}
                  placeholder="Napr. Hotel Park"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                <span style={labelTextStyle}>Číslo izby</span>
                <input
                  value={row.roomNumber}
                  onChange={(event) => updateField(row.id, 'roomNumber', event.target.value)}
                  placeholder="Napr. 204"
                  style={inputStyle}
                />
              </label>

              <label style={{ ...labelStyle, ...wideFieldStyle }}>
                <span style={labelTextStyle}>Adresa ubytovania</span>
                <input
                  value={row.hotelAddress}
                  onChange={(event) => updateField(row.id, 'hotelAddress', event.target.value)}
                  placeholder="Ulica, mesto"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                <span style={labelTextStyle}>Check-in</span>
                <input
                  value={row.checkIn}
                  onChange={(event) => updateField(row.id, 'checkIn', event.target.value)}
                  placeholder="Napr. 18. 9. 2027 od 14:00"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                <span style={labelTextStyle}>Check-out</span>
                <input
                  value={row.checkOut}
                  onChange={(event) => updateField(row.id, 'checkOut', event.target.value)}
                  placeholder="Napr. 19. 9. 2027 do 10:00"
                  style={inputStyle}
                />
              </label>
            </div>

            <label style={labelStyle}>
              <span style={labelTextStyle}>Informácia pre hosťa</span>
              <textarea
                value={row.guestNote}
                onChange={(event) => updateField(row.id, 'guestNote', event.target.value)}
                placeholder="Napr. raňajky, parkovanie alebo postup pri príchode. Táto poznámka sa vloží do e-mailu."
                rows={3}
                style={textareaStyle}
              />
            </label>

            <label style={labelStyle}>
              <span style={labelTextStyle}>Interná poznámka</span>
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
                  <button
                    type="button"
                    onClick={() => setEmailDraft(buildAccommodationEmailDraft(row, project))}
                    style={emailButtonStyle}
                  >
                    Pripraviť e-mail
                  </button>
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

function getRequestedRoomCount(row) {
  const explicitCount = Number(row.accommodation_rooms_count || row.requested_rooms || row.rooms_count)
  return Number.isFinite(explicitCount) && explicitCount > 0 ? Math.floor(explicitCount) : 1
}

function mapAccommodationRow(row) {
  return {
    ...row,
    assignedHotel: row.accommodation_hotel || row.assigned_hotel || row.hotel_name || '',
    roomNumber: row.accommodation_room || row.room_number || row.assigned_room || '',
    hotelAddress: row.accommodation_hotel_address || '',
    checkIn: row.accommodation_check_in || '',
    checkOut: row.accommodation_check_out || '',
    guestNote: row.accommodation_guest_note || '',
    internalNote: row.accommodation_internal_note || row.internal_note || row.accommodation_note || '',
    emailSentAt: row.accommodation_email_sent_at || null,
  }
}

function buildAccommodationEmailDraft(row, project) {
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
    'tešíme sa, že budete súčasťou nášho svadobného dňa. Posielame vám všetky informácie k ubytovaniu:',
    '',
    `Ubytovanie: ${row.assignedHotel || 'bude doplnené'}`,
    row.hotelAddress ? `Adresa: ${row.hotelAddress}` : '',
    `Izba: ${row.roomNumber || 'bude doplnená'}`,
    row.checkIn ? `Check-in: ${row.checkIn}` : '',
    row.checkOut ? `Check-out: ${row.checkOut}` : '',
    '',
    row.guestNote || '',
    '',
    'Ak by ste mali akékoľvek otázky, pokojne sa nám ozvite.',
    '',
    'Tešíme sa na vás!',
    coupleName || 'Nevesta a ženích',
  ].filter((line, index, lines) => line || lines[index - 1] !== '').join('\n')

  return { email, subject, body }
}

function buildAccommodationEmailHref(draft) {
  return `mailto:${encodeURIComponent(draft.email)}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`
}

function EmailComposer({ draft, isDemo, onChange, onClose }) {
  return (
    <section aria-label="Náhľad e-mailu hosťovi" style={emailComposerStyle}>
      <div style={headRowStyle}>
        <div>
          <p style={composerEyebrowStyle}>Pripravený e-mail</p>
          <h3 style={composerTitleStyle}>Informácie o ubytovaní pre hosťa</h3>
        </div>
        <button type="button" onClick={onClose} style={closeButtonStyle}>Zavrieť</button>
      </div>

      <label style={labelStyle}>
        <span style={labelTextStyle}>Komu</span>
        <input value={draft.email} readOnly style={{ ...inputStyle, ...readOnlyInputStyle }} />
      </label>

      <label style={labelStyle}>
        <span style={labelTextStyle}>Predmet</span>
        <input
          value={draft.subject}
          onChange={(event) => onChange({ ...draft, subject: event.target.value })}
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        <span style={labelTextStyle}>Text e-mailu</span>
        <textarea
          value={draft.body}
          onChange={(event) => onChange({ ...draft, body: event.target.value })}
          rows={16}
          style={emailBodyStyle}
        />
      </label>

      <div style={actionsStyle}>
        {isDemo ? (
          <span style={demoNoticeStyle}>V ukážke sa e-mail neodosiela.</span>
        ) : (
          <a href={buildAccommodationEmailHref(draft)} style={saveButtonLinkStyle}>
            Otvoriť v e-mailovej aplikácii
          </a>
        )}
        <span style={composerHelpStyle}>Pred odoslaním môžete predmet aj text upraviť.</span>
      </div>
    </section>
  )
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

const summaryStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '10px',
}

const summaryLeadStyle = {
  border: '1px solid #5f4838',
  background: '#5f4838',
  color: '#fffaf5',
  padding: '18px',
}

const summaryMetricStyle = {
  border: '1px solid rgba(176, 139, 105, 0.2)',
  background: '#fffaf5',
  color: '#4f4035',
  padding: '18px',
}

const summaryLabelStyle = {
  margin: 0,
  fontSize: '11px',
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
}

const summaryValueStyle = {
  display: 'block',
  marginTop: '8px',
  fontSize: '42px',
  fontWeight: 400,
  lineHeight: 1,
}

const summarySmallValueStyle = {
  display: 'block',
  marginTop: '14px',
  fontSize: '28px',
  fontWeight: 400,
  lineHeight: 1,
}

const summaryHelpStyle = {
  margin: '10px 0 0',
  fontSize: '12px',
  lineHeight: 1.5,
  opacity: 0.78,
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

const fieldsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '10px',
}

const wideFieldStyle = {
  gridColumn: '1 / -1',
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

const emailComposerStyle = {
  ...cardStyle,
  border: '1px solid rgba(95, 72, 56, 0.38)',
  background: '#fffaf5',
  padding: '20px',
  gap: '16px',
}

const composerEyebrowStyle = {
  margin: '0 0 5px',
  color: '#8a6f54',
  fontSize: '11px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}

const composerTitleStyle = {
  ...nameStyle,
  fontSize: '23px',
}

const closeButtonStyle = {
  border: 0,
  background: 'transparent',
  color: '#6f5b4b',
  padding: '4px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const readOnlyInputStyle = {
  background: 'rgba(176, 139, 105, 0.07)',
  color: '#6f5b4b',
}

const emailBodyStyle = {
  ...textareaStyle,
  minHeight: '310px',
  lineHeight: 1.65,
}

const demoNoticeStyle = {
  color: '#6f5b4b',
  fontSize: '13px',
}

const composerHelpStyle = {
  color: '#8a7768',
  fontSize: '12px',
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

const saveButtonLinkStyle = {
  ...saveButtonStyle,
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
  fontSize: '13px',
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
