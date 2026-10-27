'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '../lib/supabase'
import {
  getReminderStatus,
  normalizeReminderDays,
  requiresDateChangeConfirmation,
} from '../lib/accommodationReminderRules.mjs'

export default function ClientAccommodation({ slug: slugProp, demoProject, demoResponses, onDemoResponseUpdate }) {
  const params = useParams()
  const slug = slugProp || params?.slug
  const router = useRouter()

  const [project, setProject] = useState(demoProject || null)
  const [rows, setRows] = useState(() => (demoResponses || []).filter(row => row.needs_accommodation).map(mapAccommodationRow))
  const [accommodations, setAccommodations] = useState(() => buildDemoAccommodationOptions(demoResponses || []))
  const [reminderDeliveries, setReminderDeliveries] = useState([])
  const [loading, setLoading] = useState(!demoProject)
  const [accessDenied, setAccessDenied] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [savingAccommodationId, setSavingAccommodationId] = useState(null)
  const [savingEmailStatusId, setSavingEmailStatusId] = useState(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [savingReminderSetting, setSavingReminderSetting] = useState(false)
  const [confirmingDateChange, setConfirmingDateChange] = useState(false)
  const [status, setStatus] = useState('')
  const [emailDraft, setEmailDraft] = useState(null)
  const [reminderPreview, setReminderPreview] = useState(null)

  const packageType = String(project?.package_type || 'signature').toLowerCase().trim()
  const canManageAccommodation = packageType === 'signature' || packageType === 'atelier'
  const requestedRooms = rows.reduce((sum, row) => sum + getRequestedRoomCount(row), 0)
  const assignedRooms = rows.reduce((sum, row) => sum + (
    row.assignedAccommodationId && String(row.roomNumber || '').trim() ? getRequestedRoomCount(row) : 0
  ), 0)
  const accommodationGuests = rows.reduce((sum, row) => sum + Math.max(0, Number(row.adults_count || 0)) + Math.max(0, Number(row.children_count || 0)), 0)
  const reminderDays = normalizeReminderDays(project?.accommodation_reminder_days)
  const dateChangeConfirmationRequired = requiresDateChangeConfirmation(project, reminderDeliveries)

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

      const [responseResult, accommodationResult, reminderResult] = await Promise.all([
        supabase
          .from('rsvp_responses')
          .select('*')
          .eq('project_id', projectData.id)
          .eq('needs_accommodation', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('accommodation_options')
          .select('*')
          .eq('project_id', projectData.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('accommodation_reminder_deliveries')
          .select('id, rsvp_response_id, wedding_date, reminder_days, status, accepted_at, last_error, created_at')
          .eq('project_id', projectData.id)
          .order('created_at', { ascending: false }),
      ])

      const { data: responseData, error: responseError } = responseResult
      const { data: accommodationData, error: accommodationError } = accommodationResult
      const { data: reminderData, error: reminderError } = reminderResult

      if (responseError || accommodationError || reminderError) {
        console.error(responseError || accommodationError || reminderError)
        setLoading(false)
        return
      }

      setAccommodations((accommodationData || []).map(mapAccommodationOption))
      setRows((responseData || []).map(mapAccommodationRow))
      setReminderDeliveries(reminderData || [])

      setLoading(false)
    }

    if (slug) loadAccommodationRows()
  }, [slug, router, demoProject])

  function updateField(id, field, value) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    )
  }

  function updateAccommodationField(id, field, value) {
    setAccommodations((current) =>
      current.map((option) => (option.id === id ? { ...option, [field]: value } : option))
    )
  }

  function addAccommodation() {
    setAccommodations((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        project_id: project?.id || null,
        name: '',
        address: '',
        checkIn: '',
        checkOut: '',
        guestNote: '',
        isNew: true,
      },
    ])
  }

  async function saveAccommodation(option) {
    if (!String(option.name || '').trim()) {
      setStatus('Doplňte názov ubytovania.')
      return
    }

    setStatus('')
    setSavingAccommodationId(option.id)

    if (demoProject) {
      setAccommodations((current) => current.map((item) => (
        item.id === option.id ? { ...item, isNew: false } : item
      )))
      setStatus('Ubytovanie bolo uložené v ukážke.')
      setSavingAccommodationId(null)
      return
    }

    const payload = {
      id: option.id,
      project_id: project.id,
      name: option.name.trim(),
      address: option.address.trim() || null,
      check_in: option.checkIn.trim() || null,
      check_out: option.checkOut.trim() || null,
      guest_note: option.guestNote.trim() || null,
    }
    const { data, error } = await supabase
      .from('accommodation_options')
      .upsert(payload)
      .select('*')
      .single()

    if (error) {
      console.error('Accommodation option save error:', error)
      setStatus(`Ubytovanie sa nepodarilo uložiť: ${error.message}`)
      setSavingAccommodationId(null)
      return
    }

    setAccommodations((current) => current.map((item) => (
      item.id === option.id ? mapAccommodationOption(data) : item
    )))
    setStatus('Ubytovanie bolo uložené.')
    setSavingAccommodationId(null)
  }

  async function removeAccommodation(option) {
    setStatus('')
    if (!demoProject && !option.isNew) {
      const { error } = await supabase
        .from('accommodation_options')
        .delete()
        .eq('id', option.id)

      if (error) {
        console.error('Accommodation option delete error:', error)
        setStatus(`Ubytovanie sa nepodarilo odstrániť: ${error.message}`)
        return
      }
    }

    setAccommodations((current) => current.filter((item) => item.id !== option.id))
    setRows((current) => current.map((row) => (
      row.assignedAccommodationId === option.id
        ? { ...row, assignedAccommodationId: '' }
        : row
    )))
    setStatus('Ubytovanie bolo odstránené.')
  }

  async function saveRow(row) {
    setStatus('')
    setSavingId(row.id)

    const selectedAccommodation = accommodations.find((option) => option.id === row.assignedAccommodationId)
    const payload = {
      accommodation_option_id: row.assignedAccommodationId || null,
      accommodation_hotel: selectedAccommodation?.name || null,
      accommodation_room: row.roomNumber || null,
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

  async function sendAccommodationEmail(draft) {
    setStatus('')
    setSendingEmail(true)

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (!accessToken) {
      setStatus('Prihlásenie vypršalo. Prihláste sa, prosím, znova.')
      setSendingEmail(false)
      return
    }

    try {
      const response = await fetch('/api/accommodation-email', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response_id: draft.responseId,
          subject: draft.subject,
          body: draft.body,
        }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) throw new Error(result.error || 'E-mail sa nepodarilo odoslať.')

      setRows((current) => current.map((row) => (
        row.id === draft.responseId ? { ...row, emailSentAt: result.sent_at } : row
      )))
      setStatus('E-mail s informáciami o ubytovaní bol odoslaný.')
      setEmailDraft(null)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'E-mail sa nepodarilo odoslať.')
    } finally {
      setSendingEmail(false)
    }
  }

  async function saveReminderSetting(value) {
    const days = normalizeReminderDays(value)
    setStatus('')
    setSavingReminderSetting(true)

    if (demoProject) {
      setProject((current) => ({
        ...current,
        accommodation_reminder_days: days,
        accommodation_reminder_setting_updated_at: new Date().toISOString(),
      }))
      setStatus(days ? `V ukážke je pripomienka nastavená ${days === 1 ? '1 deň' : '2 dni'} pred svadbou.` : 'V ukážke je pripomienka vypnutá.')
      setSavingReminderSetting(false)
      return
    }

    const { data, error } = await supabase
      .from('projects')
      .update({ accommodation_reminder_days: days })
      .eq('id', project.id)
      .select('*')
      .single()

    if (error) {
      console.error('Accommodation reminder setting save error:', error)
      setStatus('Nastavenie pripomienky sa nepodarilo uložiť.')
    } else {
      setProject(data)
      setStatus(days ? `Pripomienka je nastavená ${days === 1 ? '1 deň' : '2 dni'} pred svadbou.` : 'Automatická pripomienka je vypnutá.')
    }
    setSavingReminderSetting(false)
  }

  async function confirmReminderForChangedDate() {
    if (!project?.wedding_date) return
    setStatus('')
    setConfirmingDateChange(true)

    if (demoProject) {
      setProject((current) => ({
        ...current,
        accommodation_reminder_resend_confirmed_for_date: current.wedding_date,
      }))
      setStatus('Nová pripomienka pre zmenený dátum bola v ukážke potvrdená.')
      setConfirmingDateChange(false)
      return
    }

    const { data, error } = await supabase
      .from('projects')
      .update({ accommodation_reminder_resend_confirmed_for_date: project.wedding_date })
      .eq('id', project.id)
      .select('*')
      .single()

    if (error) {
      console.error('Accommodation reminder date confirmation error:', error)
      setStatus('Potvrdenie nového dátumu sa nepodarilo uložiť.')
    } else {
      setProject(data)
      setStatus('Odoslanie pripomienky pre nový dátum svadby bolo potvrdené.')
    }
    setConfirmingDateChange(false)
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

      <section aria-label="Nastavenie automatickej pripomienky" style={reminderSettingsStyle}>
        <div style={reminderSettingsCopyStyle}>
          <p style={composerEyebrowStyle}>Automatická pripomienka ubytovania</p>
          <h2 style={reminderSettingsTitleStyle}>Informácie hosťom pripomenieme pred svadbou</h2>
          <p style={reminderSettingsHelpStyle}>
            Pripomienku dostanú iba hostia s priradeným ubytovaním a e-mailom, ktorým ste už poslali prvé informácie cez YesDay. Použijú sa údaje aktuálne v čase odoslania.
          </p>
        </div>
        <label style={reminderSelectLabelStyle}>
          <span style={labelTextStyle}>Kedy odoslať</span>
          <select
            value={reminderDays || ''}
            onChange={(event) => saveReminderSetting(event.target.value)}
            disabled={savingReminderSetting}
            style={inputStyle}
          >
            <option value="2">2 dni pred svadbou</option>
            <option value="1">1 deň pred svadbou</option>
            <option value="">Vypnuté</option>
          </select>
        </label>
        {dateChangeConfirmationRequired ? (
          <div style={dateConfirmationStyle}>
            <div>
              <strong style={dateConfirmationTitleStyle}>Dátum svadby sa po odoslaní pripomienky zmenil</strong>
              <p style={dateConfirmationTextStyle}>Ďalšiu automatickú pripomienku neodošleme, kým ju výslovne nepotvrdíte pre dátum {formatWeddingDate(project.wedding_date)}.</p>
            </div>
            <button
              type="button"
              onClick={confirmReminderForChangedDate}
              disabled={confirmingDateChange}
              style={emailButtonStyle}
            >
              {confirmingDateChange ? 'Potvrdzujem...' : 'Povoliť pre nový dátum'}
            </button>
          </div>
        ) : null}
      </section>

      <section aria-label="Zoznam ubytovaní" style={catalogStyle}>
        <div style={catalogHeaderStyle}>
          <div>
            <p style={composerEyebrowStyle}>Ubytovania</p>
            <h2 style={catalogTitleStyle}>Hotely a informácie pre hostí</h2>
            <p style={catalogHelpStyle}>Každé ubytovanie vyplníte iba raz. Pri hosťovi potom vyberiete hotel, doplníte číslo izby a jedným klikom mu odošlete e-mail s adresou, check-inom, check-outom aj číslom izby.</p>
          </div>
          <button type="button" onClick={addAccommodation} style={emailButtonStyle}>+ Pridať ubytovanie</button>
        </div>

        {accommodations.length === 0 ? (
          <div style={catalogEmptyStyle}>
            <p style={emptyStyle}>Zatiaľ nemáte pridané žiadne ubytovanie.</p>
            <button type="button" onClick={addAccommodation} style={saveButtonStyle}>Pridať prvé ubytovanie</button>
          </div>
        ) : (
          accommodations.map((option) => (
            <article key={option.id} style={accommodationOptionStyle}>
              <div style={fieldsGridStyle}>
                <label style={labelStyle}>
                  <span style={labelTextStyle}>Názov ubytovania</span>
                  <input
                    value={option.name}
                    onChange={(event) => updateAccommodationField(option.id, 'name', event.target.value)}
                    placeholder="Napr. Hotel Park"
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  <span style={labelTextStyle}>Adresa</span>
                  <input
                    value={option.address}
                    onChange={(event) => updateAccommodationField(option.id, 'address', event.target.value)}
                    placeholder="Ulica, mesto"
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  <span style={labelTextStyle}>Check-in</span>
                  <input
                    value={option.checkIn}
                    onChange={(event) => updateAccommodationField(option.id, 'checkIn', event.target.value)}
                    placeholder="Napr. 18. 9. 2027 od 14:00"
                    style={inputStyle}
                  />
                </label>
                <label style={labelStyle}>
                  <span style={labelTextStyle}>Check-out</span>
                  <input
                    value={option.checkOut}
                    onChange={(event) => updateAccommodationField(option.id, 'checkOut', event.target.value)}
                    placeholder="Napr. 19. 9. 2027 do 10:00"
                    style={inputStyle}
                  />
                </label>
              </div>
              <label style={labelStyle}>
                <span style={labelTextStyle}>Informácie pre hostí</span>
                <textarea
                  value={option.guestNote}
                  onChange={(event) => updateAccommodationField(option.id, 'guestNote', event.target.value)}
                  placeholder="Napr. raňajky sú v cene, parkovanie je za hotelom alebo ako prebehne prevzatie kľúčov."
                  rows={3}
                  style={textareaStyle}
                />
              </label>
              <div style={actionsStyle}>
                <button
                  type="button"
                  onClick={() => saveAccommodation(option)}
                  disabled={savingAccommodationId === option.id}
                  style={saveButtonStyle}
                >
                  {savingAccommodationId === option.id ? 'Ukladám...' : 'Uložiť ubytovanie'}
                </button>
                <button type="button" onClick={() => removeAccommodation(option)} style={removeButtonStyle}>Odstrániť</button>
              </div>
            </article>
          ))
        )}
      </section>

      {emailDraft ? (
        <EmailComposer
          draft={emailDraft}
          isDemo={Boolean(demoProject)}
          sending={sendingEmail}
          onChange={setEmailDraft}
          onClose={() => setEmailDraft(null)}
          onSend={sendAccommodationEmail}
        />
      ) : null}

      {reminderPreview ? (
        <ReminderPreview
          preview={reminderPreview}
          onClose={() => setReminderPreview(null)}
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
              <ReminderStatus
                project={project}
                row={row}
                deliveries={reminderDeliveries}
              />
            </div>

            <div style={guestAssignmentGridStyle}>
              <label style={labelStyle}>
                <span style={labelTextStyle}>Priradené ubytovanie</span>
                <select
                  value={row.assignedAccommodationId}
                  onChange={(event) => updateField(row.id, 'assignedAccommodationId', event.target.value)}
                  style={inputStyle}
                >
                  <option value="">Vyberte ubytovanie</option>
                  {accommodations.filter((option) => !option.isNew && option.name.trim()).map((option) => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
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
            </div>

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
                    onClick={() => setEmailDraft(buildAccommodationEmailDraft(
                      row,
                      project,
                      accommodations.find((option) => option.id === row.assignedAccommodationId)
                    ))}
                    style={emailButtonStyle}
                  >
                    Pripraviť e-mail
                  </button>
                  {row.emailSentAt ? (
                    <button
                      type='button'
                      onClick={() => updateEmailStatus(row, false)}
                      disabled={savingEmailStatusId === row.id}
                      style={statusButtonStyle}
                    >
                      {savingEmailStatusId === row.id ? 'Ukladám stav...' : 'Označiť ako neodoslané'}
                    </button>
                  ) : null}
                  {reminderDays && row.assignedAccommodationId ? (
                    <button
                      type="button"
                      onClick={() => setReminderPreview(buildReminderPreview(
                        row,
                        project,
                        accommodations.find((option) => option.id === row.assignedAccommodationId),
                        reminderDays
                      ))}
                      style={previewButtonStyle}
                    >
                      Náhľad pripomienky
                    </button>
                  ) : null}
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
    assignedAccommodationId: row.accommodation_option_id || '',
    roomNumber: row.accommodation_room || row.room_number || row.assigned_room || '',
    internalNote: row.accommodation_internal_note || row.internal_note || row.accommodation_note || '',
    emailSentAt: row.accommodation_email_sent_at || null,
  }
}

function mapAccommodationOption(option) {
  return {
    ...option,
    address: option.address || '',
    checkIn: option.check_in || option.checkIn || '',
    checkOut: option.check_out || option.checkOut || '',
    guestNote: option.guest_note || option.guestNote || '',
    isNew: false,
  }
}

function buildDemoAccommodationOptions(rows) {
  const options = []
  const optionByName = new Map()

  rows.filter((row) => row.needs_accommodation).forEach((row) => {
    const name = String(row.accommodation_hotel || '').trim()
    if (!name || optionByName.has(name)) return
    const option = mapAccommodationOption({
      id: `demo-accommodation-${options.length + 1}`,
      name,
      address: row.accommodation_hotel_address || '',
      check_in: row.accommodation_check_in || '',
      check_out: row.accommodation_check_out || '',
      guest_note: row.accommodation_guest_note || '',
    })
    options.push(option)
    optionByName.set(name, option)
  })

  return options
}

function buildAccommodationEmailDraft(row, project, accommodation) {
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
    `Ubytovanie: ${accommodation?.name || 'bude doplnené'}`,
    accommodation?.address ? `Adresa: ${accommodation.address}` : '',
    `Izba: ${row.roomNumber || 'bude doplnená'}`,
    accommodation?.checkIn ? `Check-in: ${accommodation.checkIn}` : '',
    accommodation?.checkOut ? `Check-out: ${accommodation.checkOut}` : '',
    '',
    accommodation?.guestNote || '',
    '',
    'Ak by ste mali akékoľvek otázky, pokojne sa nám ozvite.',
    '',
    'Tešíme sa na vás!',
    coupleName || 'Nevesta a ženích',
  ].filter((line, index, lines) => line || lines[index - 1] !== '').join('\n')

  return { responseId: row.id, email, subject, body }
}

function buildAccommodationEmailHref(draft) {
  return `mailto:${encodeURIComponent(draft.email)}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`
}

function buildReminderPreview(row, project, accommodation, reminderDays) {
  return {
    greeting: row.guest_name ? `Dobrý deň, ${row.guest_name},` : 'Dobrý deň,',
    intro: `${reminderDays === 1 ? 'už zajtra' : 'už o dva dni'} sa uskutoční svadba, na ktorú vás pozývajú ${project?.couple_display_name || 'nevesta a ženích'}. Aby ste mali všetko potrebné poruke, posielame vám krátke pripomenutie informácií o vašom ubytovaní.`,
    details: [
      ['Dátum svadby', formatWeddingDate(project?.wedding_date)],
      ['Ubytovanie', accommodation?.name],
      ['Adresa', accommodation?.address],
      ['Izba', row.roomNumber],
      ['Check-in', accommodation?.checkIn],
      ['Check-out', accommodation?.checkOut],
    ].filter(([, value]) => String(value || '').trim()),
    note: accommodation?.guestNote || '',
    couple: project?.couple_display_name || 'Nevesta a ženích',
  }
}

function EmailComposer({ draft, isDemo, sending, onChange, onClose, onSend }) {
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
          <>
            <button type="button" onClick={() => onSend(draft)} disabled={sending} style={saveButtonStyle}>
              {sending ? 'Odosielam...' : 'Odoslať hosťovi cez YesDay'}
            </button>
            <a href={buildAccommodationEmailHref(draft)} style={emailButtonStyle}>
              Otvoriť v mojej e-mailovej aplikácii
            </a>
          </>
        )}
        <span style={composerHelpStyle}>Pred odoslaním môžete predmet aj text upraviť.</span>
      </div>
    </section>
  )
}

function ReminderPreview({ preview, onClose }) {
  return (
    <section aria-label="Náhľad automatickej pripomienky" style={reminderPreviewStyle}>
      <div style={headRowStyle}>
        <div>
          <p style={composerEyebrowStyle}>Náhľad bez odoslania</p>
          <h3 style={composerTitleStyle}>Pripomienka ubytovania</h3>
        </div>
        <button type="button" onClick={onClose} style={closeButtonStyle}>Zavrieť</button>
      </div>
      <div style={reminderPreviewBodyStyle}>
        <p style={reminderPreviewParagraphStyle}>{preview.greeting}</p>
        <p style={reminderPreviewParagraphStyle}>{preview.intro}</p>
        <dl style={reminderPreviewDetailsStyle}>
          {preview.details.map(([label, value]) => (
            <div key={label} style={reminderPreviewDetailRowStyle}>
              <dt style={reminderPreviewTermStyle}>{label}</dt>
              <dd style={reminderPreviewValueStyle}>{value}</dd>
            </div>
          ))}
        </dl>
        {preview.note ? <p style={reminderPreviewNoteStyle}>{preview.note}</p> : null}
        <p style={reminderPreviewParagraphStyle}>Tešíme sa na vás!<br />{preview.couple}</p>
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

function formatWeddingDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return value || '—'
  return new Intl.DateTimeFormat('sk-SK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))))
}

function ReminderStatus({ project, row, deliveries }) {
  const reminder = getReminderStatus({ project, guest: row, deliveries })
  const timestamp = reminder.timestamp && reminder.code === 'accepted'
    ? ` · ${formatEmailDate(reminder.timestamp)}`
    : ''

  return (
    <div style={reminderStatusRowStyle}>
      <span style={reminderStatusBadgeStyle(reminder.code)}>{reminder.label}{timestamp}</span>
      <span style={reminderStatusDetailStyle}>{reminder.detail}</span>
    </div>
  )
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

const reminderSettingsStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '18px',
  alignItems: 'end',
  padding: '20px',
  border: '1px solid rgba(176, 139, 105, 0.24)',
  background: '#fffaf5',
}

const reminderSettingsCopyStyle = { minWidth: 0 }

const reminderSettingsTitleStyle = {
  margin: '7px 0 8px',
  color: '#4f4035',
  fontSize: '22px',
  fontWeight: 400,
}

const reminderSettingsHelpStyle = {
  maxWidth: '720px',
  margin: 0,
  color: '#76685e',
  fontSize: '14px',
  lineHeight: 1.65,
}

const reminderSelectLabelStyle = {
  display: 'grid',
  gap: '7px',
  alignSelf: 'center',
}

const dateConfirmationStyle = {
  gridColumn: '1 / -1',
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '14px',
  padding: '15px 16px',
  border: '1px solid #d6b8ac',
  background: '#fbf2ed',
}

const dateConfirmationTitleStyle = { color: '#654b42', fontSize: '14px', fontWeight: 600 }
const dateConfirmationTextStyle = { margin: '5px 0 0', color: '#765f56', fontSize: '13px', lineHeight: 1.5 }

const reminderStatusRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '7px 10px',
  marginTop: '9px',
}

const reminderStatusBadgeStyle = (code) => {
  const colors = {
    accepted: ['#e8f2eb', '#496451'],
    scheduled: ['#eee9f3', '#665671'],
    processing_window: ['#eee9f3', '#665671'],
    processing: ['#eee9f3', '#665671'],
    needs_review: ['#f8eadf', '#865d3f'],
    failed: ['#f8e5e3', '#8a4e4b'],
    confirmation_required: ['#f8eadf', '#865d3f'],
    missed: ['#eeeae7', '#706661'],
  }
  const [background, color] = colors[code] || ['#f2efed', '#736b67']
  return {
    display: 'inline-flex',
    padding: '5px 8px',
    background,
    color,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '.03em',
  }
}

const reminderStatusDetailStyle = { color: '#80736a', fontSize: '12px', lineHeight: 1.45 }

const previewButtonStyle = {
  appearance: 'none',
  border: 0,
  borderBottom: '1px solid #9b7c62',
  background: 'transparent',
  color: '#765f4e',
  padding: '7px 2px 5px',
  fontFamily: 'inherit',
  fontSize: '12px',
  cursor: 'pointer',
}

const reminderPreviewStyle = {
  padding: '20px',
  border: '1px solid rgba(176, 139, 105, 0.26)',
  background: '#f8f2ed',
}

const reminderPreviewBodyStyle = {
  maxWidth: '620px',
  marginTop: '16px',
  padding: 'clamp(20px, 5vw, 36px)',
  border: '1px solid #eadfd9',
  background: '#fffdfb',
  color: '#454043',
  lineHeight: 1.7,
}

const reminderPreviewParagraphStyle = { margin: '0 0 18px' }
const reminderPreviewDetailsStyle = { margin: '20px 0', padding: '14px 18px', background: '#fffaf7' }
const reminderPreviewDetailRowStyle = { display: 'grid', gridTemplateColumns: 'minmax(90px, .45fr) 1fr', gap: '12px', padding: '6px 0' }
const reminderPreviewTermStyle = { color: '#9b777c', fontSize: '10px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }
const reminderPreviewValueStyle = { margin: 0, minWidth: 0 }
const reminderPreviewNoteStyle = { margin: '20px 0', padding: '14px 16px', borderLeft: '2px solid #c9aeb1', background: '#f7f2ef' }

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

const guestAssignmentGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '10px',
}

const catalogStyle = {
  border: '1px solid rgba(95, 72, 56, 0.22)',
  background: '#f8f2ea',
  padding: '20px',
  display: 'grid',
  gap: '14px',
}

const catalogHeaderStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '18px',
  flexWrap: 'wrap',
}

const catalogTitleStyle = {
  margin: 0,
  color: '#3f3128',
  fontSize: '24px',
  fontWeight: 400,
}

const catalogHelpStyle = {
  margin: '7px 0 0',
  color: '#6f5b4b',
  fontSize: '13px',
  lineHeight: 1.55,
}

const catalogEmptyStyle = {
  border: '1px dashed rgba(95, 72, 56, 0.28)',
  background: 'rgba(255, 251, 246, 0.65)',
  padding: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  flexWrap: 'wrap',
}

const accommodationOptionStyle = {
  ...cardStyle,
  background: '#fffaf5',
  padding: '16px',
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

const removeButtonStyle = {
  ...emailButtonStyle,
  borderColor: 'transparent',
  color: '#8a6b5f',
}

const statusButtonStyle = {
  ...emailButtonStyle,
  borderColor: 'rgba(95, 72, 56, 0.28)',
  color: '#6f5b4b',
}
