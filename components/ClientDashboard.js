'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import supabase from '../lib/supabase'

export default function ClientDashboard({ slug: slugProp }) {
  const params = useParams()
  const slug = slugProp || params?.slug
  const router = useRouter()

  const [project, setProject] = useState(null)
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [activeSummary, setActiveSummary] = useState(null)

  const packageType = String(project?.package_type || 'signature').toLowerCase().trim()
  const showAccommodationAndTransport = packageType === 'signature' || packageType === 'atelier'

  useEffect(() => {
    async function loadDashboard() {
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

      const { data: responseData, error: responseError } = await fetchProjectResponses(projectData.id)

      if (responseError) console.error(responseError)

      setProject(projectData)
      setResponses(responseData || [])
      setLoading(false)
    }

    if (slug) loadDashboard()
  }, [slug, router])

  useEffect(() => {
    const projectId = project?.id
    if (!projectId) return undefined

    let active = true
    let refreshTimer = null

    async function refreshResponses() {
      const { data, error } = await fetchProjectResponses(projectId)

      if (error) {
        console.error('Realtime dashboard refresh error:', error)
        return
      }

      if (active) setResponses(data || [])
    }

    function scheduleRefresh() {
      if (refreshTimer) window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(refreshResponses, 120)
    }

    const channel = supabase
      .channel(`dashboard-rsvp-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rsvp_responses',
          filter: `project_id=eq.${projectId}`,
        },
        scheduleRefresh
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime dashboard subscription failed.')
        }
      })

    return () => {
      active = false
      if (refreshTimer) window.clearTimeout(refreshTimer)
      supabase.removeChannel(channel)
    }
  }, [project?.id])

  const stats = useMemo(() => {
    const attending = responses.filter((r) => r.attending === 'yes')
    const people = attending.flatMap((r) => Array.isArray(r.people) ? r.people : [])

    return {
      totalResponses: responses.length,
      attendingResponses: attending.length,
      adults: attending.reduce((sum, r) => sum + Number(r.adults_count || 0), 0),
      children: attending.reduce((sum, r) => sum + Number(r.children_count || 0), 0),
      totalGuests: attending.reduce((sum, r) => sum + Number(r.adults_count || 0) + Number(r.children_count || 0), 0),
      accommodation: attending.filter((r) => r.needs_accommodation).length,
      transportRequests: responses.filter((r) => hasTransportRequest(r)).length,
      allergies: people.filter((p) => hasRealAllergy(p.allergies)).length,
    }
  }, [responses])

  const summaryData = useMemo(() => {
    const attending = responses.filter((response) => response.attending === 'yes')
    const guests = attending.flatMap((response) => normalizeResponsePeople(response))

    return {
      adults: guests.filter((guest) => guest.type === 'adult'),
      children: guests.filter((guest) => guest.type === 'child'),
      allergies: guests.filter((guest) => hasRealAllergy(guest.allergies)),
      accommodation: attending
        .filter((response) => response.needs_accommodation)
        .map((response) => normalizeResponseGroup(response)),
      transport: responses
        .filter((response) => hasTransportRequest(response))
        .map((response) => normalizeResponseGroup(response, getTransport(response))),
    }
  }, [responses])

  const filteredResponses = responses.filter((row) => {
    const peopleText = Array.isArray(row.people)
      ? row.people.map((p) => `${p.name} ${p.menu} ${p.allergies}`).join(' ')
      : ''

    const haystack = `
      ${row.guest_name || ''}
      ${row.message || ''}
      ${row.contact_email || ''}
      ${row.contact_phone || ''}
      ${peopleText}
    `.toLowerCase()

    const matchesSearch = haystack.includes(search.toLowerCase())

    if (!matchesSearch) return false
    if (filter === 'attending') return row.attending === 'yes'
    if (filter === 'declined') return row.attending === 'no'
    if (filter === 'accommodation') return showAccommodationAndTransport && row.needs_accommodation
    if (filter === 'allergies') {
      return Array.isArray(row.people) && row.people.some((p) => hasRealAllergy(p.allergies))
    }

    return true
  })

  function hasRealAllergy(value) {
    const clean = String(value || '').toLowerCase().trim().replace(/[.!?,]/g, '')

    const noAllergyValues = [
      '', 'nie', 'nema', 'nemá', 'ziadne', 'žiadne',
      'bez', 'bez alergii', 'bez alergií', 'bez alergie'
    ]

    return !noAllergyValues.includes(clean)
  }

  function menuLabel(value) {
    const labels = {
      meat: 'Mäsové',
      vegetarian: 'Vegetariánske',
      vegan: 'Vegánske',
      child: 'Detské',
      other: 'Iné',
    }

    return labels[value] || value || '-'
  }

  function formatDate(value) {
    if (!value) return '-'
    return new Date(value).toLocaleString('sk-SK')
  }

  function attendanceLabel(value) {
    if (value === 'yes') return 'Áno, prídu'
    if (value === 'no') return 'Nie, neprídu'
    return value || '-'
  }

  function getTransport(row) {
    return row.transport || row.transport_note || row.transport_details || ''
  }

  function hasTransportRequest(row) {
    if (row.transport_needed === true || row.wants_transport === true) {
      return true
    }

    const transportValue = row.transport
    if (typeof transportValue === 'boolean') {
      return transportValue
    }

    if (typeof transportValue === 'string' && transportValue.trim()) {
      return true
    }

    const transportNote = row.transport_note
    if (typeof transportNote === 'string' && transportNote.trim()) {
      return true
    }

    const transportDetails = row.transport_details
    if (typeof transportDetails === 'string' && transportDetails.trim()) {
      return true
    }

    return false
  }

  function displayValue(value) {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'string' && !value.trim()) return '—'
    return value
  }

  function formatFamilyName(row) {
    if (row.family_name) return row.family_name
    if (row.last_name) return row.last_name

    const name = String(row.guest_name || '').trim()
    if (!name.includes(' ')) return '-'

    const parts = name.split(/\s+/)
    return parts.slice(1).join(' ') || '-'
  }

  if (loading) {
    return <main style={{ padding: 40 }}>Načítavam dashboard...</main>
  }

  if (accessDenied) {
    return <main style={{ padding: 40 }}>Access denied</main>
  }

  return (
    <main style={pageStyle}>
      <h1 style={titleStyle}>{project?.couple_display_name || 'Dashboard'}</h1>

      <section style={statsGridStyle}>
        <StatCard label="RSVP odpovede" value={stats.totalResponses} />
        <StatCard label="Prichádzajúce odpovede" value={stats.attendingResponses} />
        <StatCard
          label="Dospelí spolu"
          value={stats.adults}
          onClick={() => setActiveSummary('adults')}
        />
        <StatCard
          label="Deti spolu"
          value={stats.children}
          onClick={() => setActiveSummary('children')}
        />
        <StatCard label="Hostia spolu" value={stats.totalGuests} />
        <StatCard
          label="Počet alergií"
          value={stats.allergies}
          onClick={() => setActiveSummary('allergies')}
        />
        {showAccommodationAndTransport ? (
          <StatCard
            label="Žiadosti o ubytovanie"
            value={stats.accommodation}
            onClick={() => setActiveSummary('accommodation')}
          />
        ) : null}
        {showAccommodationAndTransport ? (
          <StatCard
            label="Žiadosti o transport"
            value={stats.transportRequests}
            onClick={() => setActiveSummary('transport')}
          />
        ) : null}
      </section>

      {activeSummary ? (
        <SummaryModal
          type={activeSummary}
          items={summaryData[activeSummary] || []}
          onClose={() => setActiveSummary(null)}
        />
      ) : null}

      <section style={toolbarStyle}>
        <input
          type="text"
          placeholder="Hľadať podľa mena, poznámky alebo kontaktu"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={inputStyle}
        />

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          style={selectStyle}
        >
          <option value="all">Všetky odpovede</option>
          <option value="attending">Len prídu</option>
          <option value="declined">Len neprídu</option>
          {showAccommodationAndTransport ? (
            <option value="accommodation">S ubytovaním</option>
          ) : null}
          <option value="allergies">S alergiami</option>
        </select>
      </section>

      <section style={responseListStyle}>
        {filteredResponses.length === 0 ? (
          <p style={emptyStyle}>Zatiaľ tu nie sú žiadne odpovede, ktoré zodpovedajú filtru.</p>
        ) : (
          filteredResponses.map((row) => {
            const people = Array.isArray(row.people) ? row.people : []
            const transport = getTransport(row)

            return (
              <article key={row.id} style={responseCardStyle}>
                <div style={rowHeaderStyle}>
                  <h2 style={rowTitleStyle}>{displayValue(row.guest_name)}</h2>
                  <span style={statusBadgeStyle(row.attending)}>{attendanceLabel(row.attending)}</span>
                </div>

                <div style={metaGridStyle}>
                  <MetaItem label="Priezvisko / rodina" value={displayValue(formatFamilyName(row))} />
                  <MetaItem label="Dospelí" value={displayValue(row.adults_count)} />
                  <MetaItem label="Deti" value={displayValue(row.children_count)} />
                  <MetaItem label="Vytvorené" value={formatDate(row.created_at)} />
                </div>

                <div style={sectionBlockStyle}>
                  <h3 style={sectionTitleStyle}>Výber jedla a alergie</h3>
                  {people.length > 0 ? (
                    <div style={peopleGridStyle}>
                      {people.map((person, index) => (
                        <div key={`${row.id}-person-${index}`} style={personCardStyle}>
                          <p style={personNameStyle}>{displayValue(person.name)}</p>
                          <p style={personMetaStyle}>Menu: {menuLabel(person.menu)}</p>
                          <p style={personMetaStyle}>
                            Alergie: {hasRealAllergy(person.allergies) ? displayValue(person.allergies) : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={emptyInlineStyle}>—</p>
                  )}
                </div>

                <div style={detailGridStyle}>
                  {showAccommodationAndTransport ? (
                    <DetailItem
                      label="Ubytovanie"
                      value={row.needs_accommodation === true ? 'Áno' : row.needs_accommodation === false ? 'Nie' : '—'}
                    />
                  ) : null}

                  {showAccommodationAndTransport ? (
                    <DetailItem
                      label="Detaily ubytovania"
                      value={displayValue([row.contact_email, row.contact_phone].filter(Boolean).join(' | '))}
                    />
                  ) : null}

                  {showAccommodationAndTransport ? (
                    <DetailItem label="Doprava" value={displayValue(transport)} />
                  ) : null}

                  <DetailItem label="Poznámka" value={displayValue(row.message)} />
                </div>
              </article>
            )
          })
        )}
      </section>
    </main>
  )
}

function fetchProjectResponses(projectId) {
  return supabase
    .from('rsvp_responses')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
}

function normalizeResponsePeople(response) {
  const adultsCount = Math.max(0, Number(response.adults_count || 0))
  const childrenCount = Math.max(0, Number(response.children_count || 0))
  const people = Array.isArray(response.people) ? response.people : []
  const expectedCount = adultsCount + childrenCount
  const slots = Math.max(expectedCount, people.length)

  return Array.from({ length: slots }, (_, index) => {
    const person = people[index] || {}
    const storedType = String(person.type || '').toLowerCase()
    const inferredType = index < adultsCount ? 'adult' : 'child'

    return {
      name: String(person.name || (index === 0 ? response.guest_name : '') || 'Neuvedené meno').trim(),
      type: storedType === 'adult' || storedType === 'child' ? storedType : inferredType,
      allergies: person.allergies || '',
    }
  })
}

function normalizeResponseGroup(response, transportDetails = '') {
  const members = normalizeResponsePeople(response)
    .map((person) => person.name)
    .filter(Boolean)

  return {
    id: response.id,
    name: String(response.family_name || response.guest_name || 'Neuvedená skupina').trim(),
    members,
    adultsCount: Math.max(0, Number(response.adults_count || 0)),
    childrenCount: Math.max(0, Number(response.children_count || 0)),
    contact: [response.contact_email, response.contact_phone].filter(Boolean).join(' · '),
    transportDetails: String(transportDetails || '').trim(),
  }
}

function StatCard({ label, value, onClick }) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{ ...statCardStyle, ...interactiveStatCardStyle }}
        aria-label={`${label}: ${value ?? 0}. Zobraziť zoznam.`}
      >
        <p style={statLabelStyle}>{label}</p>
        <p style={statValueStyle}>{value ?? '—'}</p>
        <span style={statActionStyle}>Zobraziť zoznam</span>
      </button>
    )
  }

  return (
    <article style={statCardStyle}>
      <p style={statLabelStyle}>{label}</p>
      <p style={statValueStyle}>{value ?? '—'}</p>
    </article>
  )
}

function SummaryModal({ type, items, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const isAllergySummary = type === 'allergies'
  const isGroupSummary = type === 'accommodation' || type === 'transport'
  const titles = {
    adults: 'Zoznam dospelých',
    children: 'Zoznam detí',
    allergies: 'Sumár alergií',
    accommodation: 'Žiadosti o ubytovanie podľa skupín',
    transport: 'Žiadosti o transport',
  }

  return (
    <div
      style={modalBackdropStyle}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-summary-title"
        style={summaryModalStyle}
      >
        <div style={summaryModalHeaderStyle}>
          <div>
            <p style={summaryEyebrowStyle}>Dashboard sumár</p>
            <h2 id="dashboard-summary-title" style={summaryTitleStyle}>{titles[type]}</h2>
          </div>
          <button type="button" onClick={onClose} style={modalCloseButtonStyle} aria-label="Zavrieť sumár">
            ×
          </button>
        </div>

        <p style={summaryCountStyle}>
          {isGroupSummary ? 'Počet skupín' : 'Spolu'}: {items.length}
        </p>

        {items.length === 0 ? (
          <p style={summaryEmptyStyle}>
            {isGroupSummary
              ? 'V tejto kategórii zatiaľ nie sú žiadne požiadavky.'
              : 'V tejto kategórii zatiaľ nie sú žiadni hostia.'}
          </p>
        ) : isGroupSummary ? (
          <div style={groupSummaryListStyle}>
            {items.map((group, index) => (
              <article key={group.id || `${type}-${index}`} style={groupSummaryCardStyle}>
                <div style={groupSummaryHeaderStyle}>
                  <div>
                    <p style={groupSummaryLabelStyle}>Rodina / skupina</p>
                    <h3 style={groupSummaryNameStyle}>{group.name}</h3>
                  </div>
                  <p style={groupSummaryCountsStyle}>
                    {group.adultsCount} dospelí · {group.childrenCount} deti
                  </p>
                </div>

                <div style={groupSummaryDetailStyle}>
                  <p style={groupSummaryDetailLabelStyle}>Členovia skupiny</p>
                  <p style={groupSummaryDetailValueStyle}>
                    {group.members.length > 0 ? group.members.join(', ') : '—'}
                  </p>
                </div>

                {type === 'accommodation' ? (
                  <div style={groupSummaryDetailStyle}>
                    <p style={groupSummaryDetailLabelStyle}>Kontakt pre ubytovanie</p>
                    <p style={groupSummaryDetailValueStyle}>{group.contact || '—'}</p>
                  </div>
                ) : null}

                {type === 'transport' ? (
                  <div style={groupSummaryDetailStyle}>
                    <p style={groupSummaryDetailLabelStyle}>Požiadavka na transport</p>
                    <p style={groupSummaryDetailValueStyle}>{group.transportDetails || 'Áno'}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div style={summaryListStyle}>
            <div
              style={{
                ...summaryListHeaderStyle,
                ...(!isAllergySummary ? summarySingleColumnStyle : {}),
              }}
            >
              <span>Meno a priezvisko</span>
              {isAllergySummary ? <span>Typ alergie</span> : null}
            </div>
            {items.map((guest, index) => (
              <div
                key={`${type}-${guest.name}-${index}`}
                style={{
                  ...summaryListRowStyle,
                  ...(!isAllergySummary ? summarySingleColumnStyle : {}),
                }}
              >
                <span style={summaryNameStyle}>{guest.name}</span>
                {isAllergySummary ? (
                  <span style={summaryAllergyStyle}>{guest.allergies}</span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function MetaItem({ label, value }) {
  return (
    <div style={metaItemStyle}>
      <p style={metaLabelStyle}>{label}</p>
      <p style={metaValueStyle}>{value ?? '—'}</p>
    </div>
  )
}

function DetailItem({ label, value }) {
  return (
    <div style={detailItemStyle}>
      <p style={detailLabelStyle}>{label}</p>
      <p style={detailValueStyle}>{value ?? '—'}</p>
    </div>
  )
}

const pageStyle = {
  display: 'grid',
  gap: '16px',
}

const titleStyle = {
  margin: 0,
  fontSize: '28px',
  fontWeight: 'normal',
  color: '#3f3128',
}

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: '12px',
}

const statCardStyle = {
  background: 'rgba(255, 251, 246, 0.92)',
  border: '1px solid rgba(176, 139, 105, 0.2)',
  borderRadius: 0,
  padding: '12px 14px',
}

const interactiveStatCardStyle = {
  appearance: 'none',
  width: '100%',
  color: 'inherit',
  fontFamily: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
}

const statLabelStyle = {
  margin: 0,
  fontSize: '12px',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#8d735f',
}

const statValueStyle = {
  margin: '6px 0 0',
  fontSize: '26px',
  color: '#4a392d',
}

const statActionStyle = {
  display: 'block',
  marginTop: '8px',
  fontSize: '11px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#8d735f',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
}

const modalBackdropStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'grid',
  placeItems: 'center',
  padding: '20px',
  background: 'rgba(42, 32, 25, 0.5)',
}

const summaryModalStyle = {
  width: 'min(100%, 680px)',
  maxHeight: 'min(760px, calc(100vh - 40px))',
  overflowY: 'auto',
  padding: '28px',
  border: '1px solid rgba(115, 88, 66, 0.3)',
  borderRadius: 0,
  background: '#fffaf5',
  boxShadow: '0 28px 80px rgba(42, 32, 25, 0.24)',
}

const summaryModalHeaderStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '20px',
}

const summaryEyebrowStyle = {
  margin: 0,
  fontSize: '11px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: '#8d735f',
}

const summaryTitleStyle = {
  margin: '7px 0 0',
  fontSize: '30px',
  fontWeight: 'normal',
  color: '#3f3128',
}

const modalCloseButtonStyle = {
  display: 'grid',
  placeItems: 'center',
  flex: '0 0 38px',
  width: '38px',
  height: '38px',
  padding: 0,
  border: '1px solid rgba(115, 88, 66, 0.28)',
  borderRadius: 0,
  background: 'transparent',
  color: '#4f4035',
  cursor: 'pointer',
  fontSize: '25px',
  fontFamily: 'inherit',
  lineHeight: 1,
}

const summaryCountStyle = {
  margin: '22px 0 12px',
  color: '#6f5b4b',
  fontSize: '14px',
}

const summaryListStyle = {
  display: 'grid',
  borderTop: '1px solid rgba(115, 88, 66, 0.24)',
}

const summaryListHeaderStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: '18px',
  padding: '11px 10px',
  borderBottom: '1px solid rgba(115, 88, 66, 0.24)',
  background: '#f4eadf',
  color: '#7c624f',
  fontSize: '11px',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
}

const summaryListRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: '18px',
  padding: '13px 10px',
  borderBottom: '1px solid rgba(115, 88, 66, 0.16)',
}

const summarySingleColumnStyle = {
  gridTemplateColumns: '1fr',
}

const summaryNameStyle = {
  color: '#3f3128',
}

const summaryAllergyStyle = {
  color: '#6f5b4b',
}

const summaryEmptyStyle = {
  margin: '20px 0 0',
  padding: '16px 0',
  borderTop: '1px solid rgba(115, 88, 66, 0.2)',
  color: '#6f5b4b',
}

const groupSummaryListStyle = {
  display: 'grid',
  gap: '12px',
}

const groupSummaryCardStyle = {
  display: 'grid',
  gap: '12px',
  padding: '16px',
  border: '1px solid rgba(115, 88, 66, 0.22)',
  borderRadius: 0,
  background: '#fffdf9',
}

const groupSummaryHeaderStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '18px',
  paddingBottom: '10px',
  borderBottom: '1px solid rgba(115, 88, 66, 0.16)',
}

const groupSummaryLabelStyle = {
  margin: 0,
  fontSize: '10px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#8d735f',
}

const groupSummaryNameStyle = {
  margin: '4px 0 0',
  fontSize: '19px',
  fontWeight: 'normal',
  color: '#3f3128',
}

const groupSummaryCountsStyle = {
  margin: 0,
  color: '#6f5b4b',
  fontSize: '13px',
  whiteSpace: 'nowrap',
}

const groupSummaryDetailStyle = {
  display: 'grid',
  gap: '3px',
}

const groupSummaryDetailLabelStyle = {
  margin: 0,
  fontSize: '10px',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: '#8d735f',
}

const groupSummaryDetailValueStyle = {
  margin: 0,
  color: '#4f4035',
  lineHeight: 1.5,
}

const toolbarStyle = {
  display: 'grid',
  gap: '10px',
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

const selectStyle = {
  ...inputStyle,
}

const responseListStyle = {
  display: 'grid',
  gap: '12px',
}

const responseCardStyle = {
  background: 'rgba(255, 251, 246, 0.9)',
  border: '1px solid rgba(176, 139, 105, 0.16)',
  borderRadius: 0,
  padding: '14px',
  display: 'grid',
  gap: '12px',
}

const rowHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
}

const rowTitleStyle = {
  margin: 0,
  fontSize: '20px',
  fontWeight: 'normal',
  color: '#3f3128',
}

const statusBadgeStyle = (attending) => ({
  padding: '5px 10px',
  borderRadius: 0,
  fontSize: '12px',
  color: attending === 'yes' ? '#2f5c3d' : '#7a3434',
  background: attending === 'yes' ? 'rgba(58, 128, 79, 0.14)' : 'rgba(176, 62, 62, 0.14)',
  border: attending === 'yes' ? '1px solid rgba(58, 128, 79, 0.2)' : '1px solid rgba(176, 62, 62, 0.2)',
})

const metaGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: '10px',
}

const metaItemStyle = {
  background: '#fffaf5',
  border: '1px solid rgba(176, 139, 105, 0.14)',
  borderRadius: 0,
  padding: '10px',
}

const metaLabelStyle = {
  margin: 0,
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#8a6f54',
}

const metaValueStyle = {
  margin: '6px 0 0',
  color: '#4f4035',
}

const sectionBlockStyle = {
  display: 'grid',
  gap: '8px',
}

const sectionTitleStyle = {
  margin: 0,
  fontSize: '14px',
  color: '#5c493b',
}

const peopleGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '8px',
}

const personCardStyle = {
  background: '#fffaf5',
  border: '1px solid rgba(176, 139, 105, 0.14)',
  borderRadius: 0,
  padding: '10px',
}

const personNameStyle = {
  margin: 0,
  color: '#433329',
  fontSize: '14px',
}

const personMetaStyle = {
  margin: '4px 0 0',
  color: '#6f5b4b',
  fontSize: '13px',
}

const emptyInlineStyle = {
  margin: 0,
  color: '#6f5b4b',
  fontSize: '13px',
}

const detailGridStyle = {
  display: 'grid',
  gap: '8px',
}

const detailItemStyle = {
  borderTop: '1px dashed rgba(176, 139, 105, 0.32)',
  paddingTop: '8px',
}

const detailLabelStyle = {
  margin: 0,
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#8a6f54',
}

const detailValueStyle = {
  margin: '4px 0 0',
  color: '#4f4035',
  whiteSpace: 'pre-wrap',
}

const emptyStyle = {
  margin: 0,
  padding: '14px',
  borderRadius: 0,
  border: '1px solid rgba(176, 139, 105, 0.16)',
  background: 'rgba(255, 251, 246, 0.9)',
  color: '#6f5b4b',
}
